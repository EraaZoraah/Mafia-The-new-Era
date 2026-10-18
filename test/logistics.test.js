import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture as baseFixture} from './helpers/game-fixture.js';
const fixture=(...args)=>{const f=baseFixture(...args);f.run("INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(1,'garage','production-warehouse',0,0)");f.run("INSERT INTO family_assets VALUES(1,'warehouse-production-family',1)");return f;};
import {weapons,operationSupply,cities,products} from '../logistics.js';
import {crimes} from '../catalog.js';

let sequence=0;const request=body=>({...body,requestKey:'logistics-test-'+(++sequence)});
test('starter kits are granted once; ammunition and weapons use prices, limits and retry keys from the server',t=>{
 const f=fixture(t,false),a=()=>f.call('armory').body;
 assert.equal(a().ammo,100);assert.equal(a().weaponCount,1);f.reset();assert.equal(a().ammo,100);assert.equal(a().weaponCount,1);
 const before=f.q('SELECT cash FROM users WHERE id=1').cash,body=request({scope:'personal',kind:'ammo',item:'small',price:0});
 assert.equal(f.call('armory/buy',body).status,200);assert.equal(f.call('armory/buy',body).status,200);assert.equal(a().ammo,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-2500);
 assert.equal(f.call('armory/buy',{...body,item:'large'}).status,409);
 for(let i=0;i<3;i++)assert.equal(f.call('armory/buy',request({scope:'personal',kind:'weapon',item:'street-sidearm'})).status,200);
 f.run("UPDATE armory_weapons SET quantity=10000 WHERE scope='personal' AND owner_id=1 AND weapon_id='street-sidearm'");const cash=f.q('SELECT cash FROM users WHERE id=1').cash;assert.equal(f.call('armory/buy',request({scope:'personal',kind:'weapon',item:'street-sidearm'})).status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
 f.run("UPDATE armory_accounts SET ammo=999999 WHERE scope='personal' AND owner_id=1");assert.equal(f.call('armory/buy',request({scope:'personal',kind:'ammo',item:'small'})).status,409);
 f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('armory/buy',request({scope:'personal',kind:'weapon',item:'enforcer-rifle'})).status,409);
});
test('crime severity increases supply costs; successful and failed attempts spend rounds, invalid attempts roll back',t=>{
 const f=fixture(t,false);let last=0;for(const c of crimes){const s=operationSupply('crime',c);assert.ok(s.ammo>=last);last=s.ammo;}assert.equal(last,100);
 const c=crimes[0],need=operationSupply('crime',c),result=f.call('action',{kind:c.id});assert.equal(result.status,200);assert.equal(result.body.ammoUsed,need.ammo);
 assert.equal(f.call('action',{kind:c.id}).status,429);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE owner_id=1 AND scope='personal'").ammo,100-need.ammo);
 f.advance(3600000);f.run('UPDATE users SET xp=0 WHERE id=1');f.dice(9999);f.high(true);assert.equal(f.call('action',{kind:c.id}).body.success,false);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE owner_id=1 AND scope='personal'").ammo,100-2*need.ammo);
 f.advance(3600000);f.run("UPDATE armory_accounts SET ammo=0 WHERE owner_id=1 AND scope='personal'");const before=f.q('SELECT cash,energy,xp FROM users WHERE id=1');assert.equal(f.call('action',{kind:c.id}).status,409);assert.deepEqual(f.q('SELECT cash,energy,xp FROM users WHERE id=1'),before);
 f.run('UPDATE users SET xp=1000 WHERE id=1');assert.equal(f.call('pvp',{target:'DonTwo',kind:'liquidate'}).status,409);
});
test('family armories are separate, managed by Don/Capo and consumed by member missions',t=>{
 const f=fixture(t,false),body=()=>request({scope:'family',kind:'weapon',item:'street-sidearm'});
 assert.equal(f.call('armory/buy',body(),2).status,403);assert.equal(f.call('armory/buy',body()).status,200);
 assert.equal(f.call('armory/buy',request({scope:'family',kind:'ammo',item:'small'})).status,200);
 const personal=f.call('armory',undefined,2).body.ammo;
 const r=f.call('shipments/run',{scope:'family',kind:'drugs',tier:'local'},2);assert.equal(r.status,200);assert.equal(r.body.ammoUsed,25);assert.equal(f.call('armory?scope=family',undefined,2).body.ammo,75);assert.equal(f.call('armory',undefined,2).body.ammo,personal);
 f.call('family/role',{userId:2,role:'capo'});assert.equal(f.call('armory/buy',body(),2).status,200);
 assert.equal(f.call('armory/buy',request({scope:'family',kind:'ammo',item:'small'}),4).status,403);
});
test('Power equals actual holdings, follows family membership and is visible on public profiles',t=>{
 const f=fixture(t,false);f.run("DELETE FROM family_assets WHERE item_id='warehouse-production-family'");assert.equal(f.call('armory').body.power.total,100);
 f.run('UPDATE users SET personal_protection=2 WHERE id=1');f.call('armory/buy',request({scope:'personal',kind:'weapon',item:'enforcer-rifle'}));
 assert.equal(f.call('armory').body.power.total,2000);assert.equal(f.call('profiles/1',undefined,2).body.player.power.total,2000);
 const first=f.call('family/dashboard').body.family.power;assert.equal(first.total,2100);
 f.call('family/buy',{id:'compound-yard'});f.call('armory/buy',request({scope:'family',kind:'weapon',item:'crew-smg'}));const next=f.call('family/dashboard').body.family.power;
 assert.ok(next.assets>0);assert.equal(next.weapons,450);assert.equal(next.total,next.members+next.weapons+next.assets+next.guards);
 f.call('family/leave',{},2);assert.equal(f.call('family/dashboard').body.family.power.total,next.total-100);
});
test('Admin cannot edit Owner personal armories but can manage family supplies; Owner edits are validated and audited',t=>{
 const f=fixture(t,false);f.run("UPDATE users SET role='admin' WHERE id=4");
 const body={scope:'personal',targetId:1,ammo:999,weapons:[]};assert.equal(f.call('admin/logistics',body,4).status,403);assert.equal(f.call('admin/logistics?scope=personal&id=1',undefined,4).status,403);assert.equal(f.call('admin/logistics',{...body,scope:'family'},4).status,200);
 assert.equal(f.call('admin/logistics',{...body,targetId:2},4).status,200);assert.equal(f.call('armory',undefined,2).body.ammo,999);
 assert.equal(f.call('admin/logistics',{...body,weapons:[{id:weapons[0].id,quantity:10001}]}).status,400);assert.equal(f.call('admin/logistics',{...body,ammo:-1}).status,400);
 assert.equal(f.call('admin/logistics',{...body,weapons:[{id:'enforcer-rifle',quantity:4}]}).status,200);assert.ok(f.q('SELECT COUNT(*) n FROM owner_audit').n>=2);
});
test('flights require a jet, server-priced funds, cooldown and freedom; returning retains city heat',t=>{
 const f=fixture(t,false),fly=city=>f.call('airport/fly',request({city,cost:0}));assert.equal(cities.length,15);assert.equal(fly('London').status,403);
 f.run("UPDATE users SET city='New York',heat=90 WHERE id=1");assert.equal(f.call('assets/buy',{category:'jet',id:'swift'}).status,201);
 const offer=f.call('airport').body.destinations.find(c=>c.city==='London'),before=f.q('SELECT cash FROM users WHERE id=1').cash;
 const body=request({city:'London'});assert.equal(f.call('airport/fly',body).status,200);assert.equal(f.call('airport/fly',body).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-offer.cost);assert.equal(f.q('SELECT heat FROM users WHERE id=1').heat,0);
 assert.equal(fly('New York').status,429);f.advance(2*3600000);assert.equal(fly('New York').status,200);assert.equal(f.q('SELECT heat FROM users WHERE id=1').heat,88);
 f.advance(3600000);f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);assert.equal(fly('Paris').status,409);
});
test('production locks cost and base value, respects ranks and completes after the selected term',t=>{
 const f=fixture(t,false);assert.equal(products.length,5);const p=f.call('production').body.products[0],term=p.terms[0],before=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(f.call('production/start',request({scope:'personal',product:'cocaine',hours:6,units:1})).status,403);
 for(const units of [0,-1,1001,1.5,'2'])assert.equal(f.call('production/start',request({scope:'personal',product:p.id,hours:6,units})).status,400);
 const body=request({scope:'personal',product:p.id,hours:6,units:2}),r=f.call('production/start',body);assert.equal(r.status,200);assert.equal(f.call('production/start',body).body.id,r.body.id);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-term.cost*2);assert.equal(f.call('admin/economy').body.totals.players.production,'0');
 assert.equal(f.call('production/sell',request({scope:'personal',id:r.body.id})).status,409);
 f.advance(6*3600000);const batch=f.call('production').body.batches[0];assert.equal(batch.remaining,0);assert.equal(batch.base_value,term.baseValue*2);assert.ok(batch.saleValue>=batch.base_value*.9&&batch.saleValue<=batch.base_value*1.1);
 const sale=request({scope:'personal',id:r.body.id}),sold=f.call('production/sell',sale);assert.equal(sold.status,200);const balance=f.q('SELECT cash FROM users WHERE id=1').cash;assert.equal(f.call('production/sell',sale).body.payout,sold.body.payout);assert.equal(f.call('production/sell',request({scope:'personal',id:r.body.id})).status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,balance);
});
test('production slot limits, custody pauses, ownership and wallet capacity hold at completion',t=>{
 const f=fixture(t,false),start=()=>f.call('production/start',request({scope:'personal',product:'cannabis',hours:6,units:1}));for(let i=0;i<5;i++)assert.equal(start().status,200);assert.equal(start().status,409);
 const batch=f.call('production').body.batches[0];assert.equal(f.call('production/sell',request({scope:'personal',id:batch.id}),2).status,409);
 assert.equal(f.call('custody/report',{target:'DonOne',hours:1},2).status,200);f.advance(6*3600000);assert.equal(f.call('production').body.batches[0].remaining,3600000);f.advance(3600000);
 f.run('UPDATE users SET cash=1000000000000000,prison_until=0 WHERE id=1');assert.equal(f.call('production/sell',request({scope:'personal',id:batch.id})).status,400);assert.equal(f.call('production').body.batches.length,5);
});
test('family production uses treasury, survives member changes and has a stable hourly 90–110% market',t=>{
 const f=fixture(t,false),start=()=>request({scope:'family',product:'cannabis',hours:12,units:1});assert.equal(f.call('production/start',start(),2).status,403);
 const personal=f.q('SELECT cash FROM users WHERE id=1').cash,treasury=f.q('SELECT treasury FROM families WHERE id=1').treasury,r=f.call('production/start',start());assert.equal(r.status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,personal);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,treasury-r.body.cost);
 const seen=new Set();for(let i=0;i<48;i++){const a=f.call('production?scope=family').body,b=f.call('production?scope=family').body;assert.equal(a.products[0].market.percent,b.products[0].market.percent);for(const p of a.products){assert.ok(p.market.percent>=90&&p.market.percent<=110);}seen.add(a.products[0].market.percent);f.advance(3600000);}assert.ok(seen.size>1);
 f.call('family/role',{userId:2,role:'capo'});assert.equal(f.call('production/sell',request({scope:'family',id:r.body.id}),2).status,200);
});
