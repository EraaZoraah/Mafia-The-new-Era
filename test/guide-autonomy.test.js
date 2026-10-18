import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {gameKnowledge} from '../game-knowledge.js';
import {coins} from '../city-expansion.js';
import {stolenVehicles} from '../vehicle-catalog.js';
import {skins} from '../skins.js';
import {cityGeography} from '../public/city-geography.js';
test('Luca indexes every coin, public skin, recovered vehicle and city contour',()=>{
 const knowledge=gameKnowledge();for(const item of [...coins,...stolenVehicles,...skins.filter(s=>!s.ownerOnly)])assert.ok(knowledge.some(k=>k.title.includes(item.name)),item.name);
 for(const [city,g] of Object.entries(cityGeography)){assert.ok(g.outline.length>100);assert.ok(knowledge.some(k=>k.title===city+' city map'&&k.text.includes(String(g.cells.length))));}
});
test('Luca uses actual pending car quotes, parking and warehouse capacity',t=>{
 const f=fixture(t);f.run("INSERT INTO vehicle_loot(user_id,vehicle_id,city,state,created_at) VALUES(1,'dacia-sandero','New York','pending',?)",f.time());
 const car=f.call('vehicles').body.entries[0],r=f.call('guide?q=gestolen%20auto%20opslag');assert.equal(r.status,200);assert.match(r.body.answer,/Dacia Sandero/);assert.ok(r.body.answer.includes(car.saleValue.toLocaleString('en-US')));assert.match(r.body.answer,/0\/0/);assert.equal(r.body.links[0].tab,'warehouses');
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);assert.match(f.call('guide?q=stolen%20vehicle').body.answer,/unavailable until release/);
});
test('Luca explains current family capture counts, cooldowns and role restrictions',t=>{
 const f=fixture(t);f.run('INSERT INTO family_capture_state(family_id,attempt_until,success_until,shield_until) VALUES(1,?,?,0)',f.time()+3600000,f.time()+86400000);
 const r=f.call('guide?q=kan%20ik%20territorium%20veroveren',undefined,2);assert.equal(r.status,200);assert.match(r.body.answer,/0\/10/);assert.match(r.body.answer,/Attempt cooldown until/);assert.match(r.body.answer,/Ask your Don or Capo/);assert.equal(r.body.links[0].tab,'family-territory');
 const outsider=f.call('guide?q=city%20map',undefined,4);assert.match(outsider.body.answer,/Join a family first/);
 assert.match(f.call('guide?q=TERRITORY',undefined,2).body.answer,/Attempt cooldown until/);
});
