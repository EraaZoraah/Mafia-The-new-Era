import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {addBotWave} from '../bot-wave.js';
import {installBots} from '../bot-players.js';
test('additive wave creates fifty distinct low-start player bots without changing existing accounts',t=>{
 const f=fixture(t),before=f.db.prepare('SELECT * FROM users ORDER BY id').all();let n=0;
 const wave=addBotWave(f.db,{clock:f.time,random:(a,b)=>a+(n++%(b-a)),hash:()=> 'test-only-non-login-hash'});
 assert.equal(wave.added.length,50);assert.equal(new Set(wave.added.map(b=>b.username)).size,50);assert.ok(wave.added.every(b=>/^[A-Za-z]+ [A-Za-z]+$/.test(b.username)));
 assert.deepEqual(f.db.prepare('SELECT * FROM users WHERE id<=4 ORDER BY id').all(),before);
 for(const bot of wave.added){const u=f.q('SELECT * FROM users WHERE id=?',bot.id);assert.equal(u.role,'player');assert.equal(u.cash,5000);assert.equal(u.xp,0)}
 assert.ok(new Set(wave.added.map(b=>b.activity)).size>1);assert.ok(new Set(wave.added.map(b=>b.personality)).size>1);
 assert.equal(addBotWave(f.db).alreadyApplied,true);assert.equal(f.q('SELECT COUNT(*) n FROM users').n,54);assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
});
test('all fifty added bots can act through normal player handlers without internal errors',t=>{
 const f=fixture(t),wave=addBotWave(f.db,{clock:f.time,random:(a,b)=>a,hash:()=> 'test-only-non-login-hash'}),errors=[];
 const bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>a,call:(id,path,body)=>{const result=f.call(path,body,id);if(result.status>=500)errors.push({id,path,status:result.status});return result}});
 for(let round=0;round<3;round++){for(const bot of wave.added)bots.step(bot.id);f.advance(60000)}
 assert.deepEqual(errors,[]);for(const bot of wave.added)assert.ok(f.q('SELECT actions FROM bot_players WHERE user_id=?',bot.id).actions>0,bot.username);
 assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
});
