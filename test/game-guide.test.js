import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';

test('local guide reads the signed-in player without changing money or XP',t=>{
 const f=fixture(t,false);f.run("UPDATE armory_accounts SET ammo=0 WHERE scope='personal' AND owner_id=4" );const before=f.q('SELECT cash,xp FROM users WHERE id=4');
 const r=f.call('guide?q=where%20can%20I%20buy%20a%20business',undefined,4);
 assert.equal(r.status,200);assert.equal(r.body.mode,'local');assert.equal(r.body.links[0].tab,'business');
 assert.ok(r.body.suggestions.some(x=>x.tab==='families'));
 assert.ok(r.body.suggestions.some(x=>x.tab==='armory'));
 assert.deepEqual(f.q('SELECT cash,xp FROM users WHERE id=4'),before);
});
test('guide prioritizes specific family destinations and supports Dutch questions',t=>{
 const f=fixture(t);
 assert.equal(f.call('guide?q=waar%20zijn%20familie%20compounds').body.links[0].tab,'family-compounds');
 assert.equal(f.call('guide?q=hoe%20werkt%20familie%20territorium').body.links[0].tab,'family-territory');
 assert.equal(f.call('guide?q=waar%20kan%20ik%20kogels%20kopen').body.links[0].tab,'armory');
});
test('guide remains available in detention and uses the server clock',t=>{
 const f=fixture(t);f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);
 assert.equal(f.call('guide').body.suggestions[0].tab,'prison');
 f.advance(3600001);assert.notEqual(f.call('guide').body.suggestions[0].tab,'prison');
 f.run('UPDATE users SET hospital_until=? WHERE id=1',f.time()+3600000);
 assert.equal(f.call('guide').body.suggestions[0].tab,'hospital');
});

