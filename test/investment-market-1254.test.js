import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {cityDrugMarkets,cityFactors} from '../drug-markets.js';

test('staff can mature personal and family investments without moving funds or reopening claims',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=2");
 for(const scope of ['personal','family']){
  const quote=f.call('investments').body.accounts.find(a=>a.scope===scope).quotes.at(-1);
  const opened=f.call('investments/open',{scope,amount:1000000,hours:72,rateBps:quote.rateBps});assert.equal(opened.status,200);
  const id=opened.body.id,body={scope,targetId:1,id,operation:'mature'},before=f.q('SELECT * FROM investments WHERE id=?',id);
  f.advance(3600000);const cash=f.q('SELECT cash FROM users WHERE id=1').cash,treasury=f.q('SELECT treasury FROM families WHERE id=1').treasury;
  assert.equal(f.call('admin/investment',body,4).status,403);
  if(scope==='personal')assert.equal(f.call('admin/investment',body,2).status,403,'Admin cannot edit Owner');
  assert.equal(f.call('admin/investment',body,scope==='family'?2:1).status,200);
  const after=f.q('SELECT * FROM investments WHERE id=?',id);
  assert.equal(after.matures_at,f.time());assert.equal(after.opened_at,before.opened_at);assert.equal(after.principal,before.principal);assert.equal(after.rate_bps,before.rate_bps);assert.equal(after.claimed,0);
  assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,treasury);
  assert.equal(f.call('investments/claim',{scope,id}).status,200);
  assert.equal(f.call('admin/investment',body).status,409);
  assert.equal(f.call('investments/claim',{scope,id}).status,409);
 }
});

test('city demand is stable within a quoted hour and rotates independently for each drug',()=>{
 const cities=Object.keys(cityDrugMarkets),winners=new Set();
 for(let hour=0;hour<30;hour++)for(let product=0;product<5;product++){
  const rows=cities.map(city=>({city,...cityFactors(city,product,hour)})).sort((a,b)=>b.sale-a.sale);
  winners.add(rows[0].city);
  assert.deepEqual(cityFactors(rows[0].city,product,hour),cityFactors(rows[0].city,product,hour));
  assert.equal(cityFactors(rows[0].city,product,hour).production,cityFactors(rows[0].city,product).production);
 }
 assert.ok(winners.size>=10,'Many cities must have genuine high-demand windows');
 assert.notDeepEqual(cityFactors('Dubai',0,9),cityFactors('Dubai',0,10));
});

test('Dubai stock has diverse real sale destinations and Luca uses the same current quote',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='Dubai',drugs_xp=1000000000 WHERE id=1");
 f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(1,'garage','production-warehouse',5,0,0)");
 assert.equal(f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:100,requestKey:'market-diversity-start-001'}).status,200);f.advance(6*3600000);
 const destinations=new Set();let international=0;
 for(let hour=0;hour<30;hour++){
  const d=f.call('production').body,b=d.batches[0],r=b.saleChoices.best;
  destinations.add(r.city);if(r.mode!=='local')international++;
  assert.ok(r.cost<=d.funds);assert.ok(r.risk<=.15);
  if(hour===0){const guide=f.call('guide?lang=en&q=where%20should%20I%20sell%20my%20cannabis').body;assert.ok(guide.drugSales);assert.ok(JSON.stringify(guide.drugSales).includes(r.city));}
  f.advance(3600000);
 }
 assert.ok(destinations.size>=5);assert.ok(international>=10,'Foreign markets should regularly compete with Dubai local sales');
 t.diagnostic('30-hour Dubai sample: '+destinations.size+' recommended cities, '+international+' international choices');
});
