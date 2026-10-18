import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {prepareDatabase} from '../database-bootstrap.js';
test('fresh installation copies accounts and progress; repeated startup preserves the live world',t=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mafia-bootstrap-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));mkdirSync(path.join(dir,'starter-data'));
 const starter=new DatabaseSync(path.join(dir,'starter-data','mafia.sqlite'));starter.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,role TEXT,cash INTEGER,password TEXT); INSERT INTO users VALUES(1,'owner',1234,'test-hash'),(2,'admin',4321,'test-hash'),(3,'player',100,'test-hash')");starter.close();
 const file=prepareDatabase(dir),db=new DatabaseSync(file);assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n,3);assert.equal(db.prepare('SELECT cash FROM users WHERE id=1').get().cash,1234);db.exec('UPDATE users SET cash=9999 WHERE id=1');db.close();
 assert.equal(prepareDatabase(dir),file);const live=new DatabaseSync(file);assert.equal(live.prepare('SELECT cash FROM users WHERE id=1').get().cash,9999);live.close();
 const original=new DatabaseSync(path.join(dir,'starter-data','mafia.sqlite'));assert.equal(original.prepare('SELECT cash FROM users WHERE id=1').get().cash,1234);original.close();
});
test('independent installs without a starter keep normal empty-database initialization',t=>{const dir=mkdtempSync(path.join(tmpdir(),'mafia-no-starter-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const file=prepareDatabase(dir);assert.equal(existsSync(path.dirname(file)),true);assert.equal(existsSync(file),false);});
