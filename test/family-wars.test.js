import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {raidChance} from '../family-wars.js';

test('raid odds track relative Power, defense and a tiny underdog chance',()=>{
 assert.equal(raidChance(100,100),.52);assert.equal(raidChance(1,1000000),.14500000000000002);
 assert.equal(raidChance(1000000,1),.895);assert.ok(raidChance(1000,100)>raidChance(100,100));
 assert.ok(raidChance(100,100,.75)<raidChance(100,100));assert.equal(raidChance(0,0),.52);
});
test('raid loot exceeds the old cap, stays below ten percent and conserves treasury cash',t=>{
 const f=fixture(t);f.high(true);const before=f.q('SELECT SUM(treasury) total FROM families').total;
 const quote=f.call('family/rivals').body.families.find(r=>r.id===2);const r=f.call('family/raid',{familyId:2,chance:1,reward:999999999999});
 assert.equal(r.status,200);assert.equal(r.body.chance,quote.chance);assert.equal(r.body.reward,quote.maxLoot);assert.ok(r.body.reward>10000000);assert.ok(r.body.reward<=1000000000);
 assert.equal(f.q('SELECT SUM(treasury) total FROM families').total,before);
 const ammo=f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo;
 assert.equal(f.call('family/raid',{familyId:2}).status,429);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo,ammo);
});
test('only leadership declares wars, duplicates are rejected and failed attacks do not grant free points',t=>{
 const f=fixture(t);assert.equal(f.call('family/war/declare',{familyId:2},2).status,403);assert.equal(f.call('family/war/declare',{familyId:1}).status,400);
 assert.equal(f.call('family/war/declare',{familyId:2}).status,200);assert.equal(f.call('family/war/declare',{familyId:2}).status,409);
 assert.equal(f.call('family/raid',{familyId:2}).body.success,true);
 f.advance(31*60000);f.dice(9999);f.run('UPDATE users SET energy=100');assert.equal(f.call('family/raid',{familyId:1},3).body.success,false);
 f.reset();const w=f.call('family/rivals').body.wars[0];assert.equal(w.attacker_score,1);assert.equal(w.defender_score,0);assert.equal(w.battles.length,2);assert.ok(w.battles.every(b=>b.attacker_power>0));
 f.advance(24*3600000);const ended=f.call('family/rivals').body.wars[0];assert.equal(ended.status,'completed');assert.equal(ended.winner_id,1);assert.equal(ended.ended_at,ended.ends_at);
 assert.equal(f.call('family/raid',{familyId:2}).status,409);
});
test('surrender, ceasefire, missing membership and custody cannot bypass war rules',t=>{
 const f=fixture(t);assert.equal(f.call('family/rivals',undefined,4).body.family,null);assert.equal(f.call('family/war/declare',{familyId:2},4).status,403);
 assert.equal(f.call('family/war/declare',{familyId:2}).status,200);assert.equal(f.call('family/war/surrender',{},2).status,403);
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);assert.notEqual(f.call('family/war/surrender',{}).status,200);f.run('UPDATE users SET prison_until=0 WHERE id=1');
 assert.equal(f.call('family/war/surrender',{},3).status,200);assert.equal(f.call('family/rivals').body.wars[0].winner_id,1);
 const before=f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo;
 assert.equal(f.call('family/raid',{familyId:2}).status,409);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo,before);
 assert.equal(f.call('family/war/declare',{familyId:2}).status,409);f.advance(86400001);assert.equal(f.call('family/war/declare',{familyId:2}).status,200);
});
test('uneventful wars draw; new-family protection and empty treasury remain safe',t=>{
 const f=fixture(t);f.run('UPDATE families SET created_at=? WHERE id=2',f.time());assert.equal(f.call('family/war/declare',{familyId:2}).status,409);
 f.advance(3600001);assert.equal(f.call('family/war/declare',{familyId:2}).status,200);f.advance(86400001);assert.equal(f.call('family/rivals').body.wars[0].winner_id,null);
 f.advance(86400001);f.run('UPDATE families SET treasury=0 WHERE id=2');assert.equal(f.call('family/raid',{familyId:2}).body.reward,0);
});
