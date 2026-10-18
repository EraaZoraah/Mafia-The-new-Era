import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers/game-fixture.js';
import {flightQuote,cities} from '../logistics.js';
import {employees} from '../city-expansion.js';
import {sortCollection} from '../public/asset-order.js';
test('distance-based air fares have a million-dollar minimum and grow with distance',()=>{
 for(const a of cities)for(const b of cities){const q=flightQuote(a,b);assert.ok(q.cost>=1000000);assert.deepEqual(q,flightQuote(b,a));}
 assert.ok(flightQuote('Amsterdam','Tokyo').cost>flightQuote('Amsterdam','London').cost);
});
test('billion-runner storage migration retains existing crew and fractional income',t=>{
 const f=fixture(t);f.run('INSERT INTO employees(user_id,item_id,quantity,income_at,remainder,respect_remainder) VALUES(?,?,?,?,?,?)',1,'runner',1,f.time(),.25,.5);
 f.reset();assert.equal(f.q('SELECT respect_remainder n FROM employees WHERE user_id=1').n,.5);
 assert.equal(employees.find(x=>x.id==='runner').limit,1000000000);
 f.run('UPDATE users SET cash=200000000000000 WHERE id=1');
 const result=f.call('employees/hire',{item:'runner',quantity:999999999,key:randomUUID()});assert.equal(result.status,200);
 assert.equal(result.body.cost,99999999900000);
 assert.equal(f.call('employees/hire',{item:'runner',quantity:1,key:randomUUID()}).status,400);
});
test('investments accept 100 billion, preserve old positions and enforce aggregate cap',t=>{
 const f=fixture(t);f.run('UPDATE users SET cash=200000000000 WHERE id=1');
 const q=f.call('investments').body.accounts[0].quotes[0];
 const result=f.call('investments/open',{scope:'personal',amount:100000000000,hours:q.hours,rateBps:q.rateBps});assert.equal(result.status,200);
 assert.equal(f.call('investments/open',{scope:'personal',amount:1,hours:q.hours,rateBps:q.rateBps}).status,409);
 f.reset();assert.equal(f.call('investments').body.accounts[0].activePrincipal,100000000000);
 f.advance(q.hours*3600000);assert.equal(f.call('investments/claim',{scope:'personal',id:result.body.id}).status,200);
 assert.equal(f.call('investments/claim',{scope:'personal',id:result.body.id}).status,409);
});
test('family names cost treasury funds, have a lifetime limit and reject non-managers',t=>{
 const f=fixture(t),body={mode:'open',theme:'gold',crest:'lion',motto:'Loyalty'};
 assert.equal(f.call('family/preferences',{...body,name:'New Family'},2).status,403);
 const before=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 for(let i=1;i<=3;i++)assert.equal(f.call('family/preferences',{...body,name:'New Family '+i}).status,200);
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,before-3000000);
 assert.equal(f.call('family/preferences',{...body,name:'New Family 4'}).status,409);
 assert.equal(f.call('family/preferences',body).status,200);
});
test('collection sorting is stable, does not mutate input, and distinguishes condition from value',()=>{
 const cars=[{name:'Classic',saleValue:100,condition_stars:1},{name:'Sedan',saleValue:20,condition_stars:5}];
 assert.equal(sortCollection(cars,'condition')[0].name,'Sedan');assert.equal(sortCollection(cars)[0].name,'Classic');assert.equal(cars[0].name,'Classic');
});
test('read settlement retains claimable income, claims pay once and detention pauses accrual',t=>{
 const f=fixture(t);assert.equal(f.call('employees/hire',{item:'runner',quantity:1,key:randomUUID()}).status,200);
 const before=f.q('SELECT cash FROM users WHERE id=1').cash;f.advance(3600000);
 f.game.settle(1,false);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before);
 assert.equal(f.q('SELECT pending_income FROM users WHERE id=1').pending_income,2800);
 const claim=f.call('income/claim',{});assert.equal(claim.body.payout,2800);
 assert.equal(f.call('income/claim',{}).body.payout,0);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before+2800);
 f.call('custody/report',{target:'DonOne',hours:6},3);f.advance(3600000);f.game.settle(1,false);
 assert.equal(f.q('SELECT pending_income FROM users WHERE id=1').pending_income,0);
});
test('Luca links the dedicated auction house in both languages',t=>{
 const f=fixture(t);
 for(const lang of ['en','nl']){
  const response=f.call('guide?q='+encodeURIComponent(lang==='nl'?'Waar is het veilinghuis?':'Where is the auction house?')+'&lang='+lang);
  assert.equal(response.status,200);assert.ok(response.body.links.some(x=>x.tab==='auction-house'));
 }
});
test('dashboard hourly crew income matches actual employee payout without a rank multiplier',t=>{
 const f=fixture(t);f.call('employees/hire',{item:'runner',quantity:1,key:randomUUID()});f.run('UPDATE users SET xp=1000000000 WHERE id=1');
 assert.equal(f.game.profile(f.q('SELECT * FROM users WHERE id=1')).benefits.income,2800);
});
