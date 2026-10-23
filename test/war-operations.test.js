import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {familyAssets} from '../empire-catalog.js';
const start=f=>{f.run("INSERT INTO family_assets VALUES(1,'territory-block',1),(2,'territory-industry',2)");assert.equal(f.call('family/war/declare',{familyId:2}).status,200)};
const team=f=>{assert.equal(f.call('family/war/team/create',{familyId:2}).status,200);return f.q('SELECT id FROM war_teams').id};

test('territory aggregate migration permits holdings across cities while preserving authority and bounds',t=>{
 const f=fixture(t);f.run('UPDATE families SET treasury=1000000000000');
 assert.equal(f.call('family/buy',{id:'territory-block',quantity:25},2).status,403);
 const power=f.call('family/dashboard').body.family.power.total;
 for(const item of familyAssets.filter(a=>a.category==='Territory')){assert.equal(item.limit,525);f.run('INSERT INTO family_assets VALUES(?,?,?)',1,item.id,25);}
 assert.throws(()=>f.run("UPDATE family_assets SET quantity=526 WHERE item_id='territory-block'"));
 f.reset();assert.equal(f.call('family').body.family.territory.reduce((n,x)=>n+x.quantity,0),100);assert.ok(f.call('family/dashboard').body.family.power.total>power);
 assert.equal(f.call('family/possessions').body.family.territory[0].quantity,25);
});

test('capture transfers exactly one territory, with cost, score, limits and replay protection',t=>{
 const f=fixture(t);start(f);const before=f.q('SELECT SUM(treasury) total FROM families').total;
 const result=f.call('family/war/capture',{familyId:2,itemId:'territory-industry'});assert.equal(result.status,200);assert.equal(result.body.success,true);
 assert.equal(f.q("SELECT quantity FROM family_assets WHERE family_id=1 AND item_id='territory-industry'").quantity,1);assert.equal(f.q("SELECT quantity FROM family_assets WHERE family_id=2 AND item_id='territory-industry'").quantity,1);
 assert.equal(f.q('SELECT attacker_score FROM family_wars').attacker_score,3);assert.equal(f.q('SELECT SUM(treasury) total FROM families').total,before-2500000);
 assert.equal(f.call('family/war/capture',{familyId:2,itemId:'territory-industry'}).status,429);
 f.advance(900001);f.run("UPDATE family_assets SET quantity=25 WHERE family_id=1 AND item_id='territory-industry'");assert.equal(f.call('family/war/capture',{familyId:2,itemId:'territory-industry'}).status,200);
 f.advance(900001);assert.equal(f.call('family/war/capture',{familyId:2,itemId:'compound-palace'}).status,409);
});
test('sabotage halves defense temporarily, does not stack and expires on surrender',t=>{
 const f=fixture(t);start(f);const get=()=>f.call('family/rivals').body.families[0].defense;
 const before=get();assert.equal(f.call('family/war/sabotage',{familyId:2},2).status,403);
 assert.equal(f.call('family/war/sabotage',{familyId:2}).body.success,true);assert.equal(get().reduction,before.reduction*.5);assert.equal(get().lossReduction,before.lossReduction);
 f.advance(1800001);assert.equal(f.call('family/war/sabotage',{familyId:2}).status,409);
 assert.equal(f.call('family/war/surrender',{},3).status,200);assert.equal(get().reduction,before.reduction);
});
test('joint assault needs consent, current eligible membership, resources and one atomic launch',t=>{
 const f=fixture(t);start(f);const id=team(f),body={teamId:id};
 assert.equal(f.call('family/war/team/launch',body).status,409);assert.equal(f.call('family/war/team/join',body,3).status,409);
 assert.equal(f.call('family/war/team/join',body,2).status,200);assert.equal(f.call('family/war/team/join',body,2).status,409);
 f.run('UPDATE users SET banned=1 WHERE id=2');assert.equal(f.call('family/war/team/launch',body).status,409);f.run('UPDATE users SET banned=0,prison_until=? WHERE id=2',f.time()+3600000);assert.equal(f.call('family/war/team/launch',body).status,409);f.run('UPDATE users SET prison_until=0 WHERE id=2');
 const before=f.q('SELECT SUM(treasury) total FROM families').total,energy=f.q('SELECT energy FROM users WHERE id=2').energy,ammo=f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo;
 const r=f.call('family/war/team/launch',body);assert.equal(r.status,200);assert.equal(r.body.success,true);assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,energy-35);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo,ammo-100);assert.equal(f.q('SELECT SUM(treasury) total FROM families').total,before-2000000);
 assert.equal(f.call('family/dashboard').body.family.warStats.successes,1);assert.equal(f.q('SELECT attacker_score FROM family_wars').attacker_score,2);assert.equal(f.call('family/war/team/launch',body).status,409);
});
test('team expiry and membership changes spend nothing; expired wars reject special operations',t=>{
 const f=fixture(t);start(f);const id=team(f);assert.equal(f.call('family/war/team/join',{teamId:id},2).status,200);
 f.run('DELETE FROM family_members WHERE user_id=2');const cash=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 assert.equal(f.call('family/war/team/launch',{teamId:id}).status,403);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,cash);
 f.advance(900001);assert.equal(f.call('family/rivals').body.family.teams[0].status,'expired');assert.equal(f.call('family/war/team/launch',{teamId:id}).status,409);
 f.advance(86400001);assert.equal(f.call('family/war/sabotage',{familyId:2}).status,409);
});
test('victory bonus changes family shipment share only, is bounded and no-battle surrender grants none',t=>{
 const f=fixture(t);start(f);assert.equal(f.call('family/war/sabotage',{familyId:2}).body.success,true);assert.equal(f.call('family/war/surrender',{},3).status,200);
 const stats=f.call('family/dashboard').body.family.warStats;assert.equal(stats.wins,1);assert.equal(stats.bonusUntil,f.time()+86400000);
 const offer=f.call('empire',undefined,2).body.shipments.find(s=>s.kind==='drugs'&&s.scope==='family'&&s.id==='local');assert.equal(offer.familyVictoryBonus,.1);
 const r=f.call('shipments/run',{kind:'drugs',scope:'family',tier:'local'},2);assert.equal(r.body.familyReward,Math.floor(offer.min*.6*1.1));assert.equal(r.body.personalReward,Math.floor(offer.min*.4));
 f.advance(86400001);assert.equal(f.call('empire').body.shipments.find(s=>s.scope==='family').familyVictoryBonus,0);
 assert.equal(f.call('family/war/declare',{familyId:2}).status,200);assert.equal(f.call('family/war/surrender',{},3).status,200);assert.ok(f.call('family/dashboard').body.family.warStats.bonusUntil<f.time());
});
test('failed special operations charge once and award no free points without moving territory',t=>{
 const f=fixture(t);start(f);f.dice(9999);const r=f.call('family/war/capture',{familyId:2,itemId:'territory-industry'});assert.equal(r.body.success,false);assert.equal(f.q("SELECT quantity FROM family_assets WHERE family_id=2 AND item_id='territory-industry'").quantity,2);assert.equal(f.q('SELECT defender_score FROM family_wars').defender_score,0);
});
