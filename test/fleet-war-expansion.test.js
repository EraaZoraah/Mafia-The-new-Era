import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fixture} from './helpers/game-fixture.js';
import {cars,garages,helicopters,jets,yachts,ownershipBenefits} from '../catalog.js';
import {backfireChance} from '../player-systems.js';
import {territoryCaptureChance} from '../public/territory-rules.js';
import {artCatalog,artHeists} from '../art-market.js';
import {gameKnowledge} from '../game-knowledge.js';

test('reviewed fleet prices scale utility, preserve rarity and provide exactly sixty purchased-car bays',()=>{
 assert.equal(cars.length,60);assert.equal(garages.length,10);assert.equal(garages.reduce((n,g)=>n+(g.parkingCapacity||6),0),60);
 assert.equal(cars.filter(c=>c.exclusive).length,8);assert.equal(new Set(cars.map(c=>c.name.toLowerCase().replace(/[^a-z0-9]/g,''))).size,60);
 const ordered=[...cars].sort((a,b)=>a.price-b.price);for(let i=1;i<ordered.length;i++)assert.ok(ordered[i].perks.rewardBps>=ordered[i-1].perks.rewardBps);
 assert.equal(cars.find(c=>c.id==='rsq8').price,18000000);assert.equal(cars.find(c=>c.id==='ferrari-250-gto').price,450000000);
 for(const c of cars.filter(c=>c.exclusive))assert.ok(c.perks.cooldownBps>0&&c.perks.energyCapacity>0&&c.limit===1);
 for(const group of [helicopters,jets,yachts])for(let i=0;i<group.length;i++){const c=group[i];assert.equal(c.income,0);if(i){assert.ok(c.price>group[i-1].price);assert.ok(c.perks.rewardBps>group[i-1].perks.rewardBps);}}
 assert.ok(yachts.at(-1).perks.rewardBps>cars.at(-1).perks.rewardBps);
 assert.ok(ownershipBenefits(cars.map(c=>({category:'car',item_id:c.id}))).rewardBps<=20000);
 for(const c of [...cars.slice(-9),...garages.slice(-5)]){assert.ok(existsSync('public'+c.image));assert.ok(existsSync('public/images/optimized/'+c.image.split('/').at(-1)+'.webp'));}
 const knowledge=gameKnowledge();for(const c of [...cars.slice(-9),...garages.slice(-5)])assert.ok(knowledge.some(k=>k.title===c.name&&k.text.includes(c.price.toLocaleString('en-US'))));
});

test('backfire grows slowly and overwhelming Power helps capture without guaranteeing victory',()=>{
 assert.equal(backfireChance(0),0);assert.ok(backfireChance(489)<.015);assert.ok(backfireChance(10000)<.20);
 for(let n=1;n<=10000;n+=137)assert.ok(backfireChance(n)>backfireChance(n-1));
 const strong=territoryCaptureChance(1000000000,32000000,.75,.7),weak=territoryCaptureChance(32000000,1000000000,.75,.7);
 assert.ok(strong>.48&&strong<.9);assert.ok(weak>.05&&weak<strong);
});

for(const scope of ['personal','family'])test(scope+' dispatched cargo frees warehouse, drug cap and local production slots without losing arriving cargo',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=1");
 if(scope==='personal')f.run("INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(1,'garage','production-warehouse',0,0)");
 else f.run("INSERT INTO family_assets VALUES(1,'warehouse-production-family',1)");
 let key=0;const start=units=>f.call('production/start',{scope,product:'cannabis',hours:6,units,requestKey:'capacity-start-'+scope+'-'+(++key)});
 const first=start(1000);assert.equal(first.status,200);assert.equal(start(1).status,409);
 f.advance(21600001);const ship=f.call('production/ship',{scope,id:first.body.id,city:'Dubai',mode:'plane',requestKey:'capacity-ship-'+scope});assert.equal(ship.status,200,JSON.stringify(ship));
 // Preserve delivery deterministically; interception has its own independent tests.
 f.run('UPDATE production_batches SET intercepted=0 WHERE id=?',first.body.id);
 const d=f.call('production?scope='+scope).body;assert.equal(d.storage.used,0);
 const second=start(1000);assert.equal(second.status,200,JSON.stringify(second));
 f.advance(86400000);const arrived=f.call('production?scope='+scope).body;assert.equal(arrived.storage.used,2000);assert.equal(arrived.batches.length,2);assert.equal(start(1).status,409);
 const sale=f.call('production/sell',{scope,id:first.body.id,requestKey:'capacity-sell-'+scope});assert.equal(sale.status,200);
 assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
});

test('all heist failure timers are short, final originals are worth billions, migration only reprices once',t=>{
 for(const [i,h] of artHeists.entries()){
  assert.equal(h.failureCooldown,[300000,600000,1200000,1800000][i]);assert.equal(h.cooldown,[3600000,7200000,14400000,21600000][i]);
  const f=fixture(t);f.run('UPDATE users SET xp=10000000,energy=1000');f.dice(9999);
  const r=f.call('art/heist',{kind:h.id});assert.equal(r.body.success,false);assert.equal(f.q('SELECT until_at FROM art_heist_cooldowns WHERE user_id=1').until_at,f.time()+h.failureCooldown);
 }
 assert.ok(Math.min(...artHeists.at(-1).loot.map(a=>a.value))*.65>=1000000000);
 const f=fixture(t);f.run("INSERT INTO art_objects(user_id,spec_id,authentic,condition,estimated_value,appraised,state,created_at) VALUES(1,?,1,100,123456,1,'collection',?)",artCatalog[0].id,f.time());
 f.run("DELETE FROM art_value_versions WHERE version='2026-luxury-values'");f.reset();assert.equal(f.q('SELECT estimated_value FROM art_objects').estimated_value,24691200);f.reset();assert.equal(f.q('SELECT estimated_value FROM art_objects').estimated_value,24691200);
});

test('arrest notices carry a release identifier and bail uses the current quote exactly once',t=>{
 const f=fixture(t);assert.equal(f.call('custody/report',{target:'DonOne',hours:1},2).status,200);
 const notice=f.call('notifications').body.notifications.find(n=>n.custodyId);assert.ok(notice);
 const stay=f.call('custody').body.stays.find(s=>s.id===notice.custodyId),before=f.q('SELECT cash+bank n FROM users WHERE id=1').n;
 const r=f.call('custody/pay',{id:stay.id,maxCost:stay.cost,source:'personal'});assert.equal(r.status,200);assert.equal(f.q('SELECT cash+bank n FROM users WHERE id=1').n,before-stay.cost);
 assert.equal(f.call('custody/pay',{id:stay.id,maxCost:stay.cost,source:'personal'}).status,409);
});
