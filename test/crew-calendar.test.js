import {releaseNotes} from '../release-notes.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {crewMissions,compoundUpgrades} from '../crew-operations.js';
import {sundayBonus} from '../calendar-events.js';

test('crew launch validates all members atomically and replay never pays twice',t=>{
 const f=fixture(t),created=f.call('team-missions/create',{mission:'velvet-handoff'});assert.equal(created.status,200);const id=created.body.id;
 assert.equal(f.call('team-missions/launch',{id}).status,409);
 assert.equal(f.call('team-missions/join',{id},2).status,200);
 assert.equal(f.call('team-missions/launch',{id},2).status,403);
 const before=f.q('SELECT cash,energy,xp FROM users WHERE id=1'),ammo=f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo;
 f.run("UPDATE armory_accounts SET ammo=0 WHERE scope='personal' AND owner_id=2");assert.notEqual(f.call('team-missions/launch',{id}).status,200);
 assert.deepEqual(f.q('SELECT cash,energy,xp FROM users WHERE id=1'),before);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo,ammo);
 f.run("UPDATE armory_accounts SET ammo=100 WHERE scope='personal' AND owner_id=2");const result=f.call('team-missions/launch',{id});assert.equal(result.status,200);assert.equal(result.body.rewards.length,2);assert.equal(result.body.success,true);
 const paid=f.q('SELECT cash,energy,xp FROM users WHERE id=1');assert.equal(paid.cash,before.cash-500+30000);assert.equal(paid.xp,before.xp+1200);
 f.call('team-missions/launch',{id});assert.deepEqual(f.q('SELECT cash,energy,xp FROM users WHERE id=1'),paid);
 assert.equal(f.call('team-missions/create',{mission:'velvet-handoff'}).status,429);
});
test('four crew sizes, expiration and leaving never debit a player',t=>{
 assert.deepEqual(crewMissions.map(m=>m.size),[2,3,4,5]);const f=fixture(t),cash=f.q('SELECT cash FROM users WHERE id=1').cash;
 const id=f.call('team-missions/create',{mission:'velvet-handoff'}).body.id;
 f.call('team-missions/join',{id},2);assert.equal(f.call('team-missions/leave',{id},2).status,200);
 f.advance(30*60000);assert.equal(f.call('team-missions/launch',{id}).status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
});
test('compound extensions require a base and Don/Capo; bonuses survive moving',t=>{
 const f=fixture(t);assert.notEqual(f.call('compound/upgrade',{upgrade:'command-suite'}).status,200);
 assert.equal(f.call('family/buy',{id:'compound-yard',quantity:1}).status,200);
 assert.equal(f.call('compound/upgrade',{upgrade:'command-suite'},2).status,403);
 const before=f.call('armory?scope=family').body.power.total;
 assert.equal(f.call('compound/upgrade',{upgrade:'command-suite'}).status,200);
 assert.equal(f.call('armory?scope=family').body.power.total,before+500);
 assert.equal(f.call('compound/upgrade',{upgrade:'command-suite'}).status,409);
 assert.equal(f.call('family/buy',{id:'compound-estate',quantity:1}).status,200);
 assert.equal(f.call('compound/upgrades').body.upgrades[0].owned,true);assert.equal(compoundUpgrades.length,5);
});
test('Sunday applies only on UTC Sundays and calendar acknowledgement is per player',t=>{
 const f=fixture(t),normal=f.call('catalog').body.crimes[0];f.advance(Date.UTC(2026,9,18)-f.time());
 assert.equal(sundayBonus(f.time()),1.5);const boosted=f.call('catalog').body.crimes[0];assert.equal(boosted.xp,Math.floor(normal.xp*1.5));
 const d=f.call('calendar').body;assert.equal(d.active,true);assert.equal(d.seen,false);assert.equal(f.call('calendar/ack',{id:d.id}).status,200);assert.equal(f.call('calendar').body.seen,true);assert.equal(f.call('calendar',undefined,2).body.seen,false);
 f.advance(86400000);assert.equal(f.call('calendar').body.active,false);assert.equal(f.call('catalog').body.crimes[0].xp,normal.xp);
});
test('passive income crosses Sunday midnight without boosting Saturday hours',t=>{
 const f=fixture(t);f.advance(Date.UTC(2026,9,17,23)-f.time());f.call('employees/hire',{item:'runner',quantity:1,key:'calendar-employee-test'});
 const cash=f.q('SELECT cash FROM users WHERE id=1').cash;f.advance(2*3600000);f.call('income/claim',{});assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash-cash,7000);
});
test('lottery Lucky Winner lasts 24 hours from draw, not collection',t=>{
 const f=fixture(t),d=f.call('casino-extra').body.lottery;f.call('lottery/buy',{day:d.day,quantity:1,key:'lottery-emblem-test'});f.advance(d.ends_at-f.time());
 assert.equal(f.call('presence?ids=1').body.players[0].luckyWinner.title,'Lucky Winner');f.advance(86400000);assert.equal(f.call('presence?ids=1').body.players[0].luckyWinner,null);
});
test('five-player mission pays all five once and failure still consumes approved supplies',t=>{
 const f=fixture(t);f.run("INSERT INTO users(id,username,role) VALUES(5,'FifthPlayer','player')");f.reset();f.run('UPDATE users SET xp=8000');
 f.run("INSERT INTO armory_weapons VALUES('personal',5,'sovereign-arsenal',1)");f.run("UPDATE armory_accounts SET ammo=500 WHERE scope='personal' AND owner_id=5");
 const id=f.call('team-missions/create',{mission:'crown-vault'}).body.id;
 for(const user of [2,3,4,5])assert.equal(f.call('team-missions/join',{id},user).status,200);
 f.dice(9999);const result=f.call('team-missions/launch',{id});assert.equal(result.status,200);assert.equal(result.body.success,false);assert.equal(result.body.rewards.length,5);
 for(const r of result.body.rewards){assert.equal(r.cash,0);assert.equal(r.xp,750);assert.equal(f.q('SELECT cash FROM users WHERE id=?',r.id).cash,10000000000-8000);assert.equal(f.q('SELECT energy FROM users WHERE id=?',r.id).energy,65)}
 assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=5").ammo,300);
});
test('current snapshot becomes one automatic announcement, once',t=>{
 const f=fixture(t);f.tick();f.tick();const rows=f.db.prepare("SELECT * FROM bulletins WHERE title LIKE 'New features%'").all();assert.equal(rows.length,2);assert.ok(rows.some(r=>/Luca/.test(r.body)));assert.ok(rows.some(r=>/skins/i.test(r.body)));assert.ok(rows.some(r=>/claim button/.test(r.body)));for(const row of rows)assert.doesNotMatch(row.body,/wedding costs|staff|payout.*percent/i);
});
