import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {artCatalog} from '../art-market.js';
import {cars} from '../catalog.js';
import {stolenVehicles,chooseVehicle} from '../vehicle-catalog.js';
import {installBots} from '../bot-players.js';
function object(f,id=1,{appraised=1,authentic=1,spec='canal-nocturne'}={}){return Number(f.run("INSERT INTO art_objects(user_id,spec_id,authentic,condition,estimated_value,appraised,state,created_at) VALUES(?,?,?,90,225000,?,'collection',?)",id,spec,authentic,appraised,f.time()).lastInsertRowid)}
test('unique art rewards hide authenticity until paid appraisal; failed attempts consume once and obey custody',t=>{
 const f=fixture(t);f.dice(2000);const before=f.q('SELECT cash FROM users WHERE id=1').cash;
 const r=f.call('art/heist',{kind:'gallery'});assert.equal(r.status,200);assert.equal(r.body.success,true);assert.ok(r.body.object.serial);assert.equal(r.body.object.authentic,undefined);assert.equal(r.body.object.estimated_value,undefined);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-25000);assert.equal(f.call('art/heist',{kind:'gallery'}).status,429);
 const id=r.body.object.id;assert.equal(f.call('art/list',{id,hours:6,reserve:200000}).status,400);assert.equal(f.call('art/appraise',{id},2).status,409);assert.equal(f.call('art/appraise',{id}).status,200);assert.equal(f.call('art/appraise',{id}).status,409);
 const b=f.call('art').body.collection[0];assert.equal(b.authentic,true);assert.equal(b.estimated_value,117000);
 f.advance(3600001);f.dice(9999);assert.equal(f.call('art/heist',{kind:'gallery'}).body.success,false);
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+60000);assert.equal(f.call('art/appraise',{id}).status,409);
});
test('bids escrow funds, refund atomically, reject self-bids and settle exactly once with commission',t=>{
 const f=fixture(t),id=object(f);assert.equal(f.call('art/list',{id,hours:6,reserve:200000}).status,200);const auction=f.call('art').body.auctions[0],cash2=f.q('SELECT cash FROM users WHERE id=2').cash,cash3=f.q('SELECT cash FROM users WHERE id=3').cash,seller=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(f.call('art/bid',{id:auction.id,amount:200000}).status,409);assert.equal(f.call('art/bid',{id:auction.id,amount:200000},2).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,cash2-200000);
 assert.equal(f.call('art/bid',{id:auction.id,amount:209999},3).status,409);assert.equal(f.call('art/bid',{id:auction.id,amount:210000},3).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,cash2);assert.equal(f.q('SELECT cash FROM users WHERE id=3').cash,cash3-210000);
 f.advance(6*3600000+1);f.tick();assert.equal(f.q('SELECT user_id FROM art_objects WHERE id=?',id).user_id,3);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,seller+193200);f.tick();assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,seller+193200);
 assert.equal(f.call('art/bid',{id:auction.id,amount:250000},2).status,409);assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
});
test('late bids extend the auction; unsold pieces return and cannot grant bonuses while listed',t=>{
 const f=fixture(t);for(const spec of artCatalog.slice(0,3))object(f,1,{spec:spec.id});assert.equal(f.call('art').body.bonus.income,.01);
 const id=f.q('SELECT id FROM art_objects LIMIT 1').id;assert.equal(f.call('art/list',{id,hours:6,reserve:200000}).status,200);assert.equal(f.call('art').body.bonus.income,0);f.advance(6*3600000-60000);const a=f.call('art').body.auctions[0];assert.equal(f.call('art/bid',{id:a.id,amount:200000},2).status,200);assert.equal(f.q('SELECT ends_at FROM art_auctions WHERE id=?',a.id).ends_at,f.time()+120000);
 f.advance(120001);f.tick();assert.equal(f.q('SELECT user_id FROM art_objects WHERE id=?',id).user_id,2);
 const other=object(f);assert.equal(f.call('art/list',{id:other,hours:6,reserve:200000}).status,200);f.advance(6*3600000+1);f.tick();assert.equal(f.q('SELECT state FROM art_objects WHERE id=?',other).state,'collection');assert.equal(f.call('art/list',{id:other,hours:6,reserve:200000}).status,200);
});
test('car expansion keeps one-per-model garages and weighted cheap-to-collector theft',()=>{
 assert.equal(stolenVehicles.length,50);assert.equal(cars.length,51);assert.equal(new Set(stolenVehicles.map(c=>c.id)).size,50);assert.equal(new Set(cars.map(c=>c.id)).size,51);assert.ok(cars.some(c=>c.id==='mercedes-300sl-roadster'));
 const weights=stolenVehicles.reduce((n,c)=>n+c.weight,0);assert.ok(stolenVehicles.filter(c=>c.value<500000).reduce((n,c)=>n+c.weight,0)/weights>.85);assert.equal(chooseVehicle(()=>1).id,stolenVehicles[0].id);assert.equal(chooseVehicle(()=>weights).id,'ferrari-f40');
});
test('autonomous bidders spend ordinary cash and receive the auction object on settlement',t=>{
 const f=fixture(t),id=object(f);f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(3,'builder',0)");
 assert.equal(f.call('art/list',{id,hours:6,reserve:100000}).status,200);
 const requests=[],bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>a,call:(id,path,body)=>{const result=f.call(path,body,id);requests.push({path,status:result.status});return result;}});
 bots.step(3,{domain:'art'});assert.ok(requests.some(r=>r.path==='art/bid'&&r.status===200));
 f.advance(6*3600000+1);f.tick();assert.equal(f.q('SELECT user_id FROM art_objects WHERE id=?',id).user_id,3);
});
