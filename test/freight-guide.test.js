import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture as baseFixture} from './helpers/game-fixture.js';
const fixture=(...args)=>{const f=baseFixture(...args);f.run("INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(1,'garage','production-warehouse',0,0)");f.run("INSERT INTO family_assets VALUES(1,'warehouse-production-family',1)");return f;};
import {gameKnowledge} from '../game-knowledge.js';
import {employees} from '../city-expansion.js';
import {catalog} from '../catalog.js';
import {cityFactors,transportModes,freightQuote} from '../drug-markets.js';
import {progression,prestigeThreshold} from '../progression.js';
import {readFileSync,existsSync} from 'node:fs';
import {menu} from '../public/navigation.js';
import {crewMissions,compoundUpgrades} from '../crew-operations.js';
import {products,weapons} from '../logistics.js';
import {milestones} from '../legacy.js';

test('guide reads live catalogs and rulebook, and recommends only feasible crimes',t=>{
 const f=fixture(t),knowledge=gameKnowledge();
 for(const a of [...employees,...catalog,...crewMissions,...compoundUpgrades,...products,...weapons,...milestones])assert.ok(knowledge.some(k=>k.title===a.name),a.name);
 for(const item of menu)for(const [tab] of Array.isArray(item)?[item]:item.items)if(!['admin','tickets'].includes(tab))assert.ok(knowledge.some(k=>k.tab===tab),tab);
 for(const query of ['Street Runner','crypto','production','cash','respect','xp','command suite','prestige']){
  const r=f.call('guide?q='+encodeURIComponent(query));assert.equal(r.status,200,JSON.stringify(r.body));assert.ok(r.body.answer.length>30);
 }
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);
 const detained=f.call('guide?q=cash').body;assert.equal(detained.suggestions[0].tab,'prison');assert.ok(!detained.suggestions.some(s=>/attempt now/.test(s.label)));
});
test('assistant compares live, unlocked drug routes and includes costs and seizure risk',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York',drugs_xp=0 WHERE id=1");
 const answer=f.call('guide?q=best%20drug%20production%20city').body;
 assert.ok(answer.market);assert.equal(answer.market.bestAvailable.origin,'New York');assert.equal(answer.market.bestAvailable.product,'cannabis');
 assert.match(answer.answer,/interception|risk/);assert.match(answer.answer,/Quotes expire/);
 assert.ok(answer.market.bestAvailable.totalCost<=f.q('SELECT cash FROM users WHERE id=1').cash);
 const before=answer.market.asOf;f.advance(3600000);const newer=f.call('guide?q=drug%20production').body;assert.ok(newer.market.asOf>before);
 f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('guide?q=drug%20production').body.market.bestAvailable,null);
});
test('freight costs, transit locks, retry keys and ownership are enforced by server',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=1");
 const start=f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:10,requestKey:'freight-create-0001'});assert.equal(start.status,200);
 const id=start.body.id;f.advance(6*3600000);
 const before=f.q('SELECT cash FROM users WHERE id=1').cash;
 const body={scope:'personal',id,city:'Dubai',mode:'plane',requestKey:'freight-ship-000001'};
 const r=f.call('production/ship',body);assert.equal(r.status,200,JSON.stringify(r.body));
 const cash=f.q('SELECT cash FROM users WHERE id=1').cash;assert.ok(cash<before);
 assert.equal(f.call('production/ship',body).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
 assert.equal(f.call('production/sell',{scope:'personal',id,requestKey:'freight-sell-000001'}).status,409);
 assert.equal(f.call('production/ship',{...body,requestKey:'freight-ship-000002'}).status,409);
 assert.equal(f.call('production/ship',{...body,requestKey:'freight-ship-000003'},4).status,409);
 assert.equal(f.call('production').body.batches[0].intercepted,undefined);
 f.run('UPDATE production_batches SET intercepted=0 WHERE id=?',id);f.advance(4*3600000);
 assert.equal(f.call('production').body.batches[0].stock_city,'Dubai');
 const sold=f.call('production/sell',{scope:'personal',id,requestKey:'freight-sell-000002'});assert.equal(sold.status,200);
 assert.equal(f.call('production/sell',{scope:'personal',id,requestKey:'freight-sell-000003'}).status,409);
});
test('city quotes vary per drug; trucks reject ocean routes and seized stock is lost',t=>{
 const f=fixture(t);assert.ok(cityFactors('Dubai',0).sale>cityFactors('New York',0).sale);
 assert.notEqual(cityFactors('New York',0).production,cityFactors('New York',3).production);
 assert.equal(freightQuote('New York','Dubai',transportModes[2],100000,1),null);
 assert.ok(freightQuote('New York','Miami',transportModes[2],100000,1));
 const b=f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,requestKey:'seized-create-00001'}).body;f.advance(6*3600000);
 assert.equal(f.call('production/ship',{scope:'personal',id:b.id,city:'Dubai',mode:'truck',requestKey:'seized-truck-000001'}).status,400);
 assert.equal(f.call('production/ship',{scope:'personal',id:b.id,city:'Dubai',mode:'boat',requestKey:'seized-boat-000001'}).status,200);
 f.run('UPDATE production_batches SET intercepted=1 WHERE id=?',b.id);f.advance(16*3600000);
 assert.equal(f.call('production').body.batches.length,0);
 assert.equal(f.call('production/sell',{scope:'personal',id:b.id,requestKey:'seized-sell-000001'}).status,409);
 assert.equal(f.call('production').body.freightHistory[0].intercepted,1);
});
test('family cover settings require management rights and actual family asset ownership',t=>{
 const f=fixture(t),body={mode:'open',theme:'gold',crest:'lion',motto:'Our city',banner:'compound-castle'};
 assert.equal(f.call('family/preferences',body).status,400);
 f.run("INSERT INTO family_assets VALUES(1,'compound-castle',1)");
 assert.equal(f.call('family/preferences',body,2).status,403);
 assert.equal(f.call('family/preferences',body).status,200);
 assert.ok(f.call('family/dashboard').body.family.preferences.bannerImage);
 f.run("DELETE FROM family_assets WHERE item_id='compound-castle'");
 assert.equal(f.call('family/dashboard').body.family.preferences.bannerImage,'');
});
test('every supported prestige has a distinct available emblem',()=>{
 const files=new Set();for(let n=1;n<=200;n++){const p=progression(prestigeThreshold(n));assert.equal(p.distinctions,n);assert.ok(existsSync('public'+p.distinctionImage));files.add(readFileSync('public'+p.distinctionImage,'utf8'));}assert.equal(files.size,200);
});
test('claiming hourly income cannot duplicate income and custody blocks collection',t=>{
 const f=fixture(t);f.run('UPDATE users SET pending_income=100000 WHERE id=1');
 const a=f.call('income/claim',{});assert.equal(a.status,200);assert.equal(a.body.payout,100000);
 assert.equal(f.call('income/claim',{}).body.payout,0);
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);assert.equal(f.call('income/claim',{}).status,409);
});
test('hourly drug markets vary per city and drug; stale quotes cannot charge funds',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=1");
 const first=f.call('production').body,p=first.products[0];
 assert.ok(new Set(p.cityFactors.map(c=>JSON.stringify(c.market))).size>1);
 assert.ok(first.products.some(x=>x.market.productionPercent!==p.market.productionPercent||x.market.transportPercent!==p.market.transportPercent));
 const prices=new Set([p.terms[0].cost]),sales=new Set([p.market.percent]),freight=new Set([p.market.transportPercent]);
 for(let i=0;i<12;i++){f.advance(3600000);const n=f.call('production').body.products[0];prices.add(n.terms[0].cost);sales.add(n.market.percent);freight.add(n.market.transportPercent);}
 assert.ok(prices.size>1&&sales.size>1&&freight.size>1);
 const before=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,quoteEpoch:first.quoteEpoch,requestKey:'stale-market-000001'}).status,409);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before);
 const start=f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,requestKey:'net-margin-0000001'});f.advance(6*3600000);
 const b=f.call('production').body.batches[0];assert.equal(b.netProfit,b.saleValue-b.cost-b.freight_cost);
 for(const c of b.destinations)for(const r of c.routes){assert.equal(r.netProfit,r.saleValue-b.cost-b.freight_cost-r.cost);assert.ok(r.risk>0&&r.risk<1);}
 assert.equal(start.status,200);
});
