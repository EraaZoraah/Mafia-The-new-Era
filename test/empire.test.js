import {catalog} from '../catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {installGame} from '../game.js';
import {career,careerRanks,familyAssets,familyPrice} from '../empire-catalog.js';
import {ranks,distinctionStep,prestigeThreshold} from '../progression.js';
import {releaseFee} from '../underworld.js';
import {respect,investmentTerms} from '../investments.js';

import {fixture} from './helpers/game-fixture.js';

test('both independent careers have 15 increasing ranks and persistent max-rank progress',()=>{
 for(const kind of ['drugs','guns']){assert.equal(careerRanks[kind].length,15);let previous=0;for(const r of careerRanks[kind]){assert.equal(career(kind,r.xp).name,r.name);assert.ok(r.multiplier>=previous);previous=r.multiplier;if(r.level>1)assert.equal(career(kind,r.xp-1).level,r.level-1)}assert.equal(career(kind,1e12).level,15);assert.equal(career(kind,1e12).nextXp,null)}
 assert.equal(respect('1000000000000000000000000').level,7);assert.equal(familyPrice(familyAssets.find(x=>x.id==='safehouse-modern'),2),4556250);
});

test('family purchasing and appointments require actual family roles, not normal ranks or forged input',t=>{
 const f=fixture(t),before=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 assert.equal(f.call('family/buy',{id:'safehouse-starter',role:'don',familyId:2,price:0},2).status,403);
 assert.equal(f.call('family/role',{userId:2,role:'capo'},2).status,403);
 assert.equal(f.call('family/role',{userId:3,role:'capo'}).status,404);
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,before);
 assert.equal(f.call('family/role',{userId:2,role:'capo'}).status,200);
 assert.equal(f.call('family/buy',{id:'safehouse-starter',familyId:2,price:0},2).status,200);
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,before-250000);
 assert.equal(f.q('SELECT quantity FROM family_assets WHERE family_id=1').quantity,1);
 assert.equal(f.q('SELECT COUNT(*) n FROM family_assets WHERE family_id=2').n,0);
 assert.equal(f.call('family/role',{userId:1,role:'member'},2).status,403);

 assert.equal(f.call('family/buy',{id:'safehouse-starter'},2).status,409);
 f.reset();assert.equal(f.call('family',undefined,2).body.family.role,'capo');assert.equal(f.call('family',undefined,2).body.family.assets.find(x=>x.id==='safehouse-starter').quantity,1);
});

test('donations conserve funds, build lasting respect without quotas, and never grant authority',t=>{
 const f=fixture(t),before=f.q('SELECT cash FROM users WHERE id=2').cash,treasury=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 for(const amount of [-1,0,1.5,'100',1e13])assert.equal(f.call('family/donate',{amount},2).status,400);
 assert.equal(f.call('family/donate',{amount:2000000000},2).status,200);
 assert.equal(f.call('family/donate',{amount:2000000000},2).status,200);
 assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,before-4000000000);
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,treasury+4000000000);
 const own=f.call('family',undefined,2).body.family;assert.equal(own.respect.donated,'4000000000');assert.equal(own.canManage,false);assert.ok(own.respect.payoutBonus>0);
 assert.equal(f.call('family/leave',{},2).status,200);assert.equal(f.call('families/join',{id:1},2).status,429);f.advance(3600001);assert.equal(f.call('families/join',{id:1},2).status,200);
 assert.equal(f.call('family',undefined,2).body.family.respect.donated,'4000000000');
 assert.equal(f.call('family/buy',{id:'suv-utility'},2).status,403);
});

test('shipment rewards, career XP, family split and cooldown are server-controlled',t=>{
 const f=fixture(t),before=f.q('SELECT cash,energy,xp FROM users WHERE id=2'),treasury=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 const offer=f.call('empire',undefined,2).body.shipments.find(s=>s.kind==='drugs'&&s.scope==='family'&&s.id==='local');
 const result=f.call('shipments/run',{kind:'drugs',scope:'family',tier:'local',reward:1e12,chance:1},2);assert.equal(result.status,200);assert.equal(result.body.success,true);
 assert.equal(result.body.familyReward,Math.floor(offer.min*.6));assert.equal(result.body.personalReward,Math.floor(offer.min*.4));
 const after=f.q('SELECT * FROM users WHERE id=2');assert.equal(after.cash,before.cash-1000+result.body.personalReward);assert.equal(after.energy,before.energy-20);assert.equal(after.xp,before.xp);assert.equal(after.drugs_xp,200);assert.equal(f.q('SELECT drugs_xp FROM families WHERE id=1').drugs_xp,200);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,treasury-1500+result.body.familyReward);
 assert.equal(f.call('shipments/run',{kind:'drugs',scope:'personal',tier:'local'},2).status,429);
 assert.equal(f.call('shipments/run',{kind:'guns',scope:'family',tier:'regional'},2).status,403);
 assert.equal(f.call('shipments/run',{kind:'guns',scope:'family',tier:'local'},4).status,403);
 assert.equal(f.call('shipments/run',{kind:'cash=0',scope:'personal',tier:'local'},2).status,400);
});

test('temporary muscle expires, consumes charges on failures, and cannot be stacked or spent on invalid attempts',t=>{
 const f=fixture(t);assert.equal(f.call('security/muscle',{package:'street'},2).status,200);
 assert.equal(f.call('security/muscle',{package:'elite'},2).status,409);
 assert.equal(f.call('shipments/run',{kind:'drugs',scope:'personal',tier:'international'},2).status,403);assert.equal(f.q('SELECT muscle_uses FROM users WHERE id=2').muscle_uses,3);
 const withEscort=f.call('empire',undefined,2).body.shipments[0].chance;f.dice(9999);
 assert.equal(f.call('shipments/run',{kind:'drugs',scope:'personal',tier:'local'},2).body.success,false);assert.equal(f.q('SELECT muscle_uses FROM users WHERE id=2').muscle_uses,2);
 f.advance(15*60000+1);const noEscort=f.call('empire',undefined,2).body;assert.equal(noEscort.personal.muscle.active,false);assert.ok(Math.abs(withEscort-noEscort.shipments[0].chance-.05)<1e-9);
 assert.equal(f.call('security/muscle',{package:'elite'},2).status,200);
});

test('permanent personal protection has a hard cap and changes actual PvP chance, damage and loot',t=>{
 const f=fixture(t);for(let i=0;i<10;i++)assert.equal(f.call('security/personal',{},2).status,200);assert.equal(f.call('security/personal',{},2).status,409);
 assert.equal(f.call('empire',undefined,2).body.personal.protection.chanceReduction,.4);
 f.dice(5000);assert.equal(f.call('pvp',{kind:'attack',target:'MemberOne'}).body.success,false);
 f.db.exec('DELETE FROM actions');f.run('UPDATE users SET protected_until=0,health=100,energy=100');f.dice(0);
 const before=f.q('SELECT cash FROM users WHERE id=2').cash,result=f.call('pvp',{kind:'rob',target:'MemberOne'},3);assert.equal(result.body.success,true);assert.ok(result.body.reward<=10000000000*.10*.70);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,before-result.body.reward);assert.equal(f.q('SELECT health FROM users WHERE id=2').health,93);
});

test('family defenses and vaults reduce real raids and preserve transferred money',t=>{
 const f=fixture(t),before=f.call('family/rivals').body.families.find(x=>x.id===2).defense;
 for(const item of familyAssets.filter(x=>x.category!=='Compounds'||x.id==='compound-palace'))f.run('INSERT INTO family_assets(family_id,item_id,quantity) VALUES(2,?,?)',item.id,item.limit);
 const after=f.call('family/rivals').body.families.find(x=>x.id===2).defense;assert.equal(after.reduction,.75);assert.equal(after.lossReduction,.7);assert.ok(after.reduction>before.reduction);
 f.dice(3000);assert.equal(f.call('family/raid',{familyId:2}).body.success,false);
 assert.equal(f.call('family/raid',{familyId:2}).status,429);f.advance(31*60000);f.run('UPDATE users SET energy=100 WHERE id=1');f.dice(0);
 f.call('family');const a=f.q('SELECT treasury FROM families WHERE id=1').treasury,b=f.q('SELECT treasury FROM families WHERE id=2').treasury;
 const result=f.call('family/raid',{familyId:2});assert.equal(result.status,200);assert.ok(result.body.reward<=Math.floor(b*.10*.30));assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury+f.q('SELECT treasury FROM families WHERE id=2').treasury,a+b);
 assert.equal(f.q('SELECT COUNT(*) n FROM family_assets WHERE family_id=2').n,familyAssets.filter(x=>x.category!=='Compounds'||x.id==='compound-palace').length);
});

test('mystery offers do not reroll on refresh, cost no energy, expire and pay only once to their owner',t=>{
 const f=fixture(t);assert.equal(f.call('mystery',undefined,2).body.offer,null);f.advance(6*60000);const offer=f.call('mystery',undefined,2).body.offer;assert.ok(offer);assert.deepEqual(f.call('mystery',undefined,2).body.offer,offer);f.reset();assert.equal(f.call('mystery',undefined,2).body.offer.id,offer.id);
 assert.equal(f.call('mystery/resolve',{id:offer.id,choice:'accept'},3).status,409);
 f.run('UPDATE users SET energy=0,energy_at=? WHERE id=2',f.time());const before=f.q('SELECT cash FROM users WHERE id=2').cash;
 const result=f.call('mystery/resolve',{id:offer.id,choice:'accept'},2);assert.equal(result.status,200);assert.equal(result.body.reward,offer.reward_min);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,before+offer.reward_min);assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,0);assert.equal(f.call('mystery/resolve',{id:offer.id,choice:'accept'},2).status,409);
 f.advance(21*60000);const expired=f.call('mystery',undefined,2).body.offer;assert.notEqual(expired.id,offer.id);assert.equal(f.call('mystery/resolve',{id:offer.id,choice:'accept'},2).status,409);f.advance(11*60000);assert.equal(f.call('mystery/resolve',{id:expired.id,choice:'accept'},2).status,409);assert.equal(f.call('mystery',undefined,2).body.offer,null);
});

test('investment quotes fluctuate over time, stay stable on refresh, and longer terms have higher bounded rates',t=>{
 const f=fixture(t),first=f.call('investments').body.accounts[0];assert.deepEqual(f.call('investments').body.accounts[0].quotes,first.quotes);
 for(let i=1;i<first.quotes.length;i++)assert.ok(first.quotes[i].rateBps>first.quotes[i-1].rateBps);
 assert.equal(first.quotes.at(-1).hours,72);assert.ok(first.quotes.at(-1).rateBps<=800);
 f.high(true);f.advance(16*60000);const next=f.call('investments').body.accounts[0].quotes;assert.equal(next.at(-1).rateBps,800);assert.notEqual(first.quotes[0].rateBps,next[0].rateBps);
 for(const term of investmentTerms)assert.ok(term.maxBps<=800);
});

test('personal investments lock principal, enforce the aggregate billion limit, and claim principal plus integer interest once',t=>{
 const f=fixture(t);f.run('UPDATE users SET cash=200000000000 WHERE id=1');const quote=f.call('investments').body.accounts[0].quotes[0],before=f.q('SELECT cash FROM users WHERE id=1').cash;
 const body={scope:'personal',amount:100000000000,hours:quote.hours,rateBps:quote.rateBps};
 assert.equal(f.call('investments/open',{...body,rateBps:9999}).status,409);assert.equal(f.call('investments/open',{...body,hours:73}).status,400);
 const opened=f.call('investments/open',body);assert.equal(opened.status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-body.amount);
 assert.equal(f.call('investments/open',body).status,409);assert.equal(f.call('investments/claim',{scope:'personal',id:opened.body.id}).status,409);
 f.advance(6*3600000);assert.equal(f.call('investments/claim',{scope:'personal',id:opened.body.id},2).status,409);
 const result=f.call('investments/claim',{scope:'personal',id:opened.body.id});assert.equal(result.status,200);assert.equal(result.body.interest,Math.floor(body.amount*quote.rateBps/10000));assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before+result.body.interest);assert.equal(f.call('investments/claim',{scope:'personal',id:opened.body.id}).status,409);
});

test('family investments use the shared balance and allow only current Don/Capos to open and collect',t=>{
 const f=fixture(t);f.run('UPDATE families SET treasury=200000000000 WHERE id=1');const quote=f.call('investments',undefined,2).body.accounts.find(a=>a.scope==='family').quotes.at(-1),body={scope:'family',amount:100000000000,hours:72,rateBps:quote.rateBps};
 assert.equal(f.call('investments/open',body,2).status,403);f.call('family/role',{userId:2,role:'capo'});const before=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 const opened=f.call('investments/open',body,2);assert.equal(opened.status,200);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,before-body.amount);
 assert.equal(f.call('investments/open',{...body,amount:1}).status,409);f.advance(72*3600000);f.call('family/role',{userId:2,role:'member'});assert.equal(f.call('investments/claim',{scope:'family',id:opened.body.id},2).status,403);
 assert.equal(f.call('investments/claim',{scope:'family',id:opened.body.id},3).status,409);
 const result=f.call('investments/claim',{scope:'family',id:opened.body.id});assert.equal(result.status,200);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,before+result.body.interest);
});

test('matured investments remain claimable if the receiving wallet is full',t=>{
 const f=fixture(t),quote=f.call('investments').body.accounts[0].quotes[0],opened=f.call('investments/open',{scope:'personal',amount:1000000,hours:6,rateBps:quote.rateBps});f.advance(6*3600000);f.run('UPDATE users SET cash=1000000000000000 WHERE id=1');assert.equal(f.call('investments/claim',{scope:'personal',id:opened.body.id}).status,409);assert.equal(f.q('SELECT claimed FROM investments WHERE id=?',opened.body.id).claimed,0);
 f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('investments/claim',{scope:'personal',id:opened.body.id}).status,200);
});

test('yachts are unique personal assets with a title and a maritime operation',t=>{
 const f=fixture(t),items=f.call('catalog').body.catalog.filter(x=>x.category==='yacht');assert.equal(items.length,5);
 assert.equal(f.call('action',{kind:'maritime'}).status,403);assert.equal(f.call('assets/buy',{category:'yacht',id:'harbor'}).status,201);assert.equal(f.call('assets/buy',{category:'yacht',id:'harbor'}).status,409);
 assert.equal(f.q("SELECT quantity FROM possessions WHERE user_id=1 AND category='yacht'").quantity,1);f.run('UPDATE users SET xp=2000 WHERE id=1');assert.equal(f.call('action',{kind:'maritime'}).status,200);assert.equal(f.call('title',{title:'yacht:harbor'}).status,200);f.reset();assert.equal(f.q("SELECT quantity FROM possessions WHERE user_id=1 AND category='yacht'").quantity,1);assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('Owner can edit self, all careers, protection and cooldowns, while preserving the last Owner',t=>{
 const f=fixture(t);
 assert.equal(f.call('admin/player',{id:1,changes:{cash:123,drugs_xp:110000,guns_xp:78000,personal_protection:10,muscle_uses:8,muscle_bonus:1500,muscle_until:f.time()+60000,cooldowns:[{kind:'shipment:drugs',available_at:f.time()+12345}]}}).status,200);
 assert.equal(f.call('admin/player',{id:1,changes:{mysteryOffer:{kind:'bank',reward_min:10,reward_max:20,expires_at:f.time()+60000}}}).status,200);assert.equal(f.call('admin/player?id=1').body.mysteryOffer.kind,'bank');assert.equal(f.call('admin/player',{id:1,changes:{mysteryOffer:{kind:'bank',reward_min:30,reward_max:20,expires_at:f.time()+60000}}}).status,400);assert.equal(f.call('admin/player',{id:1,changes:{mysteryOffer:null}}).status,200);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,123);assert.equal(f.call('admin/player?id=1').body.player.personal_protection,10);
 assert.equal(f.call('admin/player',{id:1,changes:{role:'player'}}).status,409);
 assert.equal(f.call('admin/player',{id:4,changes:{role:'owner'}}).status,200);
 assert.equal(f.call('admin/player',{id:1,changes:{cash:7,muscle_uses:9}}).status,400);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,123);
 assert.equal(f.call('admin/player',{id:2,changes:{cash:1}},2).status,403);
 f.run("UPDATE family_members SET family_role='capo' WHERE user_id=2");assert.equal(f.call('admin/player',{id:2,changes:{familyId:1}}).status,200);assert.equal(f.q('SELECT family_role FROM family_members WHERE user_id=2').family_role,'capo');
});
test('Owner family edits transfer leadership and holdings atomically and record full audit history',t=>{
 const f=fixture(t),changes={name:'New Dynasty',treasury:123456,drugs_xp:110000,guns_xp:78000,don:'MemberOne',members:[{username:'MemberOne',role:'member',donated:'10000000000'},{username:'DonOne',role:'capo',donated:'0'},{username:'Outsider',role:'member',donated:'500000'}],assets:[{item_id:'compound-palace',quantity:1},{item_id:'suv-armored',quantity:4}],shield_until:f.time()+60000};
 assert.equal(f.call('admin/family',{id:1,changes},2).status,403);assert.equal(f.call('admin/family',{id:1,changes}).status,200);
 const d=f.call('admin/family?id=1').body;assert.equal(d.don,'MemberOne');assert.equal(d.family.treasury,123456);assert.equal(d.assets.length,2);assert.equal(d.audit.length,1);assert.equal(d.members.length,3);
 assert.equal(f.call('admin/family',{id:1,changes:{treasury:1,assets:[{item_id:'compound-palace',quantity:2}]}}).status,400);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,123456);
 assert.equal(f.call('admin/family',{id:1,changes:{don:'DonTwo',members:[{username:'DonTwo',role:'member',donated:'0'}]}}).status,400);
 assert.equal(f.call('admin/families',undefined,2).status,403);
});
test('Owner investment editing obeys account boundaries and caps without silently moving funds',t=>{
 const f=fixture(t),changes={principal:100000000000,rateBps:800,openedAt:f.time(),maturesAt:f.time()+72*3600000,claimed:0},cash=f.q('SELECT cash FROM users WHERE id=2').cash;
 assert.equal(f.call('admin/investment',{scope:'personal',targetId:2,operation:'save',changes},2).status,403);
 assert.equal(f.call('admin/investment',{scope:'personal',targetId:2,operation:'save',changes}).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,cash);
 const id=f.call('admin/investments?scope=personal&id=2').body.investments[0].id;
 assert.equal(f.call('admin/investment',{scope:'personal',targetId:2,operation:'save',changes}).status,409);
 assert.equal(f.call('admin/investment',{scope:'family',targetId:1,id,operation:'delete'}).status,404);
 assert.equal(f.call('admin/investment',{scope:'personal',targetId:2,id,operation:'delete'}).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,cash);
});

test('cash and energy gifts validate recipient, capacity and retry keys without creating resources',t=>{
 const f=fixture(t),send=(kind,amount,recipient='MemberOne',requestKey='unique-transfer-0001')=>f.call('transfers',{kind,amount,recipient,requestKey});
 f.run('UPDATE users SET energy=50,energy_at=?',Date.now());
 assert.equal(send('energy',20).status,200);assert.equal(f.q('SELECT energy FROM users WHERE id=1').energy,30);assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,70);
 assert.equal(send('energy',20).body.duplicate,true);assert.equal(send('energy',21).status,409);
 for(const amount of [0,-1,1.5,'2',1001])assert.equal(send('energy',amount,'MemberOne','invalid-transfer-001').status,400);
 assert.equal(send('cash',1,'DonOne','self-transfer-0001').status,400);assert.equal(send('cash',1,'Missing','missing-transfer-001').status,400);
 f.run('UPDATE users SET banned=1 WHERE id=2');assert.equal(send('cash',1,'MemberOne','banned-transfer-001').status,400);f.run('UPDATE users SET banned=0,cash=1000000000000000 WHERE id=2');
 assert.equal(send('cash',1,'MemberOne','full-cash-transfer-01').status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,10000000000);
 f.run('UPDATE users SET energy=99,energy_at=? WHERE id=2',Date.now());assert.equal(send('energy',2,'MemberOne','full-energy-transfer01').status,409);assert.equal(f.q('SELECT energy FROM users WHERE id=1').energy,30);
 assert.equal(send('energy',1,'MemberOne','full-energy-transfer02').status,200);assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,100);
 assert.equal(f.call('transfers',undefined,4).body.history.length,0);assert.equal(f.call('transfers',undefined,2).body.history.length,2);
 assert.equal(send('energy',30,'Outsider','overspend-transfer01').status,409);
});

test('rank energy stays bounded at 1000 while private quantity limits are enforced for Owner',t=>{
 const f=fixture(t);const possessions=catalog.map(a=>({category:a.category,item_id:a.id,quantity:1}));
 assert.equal(f.call('admin/player',{id:1,changes:{possessions,xp:ranks.at(-1).xp}}).status,200);
 assert.equal(f.q('SELECT energy FROM users WHERE id=1').energy,1000);
 assert.equal(f.call('admin/player',{id:1,changes:{xp:prestigeThreshold(1)}}).status,200);
 assert.equal(f.q('SELECT energy FROM users WHERE id=1').energy,1000);
 assert.equal(f.call('admin/player',{id:1,changes:{possessions:[{category:'car',item_id:'fiat500',quantity:2}]}}).status,400);
});

test('failed violence costs health and successful liquidation causes an exact 72-hour protected coma',t=>{
 const f=fixture(t);f.high(true);f.dice(9999);assert.equal(f.call('action',{kind:'assault'}).body.healthLost,15);assert.equal(f.q('SELECT health FROM users WHERE id=1').health,85);
 f.run('UPDATE users SET xp=4000,energy=100,health=100 WHERE id=1');assert.equal(f.call('action',{kind:'hit'}).body.healthLost,25);
 f.run('UPDATE users SET health=100,energy=100 WHERE id=1');f.dice(0);f.run('UPDATE users SET personal_protection=10 WHERE id=2');const r=f.call('pvp',{kind:'liquidate',target:'MemberOne'},3);assert.equal(r.body.success,true);
 const target=f.q('SELECT * FROM users WHERE id=2');assert.equal(target.health,0);assert.equal(target.hospital_until-f.time(),72*3600000);assert.equal(target.coma_until,target.hospital_until);assert.equal(f.call('custody').body.stays.find(c=>c.user_id===2).cost,1000000);
 for(const [path,body] of [['action',{kind:'courier'}],['assets/buy',{category:'car',id:'fiat500'}],['shipments/run',{kind:'drugs',scope:'personal',tier:'local'}],['respect/give',{target:'DonOne'}],['investments/claim',{scope:'personal',id:1}],['families',{name:'Forbidden'}]])assert.equal(f.call(path,body,2).status,409,path);
 f.advance(3600000);assert.equal(f.call('admin/player?id=2').body.player.health,0);assert.ok(f.call('notifications',undefined,2).body.notifications.some(x=>/coma/.test(x.title)));
});

test('coma fees decline, accrued income is preserved and no passive income accrues during the stay',t=>{
 const f=fixture(t);f.run('UPDATE users SET xp=0 WHERE id=2');f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(2,'business','coffee',1,?,?)",f.time()-120000,f.time()-120000);
 // Owner status editing uses the same suspension ledger and validates incompatible states.
 assert.equal(f.call('admin/player',{id:2,changes:{coma_until:f.time()+72*3600000}}).status,200);
 const before=f.q('SELECT cash,pending_income FROM users WHERE id=2');f.advance(36*3600000);let p=f.call('admin/player?id=2').body.player;assert.equal(p.cash,before.cash);assert.equal(p.pending_income,before.pending_income);assert.equal(p.health,0);
 const stay=f.call('custody').body.stays.find(c=>c.user_id===2);assert.equal(stay.cost,500000);
 f.run('UPDATE users SET cash=0,bank=100000000 WHERE id=2');assert.equal(f.call('custody/pay',{id:stay.id,maxCost:50000000,source:'bank'},2).status,200);assert.equal(f.q('SELECT bank FROM users WHERE id=2').bank,99500000);assert.equal(f.call('custody/pay',{id:stay.id,maxCost:50000000,source:'bank'},2).status,409);
 p=f.call('admin/player?id=2').body.player;assert.equal(p.health,100);const releasedCash=p.cash;f.advance(3600000);assert.equal(f.call('admin/player?id=2').body.player.cash,releasedCash+120);
});

test('uncollected passive income survives an incoming arrest and offline natural release excludes the sentence',t=>{
 const f=fixture(t);f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(2,'business','coffee',1,?,?)",f.time()-120000,f.time()-120000);
 const original=f.q('SELECT cash FROM users WHERE id=2').cash;assert.equal(f.call('custody/report',{target:'MemberOne',hours:1}).status,200);let p=f.call('admin/player?id=2').body.player;assert.equal(p.cash,original-100000);assert.equal(p.pending_income,4);
 f.advance(30*60000);p=f.call('admin/player?id=2').body.player;assert.equal(p.pending_income,4);assert.equal(p.cash,original-100000);
 f.advance(90*60000);p=f.call('admin/player?id=2').body.player;assert.equal(p.prison_until,0);assert.equal(p.pending_income,0);assert.equal(p.cash,original-100000+124); // 62 active minutes at current rank, including fractional carry.
 assert.equal(f.call('custody/report',{target:'MemberOne',hours:1},3).status,409);
});

test('release payments surrender only selected assets, conserve change and enforce family authority',t=>{
 const f=fixture(t);f.call('admin/player',{id:1,changes:{possessions:[{category:'home',item_id:'apartment',quantity:1}]}});f.call('custody/report',{target:'MemberOne',hours:1});const stay=f.call('custody').body.stays[0];
 assert.equal(f.call('custody/pay',{id:stay.id,maxCost:stay.cost,source:'family'},4).status,403);
 const bank=f.q('SELECT bank FROM users WHERE id=1').bank;assert.equal(f.call('custody/pay',{id:stay.id,maxCost:stay.cost,source:'assets',assets:[{category:'home',item_id:'apartment',quantity:1}]}).status,200);
 assert.equal(f.q("SELECT quantity FROM possessions WHERE user_id=1 AND item_id='apartment'"),undefined);assert.equal(f.q('SELECT bank FROM users WHERE id=1').bank,bank+1250000-stay.cost);
 f.call('admin/player',{id:2,changes:{prison_until:f.time()+3600000}});const second=f.call('custody').body.stays.find(c=>c.user_id===2);const treasury=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 assert.equal(f.call('custody/pay',{id:second.id,maxCost:second.cost,source:'family'}).status,200);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,treasury-second.cost);
});

test('breakouts have charged outcomes, family permissions and six-hour failure arrest',t=>{
 const f=fixture(t);f.call('custody/report',{target:'MemberOne',hours:12});const id=f.call('custody').body.stays[0].id;
 assert.equal(f.call('custody/breakout',{id,scope:'family'},4).status,403);let rolls=0;f.dice(()=>rolls++===0?9999:0);const before=f.q('SELECT cash FROM users WHERE id=1').cash;
 const failed=f.call('custody/breakout',{id,scope:'personal'});assert.equal(failed.body.success,false);assert.equal(failed.body.arrested,true);assert.equal(f.q('SELECT prison_until FROM users WHERE id=1').prison_until-f.time(),6*3600000);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-2000000);assert.equal(f.call('custody/breakout',{id,scope:'personal'}).status,409);
 f.dice(0);const rescued=f.call('custody/breakout',{id,scope:'personal'},4);assert.equal(rescued.body.success,true);assert.equal(f.q('SELECT prison_until FROM users WHERE id=2').prison_until,0);assert.equal(f.call('custody/breakout',{id,scope:'personal'},4).status,409);
});

test('respect rewards five distinct recipients per UTC day, caps energy and unlocks actual bonuses',t=>{
 const f=fixture(t);for(let id=5;id<=8;id++)f.run('INSERT INTO users(id,username) VALUES(?,?)',id,'Respect'+id);f.run('UPDATE users SET energy=95,energy_at=? WHERE id=1',f.time());const cash=f.q('SELECT cash FROM users WHERE id=1').cash;
 const names=['MemberOne','DonTwo','Outsider','Respect5','Respect6'];for(const [i,target] of names.entries()){const r=f.call('respect/give',{target});assert.equal(r.status,200);assert.equal(r.body.energy,i===0?5:0)}
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash+5000);assert.equal(f.call('respect/give',{target:'Respect7'}).status,429);assert.equal(f.call('respect/give',{target:'DonOne'},2).status,200);
 f.advance(86400000);assert.equal(f.call('respect/give',{target:'MemberOne'}).status,200);assert.equal(f.call('respect/give',{target:'MemberOne'}).status,409);assert.equal(f.call('respect/give',{target:'DonOne'}).status,400);
 const before=f.call('catalog').body.crimes[0].payout.min;f.call('admin/player',{id:1,changes:{respect_received:2500}});const after=f.call('catalog').body.crimes[0].payout.min;assert.ok(after>before);assert.equal(f.call('respect').body.standing.level,10);
});

test('master compound upgrades use a 90% trade-in, and public rankings do not expose private account fields',t=>{
 const f=fixture(t);const initial=f.q('SELECT treasury FROM families WHERE id=1').treasury;assert.equal(f.call('family/buy',{id:'compound-yard'}).status,200);
 assert.equal(f.call('family').body.family.assets.find(a=>a.id==='compound-estate').nextPrice,33650000);assert.equal(f.call('family/buy',{id:'compound-estate'}).status,200);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,initial-1500000-33650000);assert.equal(f.q('SELECT COUNT(*) n FROM family_assets WHERE family_id=1').n,1);assert.equal(f.call('family/buy',{id:'compound-yard'}).status,409);
 assert.equal(f.call('admin/family',{id:1,changes:{assets:[{item_id:'compound-yard',quantity:1},{item_id:'compound-estate',quantity:1}]}}).status,400);
 assert.equal(f.call('admin/economy',undefined,2).status,403);const totals=f.call('admin/economy').body.totals;assert.equal(totals.players.count,3);assert.equal(totals.families.assetCount,'3');assert.equal(totals.families.assets,'35000000');const ranking=f.call('underworld',undefined,2).body;assert.equal(ranking.players.length,4);assert.ok(ranking.players[0].rank);assert.equal('bank' in ranking.players[0],false);assert.equal('email' in ranking.players[0],false);
});

test('personal investment interest excludes custody time and invalid custody payloads are rejected',t=>{
 const f=fixture(t),a=f.call('investments',undefined,2).body.accounts[0],quote=a.quotes.find(x=>x.hours===6);f.call('investments/open',{scope:'personal',amount:1000000,hours:6,rateBps:quote.rateBps},2);
 f.call('custody/report',{target:'MemberOne',hours:1});f.advance(6*3600000);const id=f.q('SELECT id FROM investments WHERE user_id=2').id;
 const result=f.call('investments/claim',{scope:'personal',id},2);assert.equal(result.status,200);assert.equal(result.body.interest,Math.floor(1000000*quote.rateBps/10000*5/6));
 for(const path of ['custody/pay','custody/report','custody/breakout','respect/give'])assert.equal(f.call(path,{}).status,400,path);
});

test('public profiles expose common gameplay fields without private records or collecting target income',t=>{
 const f=fixture(t);f.run("UPDATE users SET cash=12345,bank=98765,password='secret',email='private@example.com',respect_received=35 WHERE id=2");
 f.run("INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at,quantity) VALUES(2,'business','coffee',?,?,2)",f.time()-3600000,f.time()-3600000);
 const before=f.q('SELECT cash FROM users WHERE id=2').cash;
 const r=f.call('profiles/2');assert.equal(r.status,200);const p=r.body.player;
 assert.equal(p.cash,12345);assert.equal(p.family.role,'Member');assert.equal(p.assets[0].name,'Neighborhood coffeeshop');assert.equal(p.assets[0].quantity,2);assert.equal(p.respect.received,35);assert.ok(p.assetValue>0);assert.equal(r.body.canEdit,false);assert.equal(r.body.options,undefined);
 for(const key of ['password','email','bank','role','promotion','events','sessions'])assert.equal(p[key],undefined,key+' must stay private');
 assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,before);
 assert.equal(f.call('profiles/1').body.player.family.role,'Don');assert.equal(f.call('profiles/4').body.player.family,null);
 assert.equal(f.call('profiles/0').status,400);assert.equal(f.call('profiles/999999').status,404);
 f.run('UPDATE users SET banned=1 WHERE id=2');assert.equal(f.call('profiles/2').status,404);
});
test('profile styling is self-only, validates preset choices and title ownership, and survives migration',t=>{
 const f=fixture(t),style={theme:'silver',emblem:'rose',banner:'estate',bio:'A quiet empire.',title:''};
 assert.equal(f.call('profile/settings',{...style,user_id:1},2).status,400);
 assert.equal(f.call('profile/settings',{...style,theme:'url(evil)'},2).status,400);
 assert.equal(f.call('profile/settings',{...style,bio:'x'.repeat(161)},2).status,400);
 assert.equal(f.call('profile/settings',{...style,title:'jet:imperium'},2).status,403);
 assert.equal(f.call('profile/settings',style,2).status,200);
 f.reset();assert.equal(f.call('profiles/2').body.player.appearance.bio,'A quiet empire.');assert.equal(f.call('profiles/1').body.player.appearance.theme,'gold');
 assert.equal(f.call('profiles/2',{},2).status,405);
 f.run('UPDATE users SET prison_until=? WHERE id=2',f.time()+3600000);
 assert.equal(f.call('profile/settings',{...style,bio:'Waiting for release.'},2).status,200);
 assert.equal(f.call('profiles/2',undefined,2).body.canEdit,true);
});

test('Admins can manage ordinary players but cannot reach Owner through any administrative account path',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=2");
 assert.equal(f.call('admin/player',{id:4,changes:{cash:123456}},2).status,200);
 assert.equal(f.call('admin/player?id=1',undefined,2).status,403);
 for(const changes of [{role:'owner'},{role:'player'}])assert.equal(f.call('admin/player',{id:2,changes},2).status,403);
 assert.equal(f.call('admin/player',{id:4,changes:{role:'owner'}},2).status,403);
 assert.equal(f.call('admin/user',{id:1,changes:{cash:0}},2).status,403);
 assert.equal(f.call('admin/investment',{scope:'personal',targetId:1,operation:'delete',id:1},2).status,403);
 assert.equal(f.call('admin/family',{id:1,changes:{treasury:0}},2).status,200);
 assert.equal(f.call('admin/family',{id:2,changes:{don:'DonOne'}},2).status,403);
 assert.equal(f.call('admin/player',{id:4,changes:{role:'moderator'}}).status,403);
 assert.equal(f.q('SELECT role FROM users WHERE id=1').role,'owner');assert.equal(f.q('SELECT cash FROM users WHERE id=4').cash,123456);
});
test('robbery has no fixed cap; perfect hostage payout scales with rank and respects conservation',t=>{
 const f=fixture(t);f.run('UPDATE users SET cash=100000000,personal_protection=0 WHERE id=2');const r=f.call('pvp',{kind:'rob',target:'MemberOne'},3);assert.equal(r.body.reward,10000000);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,90000000);
 f.advance(600001);f.run('UPDATE users SET energy=100 WHERE id=1');f.high(true);f.run('UPDATE users SET xp=?,cash=100000000,protected_until=0 WHERE id=2',ranks.at(-1).xp);const high=f.call('pvp',{kind:'hostage',target:'MemberOne'},3);assert.equal(high.body.reward,10000000);assert.equal(high.body.quality,100);
 f.advance(600001);f.run('UPDATE users SET energy=100 WHERE id=1');f.run('UPDATE users SET xp=650,protected_until=0,captured_until=0 WHERE id=2');const low=f.call('pvp',{kind:'hostage',target:'MemberOne'},3);assert.ok(low.body.reward<high.body.reward);assert.ok(low.body.chance>high.body.chance);
});
test('failed crimes apply bounded fines or severity-scaled arrests and increment honest statistics',t=>{
 const f=fixture(t);f.run('UPDATE users SET xp=0 WHERE id=1');f.dice(9999);const low=f.call('action',{kind:'courier'});assert.equal(low.body.prisonMinutes,5);assert.equal(f.call('statistics').body.arrests,1);assert.equal(f.call('statistics').body.attempts.attempts,1);
 f.advance(3600001);f.run('UPDATE users SET energy=1000,xp=1350000 WHERE id=1');
 const catalog=f.call('catalog').body.crimes,last=catalog.at(-1);if(last.requires)f.run('INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at,quantity) VALUES(?,?,?,?,?,1)',1,last.requires,last.requires==='jet'?'swift':'coffee',f.time(),f.time());
 // Use a low rank with a high-rank crime available to exercise failure despite max-rank guarantees.
 f.run('UPDATE users SET xp=? WHERE id=1',last.requiredXp);const high=f.call('action',{kind:last.id});assert.equal(high.status,200);assert.equal(high.body.prisonMinutes,60);
 f.advance(3600001);f.high(true);f.run('UPDATE users SET energy=100,cash=1,xp=0 WHERE id=1');const fine=f.call('action',{kind:'courier'});assert.ok(fine.body.fine>0);assert.equal(fine.body.prisonMinutes,0);assert.ok(f.q('SELECT cash FROM users WHERE id=1').cash>=0);assert.equal(f.call('statistics').body.attempts.successes,0);
});
test('conversation history is participant scoped, unread receipts are validated and prefix search is literal',t=>{
 const f=fixture(t);f.run('INSERT INTO messages(id,sender_id,recipient_id,body,created_at) VALUES(1,1,2,?,?),(2,2,1,?,?),(3,3,4,?,?)','hello',f.time(),'reply',f.time(),'private',f.time());
 const d=f.call('conversation?id=2').body;assert.equal(d.messages.length,2);assert.equal(f.call('conversation?id=3').body.messages.length,0);assert.equal(f.call('inbox').body.threads[0].unread,1);
 assert.equal(f.call('conversation/read',{peerId:2,lastId:3}).status,400);assert.equal(f.call('conversation/read',{peerId:2,lastId:2}).status,200);assert.equal(f.call('inbox').body.threads[0].unread,0);
 assert.deepEqual(f.call('players/search?q=Mem').body.players.map(x=>x.username),['MemberOne']);assert.equal(f.call('players/search?q=%25').body.players.length,0);
});
test('family policy, invitations, application approval and exponential capacity are enforced on the server',t=>{
 const f=fixture(t),style={mode:'invite',theme:'gold',crest:'eagle',motto:'Loyalty'};
 assert.equal(f.call('family/preferences',style,2).status,403);assert.equal(f.call('family/preferences',style).status,200);
 assert.equal(f.call('families/join',{id:1},4).status,403);assert.equal(f.call('family/invite',{target:'Outsider'}).status,200);assert.equal(f.call('families/join',{id:1},4).status,200);
 assert.equal(f.call('families/join',{id:1},4).status,409);
 f.run('DELETE FROM family_members WHERE user_id=4');assert.equal(f.call('family/preferences',{...style,mode:'application'}).status,200);assert.equal(f.call('families/join',{id:1},4).body.pending,true);assert.equal(f.q('SELECT 1 FROM family_members WHERE user_id=4'),undefined);
 assert.equal(f.call('family/respond',{userId:4,decision:'accept'},2).status,403);assert.equal(f.call('family/respond',{userId:4,decision:'accept'}).status,200);
 assert.equal(f.call('family/dashboard').body.family.capacity,15);f.run('UPDATE families SET drugs_xp=?,guns_xp=? WHERE id=1',careerRanks.drugs.at(-1).xp,careerRanks.guns.at(-1).xp);assert.equal(f.call('family/dashboard').body.family.capacity,30);
 f.run("INSERT INTO family_assets VALUES(1,'compound-palace',1)");assert.equal(f.call('family/dashboard').body.family.capacity,50);
});
test('last family places cannot be overbooked and family raid counters follow actual attempts',t=>{
 const f=fixture(t);for(let id=5;id<=17;id++){f.run('INSERT INTO users(id,username) VALUES(?,?)',id,'Crew'+id);f.run('INSERT INTO family_members(user_id,family_id) VALUES(?,1)',id);}
 assert.equal(f.call('families/join',{id:1},4).status,409);assert.equal(f.q('SELECT COUNT(*) n FROM family_members WHERE family_id=1').n,15);
 assert.equal(f.call('family/raid',{familyId:2}).status,200);assert.equal(f.call('family/dashboard',undefined,3).body.family.attacksReceived,1);assert.equal(f.call('family/dashboard').body.family.raids.successes,1);
});
