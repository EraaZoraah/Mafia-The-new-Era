import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {installBots} from '../bot-players.js';
function setup(t){const f=fixture(t,false);f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(2,'builder',?)",f.time());f.run("INSERT INTO bot_meta VALUES('enabled','true')");f.run('UPDATE users SET cash=5000,xp=0,energy=100,city=? WHERE id=2','New York');return f;}
test('bots earn through real handlers, obey cooldowns and persist their next action',t=>{
 const f=setup(t),bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>a===0&&b===100?90:a,call:(id,path,body)=>f.call(path,body,id)});
 bots.tick();const b=f.q('SELECT * FROM bot_players WHERE user_id=2');assert.equal(b.last_action,'action');assert.equal(b.last_status,200);assert.equal(b.actions,1);assert.ok(b.next_at>f.time());assert.ok(f.q('SELECT xp FROM users WHERE id=2').xp>0);
 bots.tick();assert.equal(f.q('SELECT actions FROM bot_players WHERE user_id=2').actions,1);
 f.advance(60000);bots.tick();assert.ok(f.q('SELECT actions FROM bot_players WHERE user_id=2').actions<=2);
});
test('pause, ban, deletion, staff accounts and prison stop bot actions',t=>{
 const f=setup(t),bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>a===0&&b===100?90:a,call:(id,path,body)=>f.call(path,body,id)});
 assert.equal(f.call('admin/bots',{},2).status,403);assert.equal(f.call('admin/bots',{enabled:false}).status,200);bots.tick();assert.equal(f.q('SELECT actions FROM bot_players').actions,0);
 f.call('admin/bots',{enabled:true});f.run('UPDATE users SET banned=1 WHERE id=2');bots.tick();assert.equal(f.q('SELECT actions FROM bot_players').actions,0);
 f.run("UPDATE users SET banned=0,role='owner' WHERE id=2");bots.tick();assert.equal(f.q('SELECT actions FROM bot_players').actions,0);
 f.run("UPDATE users SET role='player',prison_until=? WHERE id=2",f.time()+3600000);bots.tick();assert.equal(f.q('SELECT actions FROM bot_players').actions,0);
});
test('new family creation uses the same charged, atomic handler for humans and bots',t=>{
 const f=setup(t);f.run('DELETE FROM family_members WHERE user_id=2');assert.equal(f.call('families',{name:'Bot Family'},2).status,400);
 f.run('UPDATE users SET cash=1000000 WHERE id=2');assert.equal(f.call('families',{name:'Bot Family'},2).status,201);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,0);assert.equal(f.call('families',{name:'Another Family'},2).status,409);
});
test('mixed bot strategies execute hundreds of actions without internal errors or invalid balances',t=>{
 const f=setup(t);let seed=42;const random=(a,b)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return a+seed%(b-a)};
 f.run("UPDATE users SET cash=100000000,xp=20000 WHERE id=2");f.run("UPDATE bot_players SET personality='enforcer' WHERE user_id=2");
 const errors=[],bots=installBots(f.db,f.game,{clock:f.time,random,call:(id,path,body)=>{const r=f.call(path,body,id);if(r.status>=500)errors.push({path,...r});return r}});
 for(let i=0;i<300;i++){bots.step(2);f.advance(60000)}
 assert.deepEqual(errors,[]);assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);const u=f.q('SELECT * FROM users WHERE id=2');assert.ok(u.cash>=0&&u.energy>=0);assert.ok(f.q('SELECT actions FROM bot_players').actions>20);
});
test('roulette zero remains a numeric result for the animation',t=>{
 const f=fixture(t);const r=f.call('casino-extra/play',{game:'roulette',bet:'number',number:0,stake:1000,key:'zero-animation-test'});assert.equal(r.status,200);assert.equal(r.body.round.result,0);
});
