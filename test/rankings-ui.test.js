import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
test('rankings choose top ten from all active players, with separate XP and Power order',t=>{
 const f=fixture(t);for(let i=5;i<=120;i++)f.run('INSERT INTO users(id,username,xp,cash) VALUES(?,?,?,?)',i,'RankTest'+i,i*100,0);
 f.run('UPDATE users SET xp=999999,cash=0 WHERE id=120');f.run('UPDATE users SET banned=1,xp=1000000 WHERE id=119');
 f.run("INSERT INTO armory_accounts VALUES('personal',120,0)");f.run("INSERT INTO armory_weapons VALUES('personal',120,'sovereign-arsenal',4)");
 const d=f.call('underworld').body;assert.equal(d.topRank.length,10);assert.equal(d.topPower.length,10);assert.equal(d.topRank[0].id,120);assert.equal(d.topPower[0].id,120);assert.ok(!d.topRank.some(p=>p.id===119));assert.ok(d.topFamilies[0].power.total>=d.topFamilies[1].power.total);assert.ok(d.topRank.every(p=>!('email' in p)&&!('password' in p)));
});
test('extended daily objectives distinguish successful crimes and persist individual claims',t=>{
 const f=fixture(t),day=f.call('daily').body.day;for(const success of [0,0,1,1])f.run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(1,?,?,?)','crime',success,f.time());
 let jobs=f.call('daily').body.jobs;assert.equal(jobs.length,6);assert.equal(jobs.find(j=>j.id==='professional').progress,2);assert.equal(f.call('daily/claim',{day,job:'professional'}).status,409);
 f.run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(1,?,?,?)','crime',1,f.time());assert.equal(f.call('daily/claim',{day,job:'professional'}).status,200);assert.equal(f.call('daily/claim',{day,job:'streets'}).status,200);assert.equal(f.call('daily/claim',{day,job:'professional'}).status,409);
 for(let i=0;i<3;i++)f.run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(1,?,?,?)','shipment',0,f.time());assert.equal(f.call('daily/claim',{day,job:'supply-line'}).status,200);assert.equal(f.call('daily/claim',{day,job:'shipment'}).status,200);
});
test('Owner promotion gives Admin real staff access without Owner editing rights',t=>{
 const f=fixture(t);assert.equal(f.call('admin/bulletins',undefined,2).status,403);assert.equal(f.call('admin/player',{id:2,changes:{role:'admin'}}).status,200);assert.equal(f.q('SELECT role FROM users WHERE id=2').role,'admin');assert.equal(f.call('admin/player?id=3',undefined,2).status,200);assert.equal(f.call('admin/bulletins',undefined,2).status,200);assert.equal(f.call('admin/economy',undefined,2).status,200);assert.equal(f.call('admin/player?id=1',undefined,2).status,403);assert.equal(f.call('admin/player',{id:2,changes:{role:'owner'}},2).status,403);
});
