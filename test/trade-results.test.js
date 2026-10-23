import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {summarizeTrade,resetTradePeriod} from '../trade-summary.js';
import {catalog} from '../catalog.js';
const productionWarehouse=f=>f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(1,'garage','production-warehouse',5,0,0)");
const vehicleWarehouse=(f,id)=>f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(?,'garage','vehicle-warehouse',1,0,0)",id);
test('trade totals preserve exact large integers and signed results per item',()=>{
 const n='9007199254740991000',s=summarizeTrade([{id:'a',name:'A',invested:n},{id:'b',name:'B',received:n},{id:'a',name:'A',invested:7}]);
 assert.equal(s.invested,'9007199254740991007');assert.equal(s.received,n);assert.equal(s.net,'-7');assert.equal(s.items[0].net,'-9007199254740991007');
});
test('crypto totals and each coin distinguish returned money, losses and unsold basis',t=>{
 const f=fixture(t),d=f.call('crypto').body,[a,b]=d.coins;
 const buy=f.call('crypto/trade',{coin:a.id,side:'buy',quantity:10,epoch:a.epoch,key:'trade-summary-buy-001'});assert.equal(buy.status,200);
 f.call('crypto/trade',{coin:b.id,side:'buy',quantity:2,epoch:b.epoch,key:'trade-summary-buy-002'});
 f.run('UPDATE crypto_prices SET price=? WHERE coin=?',Math.floor(a.price/2),a.id);
 const sell=f.call('crypto/trade',{coin:a.id,side:'sell',quantity:5,epoch:a.epoch,key:'trade-summary-sell-001'});assert.equal(sell.status,200);
 const after=f.call('crypto').body,r=after.trade.items.find(x=>x.id===a.id);
 assert.equal(r.invested,String(buy.body.cost));assert.equal(r.received,String(sell.body.payout));assert.equal(r.profit,String(sell.body.payout-Math.floor(buy.body.cost/2)));assert.ok(BigInt(r.profit)<0n);
 assert.equal(after.trade.net,String(sell.body.payout-buy.body.cost-b.buy*2));assert.equal(after.trade.inventoryCost,String(Math.ceil(buy.body.cost/2)+b.buy*2));
 const before=after.trade;f.call('crypto/trade',{coin:a.id,side:'sell',quantity:5,epoch:a.epoch,key:'trade-summary-sell-001'});assert.deepEqual(f.call('crypto').body.trade,before);
 assert.equal(f.call('crypto',undefined,2).body.trade.invested,'0');
});
test('production totals include seized batch cost and freight, without revealing interception early',t=>{
 const f=fixture(t);productionWarehouse(f);f.run("UPDATE users SET city='New York' WHERE id=1");
 const start=f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,requestKey:'trade-drug-start-0001'});assert.equal(start.status,200);f.advance(6*3600000);
 let d=f.call('production').body;const batch=d.batches[0],dest=batch.destinations.find(x=>x.routes.length),route=dest.routes[0];
 assert.equal(f.call('production/ship',{scope:'personal',id:batch.id,city:dest.city,mode:route.mode,requestKey:'trade-drug-ship-0001'}).status,200);
 f.run('UPDATE production_batches SET intercepted=1 WHERE id=?',batch.id);d=f.call('production').body;assert.equal(d.trade.losses,'0');assert.equal(d.trade.received,'0');
 f.advance(route.hours*3600000);d=f.call('production').body;const cost=batch.cost+route.cost,r=d.trade.items.find(x=>x.id==='cannabis');
 assert.equal(r.invested,String(cost));assert.equal(r.received,'0');assert.equal(r.profit,String(-cost));assert.equal(d.trade.losses,String(cost));assert.equal(d.trade.inventoryCost,'0');
 assert.equal(f.call('production?scope=family').body.trade.invested,'0');
});
test('purchased car results use actual debits and resale proceeds once',t=>{
 const f=fixture(t),garage=catalog.find(x=>x.category==='garage'&&!x.storageKind),car=catalog.find(x=>x.category==='car');
 f.call('assets/buy',{category:'garage',id:garage.id});const bought=f.call('assets/buy',{category:'car',id:car.id});assert.equal(bought.status,201);
 const sold=f.call('vehicles/car/sell',{itemId:car.id});assert.equal(sold.status,200);
 let result=f.call('vehicles').body.purchasedTrade;assert.equal(result.invested,String(bought.body.cost));assert.equal(result.received,String(sold.body.payout));assert.equal(result.net,String(sold.body.payout-bought.body.cost));
 f.call('vehicles/car/sell',{itemId:car.id});assert.deepEqual(f.call('vehicles').body.purchasedTrade,result);f.reset();assert.deepEqual(f.call('vehicles').body.purchasedTrade,result);
});
test('vehicle auction bids are not purchases until won; refunds and retries cannot inflate results',t=>{
 const f=fixture(t);for(const id of [1,2,3])vehicleWarehouse(f,id);
 const id=Number(f.run("INSERT INTO vehicle_loot(user_id,vehicle_id,city,state,created_at) VALUES(1,'dacia-sandero','New York','stored',?)",f.time()).lastInsertRowid);
 const listed=f.call('vehicles/auction/list',{id,reserve:100000,hours:6});assert.equal(listed.status,200);
 assert.equal(f.call('vehicles/auction/bid',{id:listed.body.id,amount:100000},2).status,200);
 assert.equal(f.call('vehicles/auction/bid',{id:listed.body.id,amount:110000},3).status,200);
 assert.equal(f.call('vehicles',undefined,2).body.trade.invested,'0');assert.equal(f.call('vehicles',undefined,3).body.trade.invested,'0');
 f.advance(6*3600000);f.tick();const seller=f.call('vehicles').body.trade;
 assert.equal(seller.invested,String(listed.body.cost));assert.equal(seller.received,'106700');assert.equal(f.call('vehicles',undefined,3).body.trade.invested,'110000');
 f.tick();assert.deepEqual(f.call('vehicles').body.trade,seller);
 f.run('DELETE FROM vehicle_auctions WHERE id=?',listed.body.id);assert.deepEqual(f.call('vehicles').body.trade,seller);
});
test('art results include failed heists, appraisals, winning bids and net commission proceeds',t=>{
 const f=fixture(t);f.dice(9999);const failed=f.call('art/heist',{kind:'gallery'});assert.equal(failed.body.success,false);assert.equal(f.call('art').body.trade.net,'-25000');
 f.advance(3600001);f.dice(2000);const recovered=f.call('art/heist',{kind:'gallery'}).body.object;
 const appraisal=f.call('art/appraise',{id:recovered.id});assert.equal(appraisal.status,200);
 f.call('art/list',{id:recovered.id,hours:6,reserve:10000000});const auction=f.call('art').body.auctions[0];assert.equal(f.call('art/bid',{id:auction.id,amount:10000000},2).status,200);
 assert.equal(f.call('art',undefined,2).body.trade.invested,'0');f.advance(6*3600000);f.tick();
 const s=f.call('art').body.trade;assert.equal(s.invested,String(50000+appraisal.body.cost));assert.equal(s.received,'9200000');assert.equal(s.net,String(9150000-appraisal.body.cost));assert.equal(f.call('art',undefined,2).body.trade.invested,'10000000');
 resetTradePeriod(f.db,1);f.run('DELETE FROM art_trade_receipts WHERE user_id=1');assert.equal(f.call('art').body.trade.net,'0');f.advance(3600001);f.dice(9999);f.call('art/heist',{kind:'gallery'});assert.equal(f.call('art').body.trade.net,'-25000');
});
test('sale badges belong to each completed batch and use actual costs and affordable routes',t=>{
 const f=fixture(t);productionWarehouse(f);f.run("UPDATE users SET city='New York',drugs_xp=1000000000 WHERE id=1");
 for(const product of ['cannabis','hashish'])assert.equal(f.call('production/start',{scope:'personal',product,hours:24,units:20,requestKey:'route-labels-'+product}).status,200);
 f.advance(24*3600000);const d=f.call('production').body;assert.ok(!d.products.some(p=>p.bestChoice||p.highestProfit));
 for(const b of d.batches){const {best,highest,routes}=b.saleChoices;assert.ok(best&&highest);for(const r of routes.filter(r=>r.affordable)){assert.ok(best.expectedProfit>=r.expectedProfit);assert.ok(highest.netProfit>=r.netProfit);}}
});

test('verified old production sale receipts restore totals without guessing or changing money',t=>{
 const f=fixture(t);productionWarehouse(f);const start=f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,requestKey:'historical-summary-start'});f.advance(6*3600000);
 const sale=f.call('production/sell',{scope:'personal',id:start.body.id,requestKey:'historical-summary-sale'});assert.equal(sale.status,200);
 f.run('UPDATE production_batches SET sale_value=NULL WHERE id=?',start.body.id);f.run("DELETE FROM production_trade_meta WHERE key='verified-sales-v1'");const cash=f.q('SELECT cash FROM users WHERE id=1').cash;f.reset();
 assert.equal(f.call('production').body.trade.received,String(sale.body.payout));assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
});
test('Luca reads personal totals from authoritative reports in every language',t=>{
 const f=fixture(t),c=f.call('crypto').body.coins[0];f.call('crypto/trade',{coin:c.id,side:'buy',quantity:10,epoch:c.epoch,key:'guide-summary-buy-001'});const cash=f.q('SELECT cash FROM users WHERE id=1').cash;
 for(const language of ['en','nl','es','fr','de']){const r=f.call('guide?q=total%20crypto%20profit&lang='+language);assert.equal(r.status,200);assert.equal(r.body.trading.crypto.invested,String(c.buy*10));assert.ok(r.body.links.some(l=>l.tab==='crypto'));if(language!=='en')assert.ok(!r.body.answer.includes('Your recorded personal trading results.'));}
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
});
test('production recommendations and Luca exclude a drug already at its crate cap',t=>{
 const f=fixture(t);productionWarehouse(f);f.run("UPDATE users SET city='New York',drugs_xp=1000000000 WHERE id=1");assert.equal(f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1000,requestKey:'at-cap-production-start'}).status,200);
 const d=f.call('production').body;assert.equal(d.products.find(p=>p.id==='cannabis').canStart,false);assert.ok(!d.products.find(p=>p.id==='cannabis').bestChoice&&!d.products.find(p=>p.id==='cannabis').highestProfit);
 const guide=f.call('guide?q=best%20drug%20production').body;assert.notEqual(guide.market.bestAvailable?.product,'cannabis');
});
