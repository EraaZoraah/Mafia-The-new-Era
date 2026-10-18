import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers/game-fixture.js';
import {artCatalog} from '../art-market.js';
import {milestones} from '../legacy.js';
test('paid armory value includes marginal prices, excludes ammo and never duplicates a receipt',t=>{
 const f=fixture(t),body={scope:'personal',kind:'weapon',item:'street-sidearm',quantity:2,requestKey:randomUUID()};
 const purchase=f.call('armory/buy',body);assert.equal(purchase.status,200);assert.equal(purchase.body.cost,10150);
 assert.equal(f.call('armory/buy',body).status,200);
 assert.equal(f.call('armory?scope=personal').body.weaponValue,purchase.body.cost);
 f.call('armory/buy',{scope:'personal',kind:'ammo',quantity:10,requestKey:randomUUID()});
 assert.equal(f.call('armory?scope=personal').body.weaponValue,purchase.body.cost);
 f.run('DELETE FROM armory_purchase_history');f.run("DELETE FROM logistics_meta WHERE key='armory-paid-history-v1'");f.reset();
 assert.equal(f.call('armory?scope=personal').body.weaponValue,10150);f.reset();assert.equal(f.call('armory?scope=personal').body.weaponValue,10150);
});
test('family weapon costs belong to the treasury and unknown legacy grants are disclosed',t=>{
 const f=fixture(t),before=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 const purchase=f.call('armory/buy',{scope:'family',kind:'weapon',item:'street-sidearm',quantity:3,requestKey:randomUUID()});assert.equal(purchase.status,200);
 const board=f.call('armory?scope=family').body;assert.equal(board.weaponValue,purchase.body.cost);assert.ok(board.weaponUnpricedCount>0);
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,before-purchase.body.cost);
});
test('25 distinct originals unlock four permanent art achievements, excluding duplicates and auctions',t=>{
 const f=fixture(t);assert.equal(artCatalog.length,25);assert.equal(new Set(artCatalog.map(x=>x.id)).size,25);
 for(const a of artCatalog)f.run("INSERT INTO art_objects(user_id,spec_id,authentic,condition,estimated_value,appraised,state,created_at) VALUES(?,?,1,100,?,1,'collection',?)",1,a.id,a.value,f.time());
 const awards=f.call('achievements').body.milestones.filter(x=>x.key==='artOriginals');assert.equal(awards.length,4);assert.ok(awards.every(x=>x.earnedAt));
 f.run("UPDATE art_objects SET state='auction' WHERE user_id=1");const after=f.call('achievements').body.milestones.find(x=>x.id==='art-complete');assert.equal(after.progress,0);assert.ok(after.earnedAt);
});
test('Pristine achievements count the actual thief, survive sales and do not credit an auction buyer',t=>{
 const f=fixture(t);f.high(true);const theft=f.call('action',{kind:'car'});assert.equal(theft.status,200);assert.equal(theft.body.vehicle.condition_stars,5);
 assert.equal(f.call('achievements').body.milestones.find(x=>x.id==='pristine-first').progress,1);
 f.run('UPDATE vehicle_loot SET user_id=2 WHERE id=?',theft.body.vehicle.id);
 assert.equal(f.call('achievements',undefined,2).body.milestones.find(x=>x.id==='pristine-first').progress,0);
 f.reset();assert.equal(f.call('achievements').body.milestones.find(x=>x.id==='pristine-first').progress,1);
 assert.equal(milestones.filter(x=>x.key==='pristineThefts').length,3);
});
test('Luca explains the new collection achievements and live progress in both languages',t=>{
 const f=fixture(t);
 for(const lang of ['en','nl'])for(const topic of ['art achievements','Pristine achievements']){
  const answer=f.call('guide?q='+encodeURIComponent(topic)+'&lang='+lang);assert.equal(answer.status,200);
  assert.ok(answer.body.links.some(x=>x.tab==='achievements'));assert.match(answer.body.answer,/25/);
 }
});
