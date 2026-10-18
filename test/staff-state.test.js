import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
function edit(f,section,values,{id=2,scope='personal',actor=1,...extra}={}){const d=f.call(`admin/state?scope=${scope}&id=${id}`,undefined,actor);assert.equal(d.status,200);const s=d.body.sections.find(s=>s.section===section);return f.call('admin/state',{scope,targetId:id,section,operation:'save',values,reason:'Test correction',revision:s.revision,...extra},actor)}
test('staff editors validate catalogs, ownership, caps and audit every change',t=>{
 const f=fixture(t);
 assert.equal(edit(f,'employees',{item_id:'runner',quantity:500}).status,200);
 assert.equal(f.q('SELECT quantity FROM employees WHERE user_id=2').quantity,500);
 assert.equal(edit(f,'employees',{item_id:'driver',quantity:2}).status,400);
 assert.equal(edit(f,'crypto',{coin:'omerta',quantity:100,basis:1000}).status,200);
 assert.equal(edit(f,'art',{spec_id:'canal-nocturne',authentic:1,condition:95,appraised:1}).status,200);
 assert.equal(f.q('SELECT estimated_value FROM art_objects WHERE user_id=2').estimated_value,237500);
 assert.equal(f.q('SELECT COUNT(*) n FROM art_theft_history').n,0);
 assert.equal(edit(f,'racing',{xp:5000,next_at:0}).status,200);
 assert.equal(edit(f,'income',{active_ms:86400000,pending_income:123456}).status,200);
 assert.equal(f.q('SELECT pending_income FROM users WHERE id=2').pending_income,123456);
 assert.equal(f.q('SELECT COUNT(*) n FROM owner_audit WHERE target_id=2').n,5);
 f.reset();assert.equal(f.q('SELECT xp FROM race_profiles WHERE user_id=2').xp,5000);
});
test('Admin can edit self and Owner family but cannot access Owner or forge fields',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=2");
 assert.equal(edit(f,'employees',{item_id:'driver',quantity:1},{actor:2}).status,200);
 assert.equal(f.call('admin/state?scope=personal&id=1',undefined,2).status,403);
 assert.equal(f.call('admin/state?scope=personal&id=2',undefined,3).status,403);
 assert.equal(edit(f,'racing',{xp:1,next_at:0,role:'owner'}).status,400);
 const compound=f.call('admin/family?id=1').body.catalog.find(a=>a.category==='Compounds');f.run('INSERT INTO family_assets VALUES(1,?,1)',compound.id);
 assert.equal(edit(f,'extensions',{upgrade_id:'command-suite'},{scope:'family',id:1,actor:2}).status,200);
 assert.equal(f.q('SELECT COUNT(*) n FROM family_audit').n,1);
});
test('territory changes preserve aggregate assets and enforce ownership',t=>{
 const f=fixture(t),plot=f.q('SELECT * FROM city_territories WHERE owner_id IS NULL LIMIT 1');
 assert.equal(edit(f,'territories',{id:String(plot.id),captured:0},{scope:'family',id:1}).status,200);
 assert.equal(f.q('SELECT quantity FROM family_assets WHERE family_id=1 AND item_id=?',plot.item_id).quantity,1);
 assert.equal(edit(f,'territories',{id:String(plot.id),captured:0},{scope:'family',id:2}).status,409);
 const s=f.call('admin/state?scope=family&id=1').body.sections.find(s=>s.section==='territories');
 assert.equal(f.call('admin/state',{scope:'family',targetId:1,section:'territories',rowId:plot.id,operation:'delete',revision:s.revision,reason:'Release plot'}).status,200);
 assert.equal(f.q('SELECT owner_id FROM city_territories WHERE id=?',plot.id).owner_id,null);
 assert.equal(f.q('SELECT quantity FROM family_assets WHERE family_id=1 AND item_id=?',plot.item_id),undefined);
});
test('investment administration supports the real $100 billion cap',t=>{
 const f=fixture(t),changes={principal:100000000000,rateBps:800,openedAt:f.time(),maturesAt:f.time()+72*3600000,claimed:0};
 assert.equal(f.call('admin/investment',{scope:'personal',targetId:2,operation:'save',changes}).status,200);
 assert.equal(f.call('admin/investment',{scope:'personal',targetId:2,operation:'save',changes:{...changes,principal:1}}).status,409);
});
test('stale edits, foreign IDs and locked auction items cannot be overwritten',t=>{
 const f=fixture(t);edit(f,'art',{spec_id:'canal-nocturne',authentic:1,condition:100,appraised:1});const art=f.q('SELECT * FROM art_objects WHERE user_id=2');
 const s=f.call('admin/state?scope=personal&id=2').body.sections.find(s=>s.section==='art');
 assert.equal(edit(f,'art',{spec_id:'canal-nocturne',authentic:1,condition:90,appraised:1},{id:3,rowId:art.id}).status,404);
 f.run("INSERT INTO art_auctions(object_id,seller_id,reserve,ends_at,original_end) VALUES(?,2,1000,?,?)",art.id,f.time()+100000,f.time()+100000);
 assert.equal(edit(f,'art',{spec_id:'canal-nocturne',authentic:1,condition:90,appraised:1},{rowId:art.id}).status,409);
 f.run('UPDATE art_objects SET condition=80 WHERE id=?',art.id);
 assert.equal(f.call('admin/state',{scope:'personal',targetId:2,section:'art',operation:'delete',rowId:art.id,revision:s.revision,reason:'Stale edit'}).status,409);
});
test('vehicle warehouse capacity, shipment locks and capped income edits',t=>{
 const f=fixture(t);
 assert.equal(edit(f,'vehicles',{vehicle_id:'dacia-sandero',city:'New York',condition_stars:5}).status,400);
 f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(2,'garage','vehicle-warehouse',1,0,?)",f.time());
 assert.equal(edit(f,'vehicles',{vehicle_id:'dacia-sandero',city:'New York',condition_stars:5}).status,200);
 const car=f.q('SELECT * FROM vehicle_loot WHERE user_id=2');assert.equal(car.condition_stars,5);
 f.run("UPDATE vehicle_loot SET state='transit' WHERE id=?",car.id);
 assert.equal(edit(f,'vehicles',{vehicle_id:'dacia-sandero',city:'Dubai',condition_stars:4},{rowId:car.id}).status,409);
 edit(f,'employees',{item_id:'runner',quantity:1});f.advance(3600000);
 assert.equal(edit(f,'employees',{item_id:'runner',quantity:2},{rowId:'runner'}).status,200);
 assert.equal(f.q('SELECT pending_income FROM users WHERE id=2').pending_income,2800);
 edit(f,'income',{active_ms:86400000,pending_income:777});f.advance(3600000);f.game.settle(2,false);
 assert.equal(f.q('SELECT pending_income FROM users WHERE id=2').pending_income,777);
 assert.equal(f.q('SELECT active_ms FROM income_cycles WHERE user_id=2').active_ms,86400000);
});
test('administrative artwork removal keeps historical provenance and awards no cash',t=>{
 const f=fixture(t);edit(f,'art',{spec_id:'canal-nocturne',authentic:1,condition:100,appraised:1});
 const a=f.q('SELECT * FROM art_objects WHERE user_id=2');f.run('INSERT INTO art_theft_history VALUES(?,2,?)',a.id,a.spec_id);
 const s=f.call('admin/state?scope=personal&id=2').body.sections.find(s=>s.section==='art'),cash=f.q('SELECT cash FROM users WHERE id=2').cash;
 assert.equal(f.call('admin/state',{scope:'personal',targetId:2,section:'art',operation:'delete',rowId:a.id,revision:s.revision,reason:'Remove duplicate'}).status,200);
 assert.equal(f.q('SELECT state FROM art_objects WHERE id=?',a.id).state,'removed');assert.equal(f.q('SELECT COUNT(*) n FROM art_theft_history').n,1);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,cash);
});
test('race-locked vehicles and escrow survive staff corrections',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=2");
 f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(2,'garage','vehicle-warehouse',1,0,?)",f.time());
 edit(f,'vehicles',{vehicle_id:'dacia-sandero',city:'New York',condition_stars:4});
 const car=f.call('circuit',undefined,2).body.cars[0];
 const started=f.call('circuit/create',{car:car.key,route:'technical',capacity:2,strategy:'clean',setup:'street',mechanic:false,maxCost:car.fee,key:'staff-race-lock-0001'},2);
 assert.equal(started.status,200);const entry=f.q("SELECT * FROM race_entries WHERE user_id=2 AND state='pending'");assert.ok(entry);
 const loot=f.q('SELECT id FROM vehicle_loot WHERE user_id=2');
 assert.equal(edit(f,'vehicles',{vehicle_id:'dacia-sandero',city:'New York',condition_stars:5},{rowId:loot.id}).status,409);
 assert.equal(edit(f,'racing',{xp:500,next_at:0}).status,200);
 assert.deepEqual(f.q('SELECT * FROM race_entries WHERE id=?',entry.id),entry);
});
