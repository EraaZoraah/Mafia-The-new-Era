import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {cityGeography} from '../public/city-geography.js';
const map=f=>f.call('family/map?city=New%20York').body;
function setup(f){f.run("INSERT INTO family_assets VALUES(1,'territory-block',1),(2,'territory-industry',2)");map(f);assert.equal(f.call('family/war/declare',{familyId:2}).status,200);const plots=f.db.prepare("SELECT id FROM city_territories WHERE city='New York' AND item_id='territory-industry' ORDER BY id LIMIT 2").all();f.run('UPDATE city_territories SET owner_id=NULL WHERE owner_id=2');for(const p of plots)f.run('UPDATE city_territories SET owner_id=2,acquired_at=0 WHERE id=?',p.id);return plots[0].id;}
test('capture attempt cooldown, successful daily limit and defender shield persist across restart',t=>{
 const f=fixture(t),plotId=setup(f),call=()=>f.call('family/war/capture',{familyId:2,plotId});f.dice(9999);
 assert.equal(call().body.success,false);const after=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 assert.equal(call().status,429);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,after);
 f.reset();assert.equal(call().status,429);f.advance(3600001);f.dice(0);assert.equal(call().body.success,true);
 assert.equal(map(f).capture.captured,1);assert.ok(map(f).capture.successUntil>f.time());f.advance(3600001);assert.equal(call().status,409);
 assert.ok(f.q('SELECT shield_until FROM family_capture_state WHERE family_id=2').shield_until>f.time());
});
test('captured-holding count frees a slot on loss and allies have a distinct non-hostile relation',t=>{
 const f=fixture(t);f.run("INSERT INTO family_assets VALUES(1,'territory-block',12),(2,'territory-industry',1)");map(f);f.run('UPDATE city_territories SET owner_id=NULL WHERE owner_id=1');const plots=f.db.prepare("SELECT * FROM city_territories WHERE city='New York' AND item_id='territory-block' ORDER BY id LIMIT 12").all();for(const p of plots)f.run('UPDATE city_territories SET owner_id=1 WHERE id=?',p.id);
 for(const p of plots.slice(0,10))f.run('UPDATE city_territories SET captured=1 WHERE id=?',p.id);
 assert.equal(map(f).capture.captured,10);const lost=plots[0];f.run('UPDATE city_territories SET owner_id=2 WHERE id=?',lost.id);f.run("UPDATE family_assets SET quantity=11 WHERE family_id=1 AND item_id='territory-block'");f.run("INSERT INTO family_assets VALUES(2,'territory-block',1)");assert.equal(map(f).capture.captured,9);
 f.run("INSERT INTO family_alliances VALUES(1,2,1,'accepted',?,?)",f.time(),f.time());assert.ok(map(f).plots.filter(p=>p.owner_id===2).every(p=>p.relation==='ally'));
 assert.equal(f.call('family/war/capture',{familyId:2,plotId:lost.id}).status,409);
});
test('city geographic cells are varied, bounded in count and district parcels are larger on average',()=>{
 const counts=new Set();for(const city of Object.values(cityGeography)){assert.ok(city.count>=40&&city.count<=60);counts.add(city.count);assert.equal(city.cells.length,city.count);assert.ok(city.outline.startsWith('M'));assert.ok(city.cells.every(c=>c.area>0&&Number.isFinite(c.x)&&Number.isFinite(c.y)));assert.ok(Math.max(...city.cells.map(c=>c.area))>Math.min(...city.cells.map(c=>c.area))*1.5);}assert.ok(counts.size>5);
});
