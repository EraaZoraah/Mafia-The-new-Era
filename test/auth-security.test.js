import test from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {hashPassword,verifyPassword,validPassword,installAuthSecurity} from '../auth-security.js';
test('password hashing verifies modern and legacy hashes and safely rejects malformed stored hashes',async()=>{
 const p='A long passphrase 4821',encoded=await hashPassword(p);assert.match(encoded,/^v2:/);assert.equal(await verifyPassword(p,encoded),true);assert.equal(await verifyPassword(p+'!',encoded),false);
 const salt='a'.repeat(32),legacy=salt+':'+scryptSync(p,salt,64).toString('hex');assert.equal(await verifyPassword(p,legacy),true);
 for(const stored of [null,'','salt:short','v2:bad:bad'])assert.equal(await verifyPassword(p,stored),false);
 assert.equal(await verifyPassword('x'.repeat(129),encoded),false);assert.equal(validPassword('x'.repeat(14)),false);assert.equal(validPassword('x'.repeat(15)),true);assert.equal(validPassword('x'.repeat(129)),false);
});
test('authentication throttling persists, expires and ignores spoofed forwarding headers',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY)');let time=1000000;const req={socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'fake'}};let auth=installAuthSecurity(db,{clock:()=>time});
 for(let n=0;n<10;n++)assert.equal(auth.limit(req,'login','user:1'),0);assert.equal(auth.limit(req,'login','user:1'),900);auth=installAuthSecurity(db,{clock:()=>time});assert.equal(auth.limit(req,'login','user:1'),900);auth.clear('user:1');assert.equal(auth.limit(req,'login','user:1'),0);
 for(let n=0;n<10;n++){req.headers['x-forwarded-for']='spoof'+n;assert.equal(auth.limit(req,'register',''),0)}assert.equal(auth.limit(req,'register',''),3600);time+=3600001;assert.equal(auth.limit(req,'register',''),0);db.close();
});
