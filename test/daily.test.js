import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
const complete=(f,kind,n=1)=>{for(let i=0;i<n;i++)f.run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(?,?,?,?)',1,kind,i%2,f.time());};
test('daily progress, fixed rewards, duplicate claim and UTC reset',t=>{
 const f=fixture(t);complete(f,'crime',5);const d=f.call('daily').body;assert.equal(d.jobs[0].progress,5);const cash=f.q('SELECT cash FROM users WHERE id=1').cash;
 const b={day:d.day,job:'streets'};assert.equal(f.call('daily/claim',b).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash+15000);assert.equal(f.call('daily/claim',b).status,409);
 f.reset();assert.equal(f.call('daily/claim',b).status,409);f.advance(d.resetsAt-f.time());assert.equal(f.call('daily').body.jobs[0].progress,0);assert.equal(f.call('daily/claim',b).status,409);
});
test('daily rejects incomplete, cross-player, detention and overflowing rewards without consuming claims',t=>{
 const f=fixture(t),b={day:f.call('daily').body.day,job:'shipment'};assert.equal(f.call('daily/claim',b).status,409);complete(f,'shipment');assert.equal(f.call('daily/claim',b,2).status,409);
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+60000);assert.equal(f.call('daily/claim',b).status,409);f.run('UPDATE users SET prison_until=0,cash=1000000000000000 WHERE id=1');assert.equal(f.call('daily/claim',b).status,409);assert.equal(f.q('SELECT COUNT(*) n FROM daily_claims').n,0);
 f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('daily/claim',b).status,200);
});
test('respect progress uses unique server-recorded gifts and excludes other days',t=>{const f=fixture(t),d=f.call('daily').body;for(const id of [2,3,4])assert.equal(f.call('respect/give',{target:f.q('SELECT username FROM users WHERE id=?',id).username}).status,200);assert.equal(f.call('daily').body.jobs[2].progress,3);assert.equal(f.call('daily/claim',{day:d.day,job:'respect'}).status,200);});
const post=f=>({kind:'event',title:'City gathering',body:'Meet your family tonight.',status:'published',startsAt:f.time(),endsAt:f.time()+3600000,popup:true});
test('staff drafts, scheduling, revisions, archive and one-time popup delivery',t=>{
 const f=fixture(t),b=post(f);b.startsAt+=60000;const id=f.call('admin/bulletins',b).body.id;assert.equal(f.call('bulletins').body.entries.length,0);f.call('notifications',undefined,2);assert.equal(f.q('SELECT COUNT(*) n FROM bulletin_deliveries').n,0);
 f.advance(60000);assert.equal(f.call('bulletins').body.entries.length,1);f.call('notifications',undefined,2);f.call('notifications',undefined,2);assert.equal(f.q('SELECT COUNT(*) n FROM bulletin_deliveries').n,1);
 f.run("UPDATE users SET role='admin' WHERE id=3");assert.equal(f.call('admin/bulletins',{...b,id,revision:1,title:'Updated gathering'},3).status,200);assert.equal(f.call('admin/bulletins',{...b,id,revision:1},3).status,409);f.call('notifications',undefined,2);assert.equal(f.q('SELECT COUNT(*) n FROM bulletin_deliveries').n,2);
 assert.equal(f.call('admin/bulletins',{...b,id,revision:2,status:'archived'},3).status,200);assert.equal(f.call('bulletins').body.entries.length,0);assert.equal(f.q('SELECT COUNT(*) n FROM owner_audit').n,3);
});
test('bulletin authorization, validation, drafts and expiry',t=>{const f=fixture(t),b=post(f);assert.equal(f.call('admin/bulletins',b,2).status,403);assert.equal(f.call('admin/bulletins',undefined,2).status,403);for(const patch of [{title:'x'},{endsAt:b.startsAt},{body:''},{popup:'yes'},{status:'unknown'}])assert.equal(f.call('admin/bulletins',{...b,...patch}).status,400);f.call('admin/bulletins',{...b,status:'draft'});assert.equal(f.call('bulletins').body.entries.length,0);f.call('admin/bulletins',b);f.advance(3600000);assert.equal(f.call('bulletins').body.entries.length,0);});
