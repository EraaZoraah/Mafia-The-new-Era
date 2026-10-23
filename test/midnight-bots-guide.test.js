import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {catalog} from '../catalog.js';
import {installBots} from '../bot-players.js';
import {gameKnowledge} from '../game-knowledge.js';
import {driverRanks,raceRoutes} from '../midnight-catalog.js';
const equip=(f,id)=>{f.run("UPDATE users SET city='New York',energy=1000 WHERE id=?",id);const g=catalog.find(c=>c.category==='garage'&&!c.storageKind),c=catalog.find(c=>c.category==='car');f.call('assets/buy',{category:'garage',id:g.id},id);f.call('assets/buy',{category:'car',id:c.id},id);return 'p:'+c.id;};
test('bots create and join real lobbies, use actual escrow and can repair/tune',t=>{
 const f=fixture(t);f.high((min,max)=>max===10000?10000:Math.floor((min+max)/2));const key=equip(f,2);equip(f,3);for(const id of [2,3])f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(?,'builder',0)",id);
 const calls=[],bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>b===3?0:b-1,call:(id,path,body)=>{const r=f.call(path,body,id);calls.push({path,status:r?.status});return r}});f.run('INSERT INTO race_vehicle_state(user_id,car_key,wear,tune) VALUES(?,?,35,0)',2,key);bots.step(2,{domain:'circuit'});assert.ok(calls.some(c=>c.path==='circuit/workshop'&&c.status===200));
 // Deterministic choices create a two-player lobby; a second bot joins it.
 bots.step(2,{domain:'circuit'});assert.ok(calls.some(c=>c.path==='circuit/create'&&c.status===200));bots.step(3,{domain:'circuit'});assert.ok(calls.some(c=>c.path==='circuit/join'&&c.status===200));f.advance(1800001);f.tick();assert.equal(f.call('circuit',undefined,2).body.history[0].state,'finished');assert.ok(calls.every(c=>c.status<500));
});
test('Luca has all routes and driver ranks, reads live quotes and respects custody in both languages',t=>{
 const f=fixture(t);equip(f,1);const k=gameKnowledge();for(const item of [...raceRoutes,...driverRanks])assert.ok(k.some(e=>e.title===item.name));
 for(const lang of ['en','nl']){const r=f.call('guide?q=Midnight%20Circuit&lang='+lang).body;assert.match(r.answer,/95%/);assert.ok(r.suggestions.length);assert.equal(r.links[0].tab,'circuit');}
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);for(const lang of ['en','nl']){const r=f.call('guide?q=Midnight%20Circuit&lang='+lang).body;assert.equal(r.suggestions.length,0);assert.match(r.answer,/detained|vrijlating/);}
});
test('condition impacts actual projected reliability without changing stars or sale quotes',t=>{const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=1");f.call('assets/buy',{category:'garage',id:'vehicle-warehouse'});f.run("INSERT INTO vehicle_loot(user_id,vehicle_id,city,state,created_at,condition_stars) VALUES(1,'dacia-sandero','New York','stored',?,1),(1,'dacia-sandero','New York','stored',?,5)",f.time(),f.time());const b=f.call('circuit').body;assert.equal(b.recommendation.car,b.cars.find(c=>c.stars===5).key);});
