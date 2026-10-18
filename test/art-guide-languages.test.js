import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {artCatalog,artHeists} from '../art-market.js';
import {gameKnowledge} from '../game-knowledge.js';
import {collectorCars,extraStolenCars} from '../collector-cars.js';
test('Luca indexes every new artwork, heist and car from the authoritative catalogs',()=>{
 const k=gameKnowledge();for(const x of [...artCatalog,...artHeists,...collectorCars,...extraStolenCars])assert.ok(k.some(e=>e.title===x.name),x.name);
});
test('Luca explains art mechanics in English and Dutch and observes account restrictions',t=>{
 const f=fixture(t);const en=f.call('guide?q=art%20auction').body,nl=f.call('guide?q=kunstveiling&lang=nl').body;
 assert.ok(en.answer.includes('8%'));assert.equal(nl.language,'nl');assert.ok(nl.answer.includes('gereserveerd'));assert.ok(nl.answer.includes('8%'));
 f.run('UPDATE users SET cash=0,energy=0,prison_until=? WHERE id=1',f.time()+60000);
 const locked=f.call('guide?q=kunst&lang=nl').body;assert.ok(locked.answer.includes('vrijlating'));assert.equal(locked.suggestions[0].tab,'prison');assert.ok(!locked.answer.includes('Je kunt qua middelen'));
 const car=f.call('guide?q=mercedes-300sl-roadster&lang=nl').body;assert.ok(car.answer.includes('Mercedes-Benz 300 SL Roadster'));assert.equal(car.links[0].tab,'car');
});
test('Dutch production advice uses current authoritative live quotes and storage restrictions',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=1");
 const r=f.call('guide?q=gunstige%20drugsproductie&lang=nl').body;assert.equal(r.language,'nl');assert.ok(r.answer.includes('opslag'));assert.ok(!r.answer.includes('Best within your current'));
});
