import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {bribePrice} from '../bribery.js';
test('failed crimes can offer a bribe while custody and action restrictions remain enforced',t=>{
 const f=fixture(t);f.bribe(0);f.dice(9999);const crime=f.call('catalog').body.crimes.find(c=>!c.locked&&c.requiredXp<=1000);
 const r=f.call('action',{kind:crime.id});assert.equal(r.status,200);assert.ok(r.body.prisonMinutes>0);assert.ok(r.body.bribe);
 const offer=r.body.bribe;assert.equal(offer.image,'/images/police-bribe.png');assert.ok(f.q('SELECT prison_until FROM users WHERE id=1').prison_until>f.time());
 assert.equal(f.call('action',{kind:crime.id}).status,409);assert.equal(f.call('bribery').body.offer.id,offer.id);
 assert.equal(f.call('bribery/pay',{id:offer.id,maxCost:offer.cost},2).status,404);
 const before=f.q('SELECT cash FROM users WHERE id=1').cash;assert.equal(f.call('bribery/pay',{id:offer.id,maxCost:offer.cost-1}).status,409);
 const paid=f.call('bribery/pay',{id:offer.id,maxCost:offer.cost});assert.equal(paid.status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-offer.cost);assert.equal(f.q('SELECT prison_until FROM users WHERE id=1').prison_until,0);
 assert.equal(f.call('bribery/pay',{id:offer.id,maxCost:offer.cost}).body.duplicate,true);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-offer.cost);
});
test('expired, declined, unaffordable and replaced offers cannot release a prisoner',t=>{
 for(const mode of ['expire','decline','cash','replace']){const f=fixture(t);f.bribe(0);f.dice(9999);const c=f.call('catalog').body.crimes.find(c=>!c.locked&&c.requiredXp<=1000),r=f.call('action',{kind:c.id}),o=r.body.bribe;assert.ok(o);
  if(mode==='expire')f.advance(90001);if(mode==='decline')assert.equal(f.call('bribery/decline',{id:o.id}).status,200);if(mode==='cash')f.run('UPDATE users SET cash=0 WHERE id=1');if(mode==='replace')f.run('UPDATE custody SET released_at=? WHERE id=?',f.time(),o.custody_id);
  assert.equal(f.call('bribery/pay',{id:o.id,maxCost:o.cost}).status,409);assert.ok(f.q('SELECT prison_until FROM users WHERE id=1').prison_until>f.time());
 }
});
test('no bribe for most arrests, successful jobs or paid player reports; prices scale and stay below initial bail',t=>{
 const f=fixture(t);f.bribe(9999);f.dice(9999);const c=f.call('catalog').body.crimes.find(c=>!c.locked&&c.requiredXp<=1000);assert.equal(f.call('action',{kind:c.id}).body.bribe,null);
 assert.equal(bribePrice(0,10000,100000),3700);assert.ok(bribePrice(1e9,1000000,10000000)>bribePrice(0,10000,10000000));assert.equal(bribePrice(1e9,1e12,100000),65000);
 const g=fixture(t);g.bribe(0);assert.equal(g.call('custody/report',{target:'MemberOne',hours:1}).status,200);assert.equal(g.call('bribery',undefined,2).body.offer,null);
});
