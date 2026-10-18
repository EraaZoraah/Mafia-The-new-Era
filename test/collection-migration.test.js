import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {catalog} from '../catalog.js';
import {familyAssets} from '../empire-catalog.js';

test('collection migration discards surplus without archiving and remains idempotent',t=>{
 const f=fixture(t);
 f.db.exec('DROP TRIGGER possession_limit_insert; DROP TRIGGER possession_limit_update; DROP TRIGGER family_asset_limit_insert; DROP TRIGGER family_asset_limit_update; DROP INDEX one_master_compound;');
 for(const category of ['business','home','car']){
  const item=catalog.find(x=>x.category===category);
  f.run('INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at,quantity) VALUES(1,?,?,?,?,?)',category,item.id,f.time(),f.time(),20);
 }
 const compounds=familyAssets.filter(x=>x.category==='Compounds').sort((a,b)=>a.price-b.price);
 for(const item of [compounds[0],compounds.at(-1)])f.run('INSERT INTO family_assets(family_id,item_id,quantity) VALUES(1,?,1)',item.id);
 f.run('INSERT INTO employees(user_id,item_id,quantity,income_at) VALUES(1,?,4,?)','driver',f.time());
 // An older database may still enforce four copies on updates.
 f.db.exec("CREATE TRIGGER possession_limit_update BEFORE UPDATE ON possessions WHEN NEW.quantity>4 BEGIN SELECT RAISE(ABORT,'Old limit'); END;");
 f.reset();
 f.reset();
 assert.equal(f.q("SELECT quantity FROM possessions WHERE category='business'").quantity,10);
 assert.equal(f.q("SELECT quantity FROM possessions WHERE category='home'").quantity,1);
 assert.equal(f.q("SELECT quantity FROM possessions WHERE category='car'").quantity,1);
 assert.equal(f.q("SELECT quantity FROM employees WHERE item_id='driver'").quantity,1);
 assert.equal(f.q('SELECT COUNT(*) AS n FROM family_assets WHERE family_id=1').n,1);
 assert.equal(f.q('SELECT item_id FROM family_assets WHERE family_id=1').item_id,compounds.at(-1).id);
 assert.equal(f.q('SELECT COUNT(*) AS n FROM archived_possessions').n,0);
 assert.equal(f.q('SELECT COUNT(*) AS n FROM archived_family_assets').n,0);
 assert.throws(()=>f.run("UPDATE possessions SET quantity=2 WHERE category='home'"),/Collection limit/);
 assert.throws(()=>f.run("UPDATE possessions SET quantity=11 WHERE category='business'"),/Collection limit/);
 assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(),[]);
});
