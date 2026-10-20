import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';

test('Owner language statistics count unique accounts, track changes and separate bots and unknowns',t=>{
 const f=fixture(t);f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(4,'builder',?)",f.time());
 let d=f.call('admin/languages').body;
 assert.equal(d.players,3);assert.equal(d.bots,1);assert.equal(d.reported,0);
 assert.equal(d.languages.find(r=>r.code==='').total,4);
 f.call('presence/heartbeat',{language:'nl'},1);f.call('presence/heartbeat',{language:'fr'},2);
 f.call('presence/heartbeat',{},3);
 d=f.call('admin/languages').body;
 assert.equal(d.reported,2);assert.equal(d.languages.find(r=>r.code==='fr').players,1);
 f.call('presence/heartbeat',{language:'de'},2);f.call('presence/heartbeat',{language:'de'},2);
 d=f.call('admin/languages').body;
 assert.equal(d.languages.find(r=>r.code==='fr').players,0);
 assert.equal(d.languages.find(r=>r.code==='de').players,1);
 assert.ok(Math.abs(d.languages.reduce((n,r)=>n+r.percent,0)-100)<1e-8);
 f.reset();assert.equal(f.q('SELECT ui_language FROM users WHERE id=2').ui_language,'de');
 f.run('UPDATE users SET deleted_at=? WHERE id=4',f.time());
 assert.equal(f.call('admin/languages').body.bots,0);
});

test('language reporting validates values and aggregate usage is Owner-only',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=2");
 assert.equal(f.call('admin/languages',undefined,2).status,403);
 assert.equal(f.call('admin/languages',undefined,3).status,403);
 for(const language of ['pt','__proto__','de;DROP TABLE users',null,{},1])assert.equal(f.call('presence/heartbeat',{language},3).status,400);
 assert.equal(f.q('SELECT ui_language FROM users WHERE id=3').ui_language,'');
 for(const language of ['en','nl','es','fr','de'])assert.equal(f.call('presence/heartbeat',{language},3).status,200);
 const d=f.call('admin/languages').body;
 assert.equal(d.languages.find(r=>r.code==='de').players,1);
 assert.equal(d.reported,1);
});
