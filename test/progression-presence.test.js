import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {ranks} from '../progression.js';
import {releaseFee} from '../underworld.js';

test('presence uses server time, avoids duplicate playtime and records distinct active UTC days',t=>{
 const f=fixture(t);const pulse=()=>f.call('presence/heartbeat',{},2);
 pulse();assert.equal(f.call('presence?ids=2').body.players[0].online,true);f.advance(30000);pulse();pulse();
 let p=f.call('profiles/2').body.player;assert.equal(p.playMillis,30000);assert.equal(p.daysPlayed,1);
 f.advance(90001);assert.equal(f.call('presence?ids=2').body.players[0].online,false);pulse();assert.equal(f.call('profiles/2').body.player.playMillis,30000);
 f.advance(86400000);pulse();assert.equal(f.call('profiles/2').body.player.daysPlayed,2);
 const d=f.call('admin/population?filter=online').body;assert.equal(d.online,1);assert.equal(d.players[0].id,2);assert.equal(d.players[0].playMillis,30000);assert.equal(d.total,4);
 assert.equal(f.call('admin/population',undefined,2).status,403);assert.equal(f.call('presence?ids=2,0').status,400);assert.equal(f.call('presence?ids=2;DELETE').status,400);
 f.run('UPDATE users SET banned=1 WHERE id=2');assert.equal(f.call('presence?ids=2').body.players[0].online,false);
});

test('same-family robbery, kidnapping and liquidation reject before spending resources',t=>{
 const f=fixture(t),before=f.q('SELECT cash,energy,xp FROM users WHERE id=1'),ammo=f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo;
 for(const kind of ['rob','hostage','liquidate'])assert.equal(f.call('pvp',{kind,target:'MemberOne',anonymous:kind==='liquidate'}).status,403);
 assert.deepEqual(f.q('SELECT cash,energy,xp FROM users WHERE id=1'),before);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo,ammo);
 assert.equal(f.call('pvp',{kind:'rob',target:'DonTwo'}).status,200);
});

test('anonymous liquidation charges once per valid attempt and hides identity on success and failure',t=>{
 const f=fixture(t);for(const success of [false,true]){
  f.dice(success?0:9999);const before=f.q('SELECT cash FROM users WHERE id=1').cash;
  const r=f.call('pvp',{kind:'liquidate',target:'DonTwo',anonymous:true});assert.equal(r.status,200);assert.equal(r.body.success,success);assert.equal(r.body.anonymousFee,500000);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-500000);
  assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo',anonymous:true}).status,429);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-500000);
  const notices=f.call('notifications',undefined,3).body.notifications;assert.ok(notices.length);assert.ok(notices.every(n=>!n.message.includes('DonOne')));
  assert.equal(f.q("SELECT COUNT(*) n FROM events WHERE user_id=3 AND message LIKE '%DonOne%'").n,0);
  f.advance(3600000);
 }
 assert.equal(f.call('custody').body.stays.find(s=>s.user_id===3).base_fee,1000000);
});

test('anonymous reports hide identity, validate flags and include the surcharge',t=>{
 const f=fixture(t),before=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(f.call('custody/report',{target:'DonTwo',hours:1,anonymous:'false'}).status,400);
 const r=f.call('custody/report',{target:'DonTwo',hours:1,anonymous:true});assert.equal(r.status,200);assert.equal(r.body.cost,750000);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-750000);
 assert.ok(f.call('notifications',undefined,3).body.notifications.every(n=>!n.message.includes('DonOne')));
 const s=f.call('custody').body.stays[0];assert.equal(s.cost,25000);f.advance(1800000);assert.equal(f.call('custody').body.stays[0].cost,12500);
 assert.equal(releaseFee(ranks.at(-1).xp,'coma',100000000),100000000);
 assert.equal(releaseFee(0,'coma',100000000),1000000);
});

test('achievement XP can be claimed once, restores promotion energy, and survives reset',t=>{
 const f=fixture(t);f.run('UPDATE users SET xp=?,energy=0 WHERE id=2',ranks[1].xp-500);
 const m=f.call('achievements',undefined,2).body.milestones.find(m=>m.id==='first-family');assert.equal(m.xpReward,500);
 assert.equal(f.call('achievements/claim',{milestone:'first-team'},2).status,403);
 assert.equal(f.call('achievements/claim',{milestone:'first-family'},2).status,200);
 assert.equal(f.q('SELECT xp FROM users WHERE id=2').xp,ranks[1].xp);assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,110);
 assert.equal(f.call('achievements/claim',{milestone:'first-family'},2).status,409);f.reset();assert.equal(f.call('achievements/claim',{milestone:'first-family'},2).status,409);
 const reset=f.call('admin/player-lifecycle',{id:2,confirmName:'MemberOne',confirm:true,action:'reset'});assert.equal(reset.status,200);
 f.run('INSERT INTO family_members(user_id,family_id) VALUES(2,1)');assert.equal(f.call('achievements/claim',{milestone:'first-family'},2).status,409);assert.equal(f.q('SELECT xp FROM users WHERE id=2').xp,0);
});

test('unaffordable anonymous attempts and invalid flags cannot consume ammunition or energy',t=>{
 const f=fixture(t);f.run('UPDATE users SET cash=499999 WHERE id=1');
 const before=f.q('SELECT cash,energy FROM users WHERE id=1'),ammo=f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo;
 assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo',anonymous:true}).status,400);
 assert.equal(f.call('pvp',{kind:'rob',target:'DonTwo',anonymous:true}).status,400);
 assert.equal(f.call('pvp',{kind:'liquidate',target:'DonTwo',anonymous:'false'}).status,400);
 assert.deepEqual(f.q('SELECT cash,energy FROM users WHERE id=1'),before);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo,ammo);
});

test('all registered bots retain their emblem metadata including banned bots',t=>{
 const f=fixture(t);for(const id of [2,3,4])f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(?,'builder',?)",id,f.time());
 f.run('UPDATE users SET banned=1,online_until=? WHERE id=3',f.time()+90000);
 const players=f.call('presence?ids=1,2,3,4').body.players;
 assert.equal(players.length,4);assert.equal(players.find(p=>p.id===1).bot,false);
 for(const id of [2,3,4])assert.equal(players.find(p=>p.id===id).bot,true);
 assert.equal(players.find(p=>p.id===3).online,false);
});
