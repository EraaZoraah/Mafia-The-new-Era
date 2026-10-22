import {cityFactors} from '../drug-markets.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {liquidationChance,backfireChance,WEDDING_COST} from '../player-systems.js';
import {catalog} from '../catalog.js';
const post=(f,amount=123456)=>f.call('bounties/post',{target:'DonTwo',amount,key:'bounty-post-test-0001'},4);
const marry=f=>{assert.equal(f.call('marriage/invite',{target:'DonTwo'}).status,200);return f.call('marriage/respond',{id:1,action:'accept'},3)};
const grant=(f,product='supporter',recipient='DonOne',key='supporter-grant-0001',id=1)=>f.call('admin/shop/grant',{product,recipient,key,reason:'Test membership'},id);

test('new weddings quote fifty million and charge that amount only on acceptance',t=>{
 const f=fixture(t),before=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(f.call('marriage').body.cost,50000000);
 assert.equal(f.call('marriage/invite',{target:'DonTwo'}).status,200);
 assert.equal(f.q('SELECT cost FROM marriage_invites WHERE id=1').cost,50000000);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before);
 assert.equal(f.call('marriage/respond',{id:1,action:'accept'},3).status,200);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-50000000);
 assert.equal(f.call('marriage').body.bonusPercent,10);
});

test('funded bounties debit once, pay the successful hunter once and preserve total money',t=>{
 const f=fixture(t),sum=()=>f.q('SELECT SUM(cash) n FROM users').n;
 const before=sum();assert.equal(post(f).status,200);assert.equal(post(f).body.duplicate,true);assert.equal(sum(),before-123456);
 const r=f.call('pvp',{kind:'liquidate',target:'DonTwo',rounds:500});assert.equal(r.status,200);assert.equal(r.body.bountyReward,123456);assert.equal(sum(),before);
 assert.equal(f.call('bounties').body.bounties.length,0);assert.equal(f.call('bounties/collect',{}).body.reward,0);assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo',rounds:500}).status,429);
 assert.equal(f.call('player/progress',undefined,3).body.incoming[0].successRate,1);
});
test('invalid bounty amounts, target and duplicate-key tampering cannot spend cash',t=>{
 const f=fixture(t),before=f.q('SELECT cash FROM users WHERE id=4').cash;
 for(const amount of [0,-1,1.1,1e12+1,'500',null])assert.equal(post(f,amount).status,400);
 assert.equal(f.q('SELECT cash FROM users WHERE id=4').cash,before);
 assert.equal(f.call('bounties/post',{target:'MemberOne',amount:500,key:'bounty-post-test-0001'}).status,400);
 assert.equal(post(f).status,200);assert.equal(post(f,500).status,409);
});
test('bounty sponsors cannot collect their own contract, failed attempts leave escrow intact',t=>{
 const f=fixture(t);post(f);f.dice(9999);
 assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo'},4).body.success,false);
 f.advance(3600000);f.dice(0);assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo'},4).body.bountyReward,0);
 assert.equal(f.q("SELECT status FROM bounties WHERE id=1").status,'open');
});
test('wallet overflow is durable bounty credit and collect retries are safe',t=>{
 const f=fixture(t);post(f);f.run('UPDATE users SET cash=999999999999990 WHERE id=1');
 const r=f.call('pvp',{kind:'liquidate',target:'DonTwo'});assert.equal(r.body.bountyReward,10);assert.equal(r.body.bountyPending,123446);
 f.run('UPDATE users SET cash=cash-200000 WHERE id=1');assert.equal(f.call('bounties/collect',{}).body.reward,123446);assert.equal(f.call('bounties/collect',{}).body.reward,0);
});
test('liquidation ammo is validated and higher rounds improve bounded odds',t=>{
 const f=fixture(t),ammo=()=>f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo;
 const before=ammo();for(const rounds of [0,59,-1,60.5,10001,'100',null]){if(rounds===null)continue;assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo',rounds}).status,400);}
 assert.equal(ammo(),before);f.dice(6000);const r=f.call('pvp',{kind:'liquidate',target:'DonTwo',rounds:3000});assert.equal(r.body.success,true);assert.equal(ammo(),before-3000);
 assert.ok(liquidationChance(10000)<.91);assert.ok(liquidationChance(1000)>liquidationChance(60));assert.ok(backfireChance(10000)<.66);
});
test('backfire consumes available ammo and can put both players into a coma',t=>{
 const f=fixture(t);assert.equal(f.call('player/backfire',{rounds:5000},3).status,200);f.run("UPDATE armory_accounts SET ammo=1000 WHERE scope='personal' AND owner_id=3");
 const r=f.call('pvp',{kind:'liquidate',target:'DonTwo',rounds:3000});assert.equal(r.status,200);assert.equal(r.body.backfireRounds,1000);assert.equal(r.body.backfireSuccess,true);
 assert.ok(f.q('SELECT coma_until FROM users WHERE id=1').coma_until>f.time());assert.ok(f.q('SELECT coma_until FROM users WHERE id=3').coma_until>f.time());
 assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=3").ammo,0);
 assert.equal(f.call('player/progress',undefined,3).body.incoming[0].backfireKills,1);
});
test('failed liquidation can still trigger backfire, and stats include failed return fire',t=>{
 const f=fixture(t);f.call('player/backfire',{rounds:1000},3);let n=0;f.dice(()=>n++===0?9999:0);
 const r=f.call('pvp',{kind:'liquidate',target:'DonTwo'});assert.equal(r.body.success,false);assert.equal(r.body.backfireSuccess,true);
 assert.equal(f.q('SELECT coma_until FROM users WHERE id=3').coma_until,0);
 const p=f.call('player/progress',undefined,3).body.incoming[0];assert.equal(p.attempts,1);assert.equal(p.successes,0);
});
test('wedding requires recipient consent, charges proposer once and gives both a bonus',t=>{
 const f=fixture(t),payer=f.q('SELECT cash FROM users WHERE id=1').cash,recipient=f.q('SELECT cash FROM users WHERE id=3').cash;
 f.call('marriage/invite',{target:'DonTwo'});assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,payer);
 assert.equal(f.call('marriage/respond',{id:1,action:'accept'},4).status,403);
 assert.equal(f.call('marriage/respond',{id:1,action:'accept'},3).status,200);assert.equal(f.call('marriage/respond',{id:1,action:'accept'},3).body.duplicate,true);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,payer-WEDDING_COST);assert.equal(f.q('SELECT cash FROM users WHERE id=3').cash,recipient);
 for(const id of [1,3]){assert.ok(f.call('profiles/'+id).body.player.marriage);assert.equal(f.call('daily',undefined,id).body.jobs[0].cash,16500);assert.equal(f.call('daily',undefined,id).body.jobs[0].xp,220);}
 assert.equal(f.call('marriage/invite',{target:'Outsider'}).status,400);
 assert.equal(f.call('marriage/divorce',{confirm:true}).status,200);assert.equal(f.call('daily').body.jobs[0].cash,15000);
});
test('wedding insufficient cash and expiry leave both players unmarried and uncharged',t=>{
 const f=fixture(t);f.call('marriage/invite',{target:'DonTwo'});f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('marriage/respond',{id:1,action:'accept'},3).status,409);assert.equal(f.q('SELECT COUNT(*) n FROM marriage_members').n,0);
 f.advance(73*3600000);assert.equal(f.call('marriage/respond',{id:1,action:'accept'},3).status,409);
});
test('reset ends marriage and refunds bounties on target without duplicating refunds',t=>{
 const f=fixture(t);marry(f);post(f);f.run('UPDATE family_members SET family_id=2 WHERE user_id=2');assert.equal(f.call('admin/player-lifecycle',{id:3,action:'reset',confirmName:'DonTwo',confirm:true}).status,200);
 assert.equal(f.call('marriage').body.marriage,null);assert.equal(f.call('bounties/collect',{},4).body.reward,123456);assert.equal(f.call('bounties/collect',{},4).body.reward,0);
});
test('supporter grants enforce permissions, one-time membership rewards and expiry',t=>{
 const f=fixture(t);assert.equal(grant(f,'supporter','MemberOne','supporter-grant-0001',2).status,403);
 const before=f.q('SELECT cash,xp FROM users WHERE id=1');assert.equal(grant(f).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before.cash+75000000);assert.equal(f.q('SELECT xp FROM users WHERE id=1').xp,before.xp+100000);
 assert.equal(grant(f).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before.cash+75000000);assert.equal(grant(f,'grand-supporter','DonOne','supporter-grant-0002').status,409);
 assert.equal(f.call('presence?ids=1').body.players[0].supporter.tier,'silver');
 f.advance(30*86400000);assert.equal(f.call('presence?ids=1').body.players[0].supporter,null);
 assert.equal(grant(f,'grand-supporter','DonOne','supporter-grant-0003').status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before.cash+275000000);assert.equal(f.q('SELECT xp FROM users WHERE id=1').xp,before.xp+350000);
 assert.equal(f.call('shop').body.products[0].id,'supporter');assert.equal(f.call('shop').body.checkoutEnabled,false);
 f.run("UPDATE users SET role='admin' WHERE id=2");assert.equal(grant(f,'supporter','MemberOne','supporter-grant-0005',2).status,200);
});

test('marriage applies to crime cash/XP and personal career earnings without boosting family share',t=>{
 const f=fixture(t);const crime=f.call('catalog').body.crimes[0];
 const run=()=>f.call('shipments/run',{kind:'drugs',tier:'local',scope:'family'});
 const shipmentBefore=run().body;
 const before=f.call('action',{kind:crime.id}).body;f.advance(3600000);assert.equal(marry(f).status,200);
 const after=f.call('action',{kind:crime.id}).body;assert.equal(after.xp,Math.floor(before.xp*1.10));assert.ok(after.reward>=Math.floor(before.reward*1.10)-2);
 const shipmentAfter=run().body;assert.equal(shipmentAfter.personalReward,Math.floor(shipmentBefore.personalReward*1.10));assert.equal(shipmentAfter.familyReward,shipmentBefore.familyReward);assert.equal(shipmentAfter.careerXp,Math.floor(shipmentBefore.careerXp*1.10));
 const p=f.call('profiles/1').body.player;assert.ok(p.marriage);assert.equal(f.call('profiles/3').body.player.marriage.spouse_id,1);
});

test('backfire without tier 3 weapon spends no rounds; insufficient attacker ammo rolls back',t=>{
 const f=fixture(t);f.call('player/backfire',{rounds:1000},3);f.run("DELETE FROM armory_weapons WHERE scope='personal' AND owner_id=3 AND weapon_id<>'street-sidearm'");
 f.run("UPDATE armory_accounts SET ammo=59 WHERE scope='personal' AND owner_id=1");const before=f.q('SELECT cash,energy FROM users WHERE id=1');
 assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo',rounds:1000,anonymous:true}).status,409);assert.deepEqual(f.q('SELECT cash,energy FROM users WHERE id=1'),before);
 f.run("UPDATE armory_accounts SET ammo=1000 WHERE scope='personal' AND owner_id=1");assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo',rounds:1000}).body.backfireRounds,0);
});

test('marriage passive income begins at acceptance and production quote equals payout with profit bonus',t=>{
 const f=fixture(t),asset=catalog.find(a=>a.category==='business');
 f.run('INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(?,?,?,?,?)',1,asset.category,asset.id,f.time(),f.time());
 f.advance(3600000);const cash=f.q('SELECT cash FROM users WHERE id=1').cash;marry(f);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash+asset.income-WEDDING_COST);
 const after=f.q('SELECT cash FROM users WHERE id=1').cash;f.advance(3600000);f.settle(1);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,after+Math.floor(asset.income*1.10));
 f.run("INSERT OR IGNORE INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(1,'garage','production-warehouse',0,0)");const start=f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,requestKey:'production-marriage-0001'});assert.equal(start.status,200);f.advance(6*3600000);
 const batch=f.call('production?scope=personal').body.batches[0],base=Math.floor(batch.base_value*cityFactors(batch.stock_city,0,batch.market.epoch).sale*batch.market.percent/100);assert.equal(batch.saleValue,base+Math.floor((base-batch.cost)*.10));
 const sell=f.call('production/sell',{scope:'personal',id:batch.id,requestKey:'production-marriage-0002'});assert.equal(sell.status,200);assert.equal(sell.body.payout,batch.saleValue);
});

