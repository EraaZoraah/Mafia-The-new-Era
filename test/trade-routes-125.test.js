import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {batchSaleChoices} from '../public/drug-route-choice.js';
import {CRYPTO_BASIS_LIMIT,cryptoBuyMaximum} from '../public/crypto-math.js';
import {openPosition} from '../public/crypto-chart-ui.js';
import {transportModes,freightQuote,cityDrugMarkets} from '../drug-markets.js';
const ready=f=>{f.run("UPDATE users SET city='New York',drugs_xp=1000000000 WHERE id=1");f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(1,'garage','production-warehouse',5,0,0)");};

test('every coin can use its 10T basis cap, with exact cash costs and replay protection',t=>{
 const f=fixture(t);f.run('UPDATE users SET cash=1000000000000000 WHERE id=1');const d=f.call('crypto').body;assert.equal(d.limit,10000000000000);
 for(const c of d.coins){const maximum=cryptoBuyMaximum(c,{},f.q('SELECT cash FROM users WHERE id=1').cash,d.limit);assert.ok(maximum>100000000||c.buy>100000);const body={coin:c.id,side:'buy',quantity:maximum,epoch:c.epoch,key:'crypto-10T-'+c.id+'-purchase'},before=f.q('SELECT cash FROM users WHERE id=1').cash;
  assert.equal(f.call('crypto/trade',body).status,200);assert.equal(f.call('crypto/trade',body).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before-maximum*c.buy);
  const w=f.q('SELECT * FROM crypto_wallet WHERE user_id=1 AND coin=?',c.id);assert.ok(w.basis<=CRYPTO_BASIS_LIMIT);assert.ok(w.basis+c.buy>CRYPTO_BASIS_LIMIT);assert.equal(f.call('crypto/trade',{...body,key:body.key+'-overflow',quantity:1}).status,400);
 }
});
test('crypto capacities honor cash and remaining basis, and enormous valuations remain exact',t=>{
 assert.equal(cryptoBuyMaximum({buy:253},{basis:0},1000),3);assert.equal(cryptoBuyMaximum({buy:253},{basis:CRYPTO_BASIS_LIMIT-250},100000),0);
 const f=fixture(t);f.call('crypto');f.run('UPDATE users SET cash=1000000000000000 WHERE id=1');f.run("UPDATE crypto_prices SET price=1 WHERE coin='omerta'");const d=f.call('crypto').body,c=d.coins[0],quantity=cryptoBuyMaximum(c,{},1e15,d.limit);
 assert.equal(f.call('crypto/trade',{coin:c.id,side:'buy',quantity,epoch:c.epoch,key:'crypto-huge-cheap-buy'}).status,200);
 f.run("UPDATE crypto_prices SET price=5000000 WHERE coin='omerta'");const after=f.call('crypto').body,w=after.wallet[0],coin=after.coins[0];
 assert.equal(after.trade.inventoryValue,(BigInt(w.quantity)*BigInt(coin.sell)).toString());assert.equal(openPosition(w,coin).marketValue,(BigInt(w.quantity)*BigInt(coin.price)).toString());
 const before=f.q('SELECT cash FROM users WHERE id=1').cash;assert.equal(f.call('crypto/trade',{coin:c.id,side:'sell',quantity,epoch:c.epoch,key:'crypto-huge-sell-no-room'}).status,400);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before);assert.equal(f.q("SELECT quantity FROM crypto_wallet WHERE user_id=1 AND coin='omerta'").quantity,quantity);
});
test('route choices separate expected returns and delivered profit, including local and cash limits',()=>{
 const b={stock_city:'New York',saleValue:90,netProfit:30,netMargin:50,destinations:[{city:'Paris',routes:[{mode:'boat',cost:20,hours:8,risk:.06,netProfit:100,expectedProfit:90}]},{city:'Dubai',routes:[{mode:'plane',cost:50,hours:2,risk:.11,netProfit:110,expectedProfit:80}]}]};
 const c=batchSaleChoices(b,100);assert.equal(c.best.city,'Paris');assert.equal(c.highest.city,'Dubai');assert.equal(batchSaleChoices(b,0).best.mode,'local');assert.equal(batchSaleChoices(b,30).highest.city,'Paris');
});
test('all new drug routes are shorter and have at most 15 percent interception',()=>{
 const maxHours={boat:8,plane:2,truck:2};for(const from of Object.keys(cityDrugMarkets))for(const to of Object.keys(cityDrugMarkets))for(const m of transportModes)for(const units of [1,1000]){const r=freightQuote(from,to,m,1e8,units);if(r){assert.ok(r.risk<=.15);assert.ok(r.hours<=maxHours[m.id]);assert.ok(r.cost>0);}}
});
test('international sale recommendations use real batch quotes and shipping debits once',t=>{
 const f=fixture(t);ready(f);const start=f.call('production/start',{scope:'personal',product:'cannabis',hours:24,units:100,requestKey:'route-foreign-start-001'});assert.equal(start.status,200);f.advance(24*3600000);
 let foreign=0;for(let i=0;i<24;i++){const b=f.call('production').body.batches[0];if(b.saleChoices.best.mode!=='local')foreign++;f.advance(3600000);}assert.ok(foreign>0);
 const d=f.call('production').body,b=d.batches[0],r=b.saleChoices.best;assert.notEqual(r.city,b.stock_city);assert.ok(r.netProfit>b.netProfit);const body={scope:'personal',id:b.id,city:r.city,mode:r.mode,quoteEpoch:d.quoteEpoch,requestKey:'route-foreign-dispatch-001'},cash=f.q('SELECT cash FROM users WHERE id=1').cash;
 const ship=f.call('production/ship',body);assert.equal(ship.status,200);assert.equal(f.call('production/ship',body).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash-r.cost);assert.equal(f.q('SELECT arrives_at FROM production_batches WHERE id=?',b.id).arrives_at,f.time()+r.hours*3600000);
 assert.equal(f.call('production/sell',{scope:'personal',id:b.id,requestKey:'route-no-transit-sale-001'}).status,409);
});
test('Luca explains both destinations per owned drug and honors custody',t=>{
 const f=fixture(t);ready(f);f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:20,requestKey:'route-guide-start-001'});f.advance(6*3600000);
 for(const [lang,q] of Object.entries({en:'Where should I sell my cannabis?',nl:'Waar kan ik cannabis verkopen?',es:'Dónde vender cannabis?',fr:'Où vendre mon cannabis?',de:'Wo Cannabis verkaufen?'})){const r=f.call('guide?lang='+lang+'&q='+encodeURIComponent(q));assert.equal(r.status,200);assert.equal(r.body.links[0].tab,'production');assert.equal(r.body.drugSales.batches.length,1);assert.ok(r.body.answer.includes(r.body.drugSales.batches[0].saleChoices.highest.city));}
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);const r=f.call('guide?lang=nl&q=waar%20kan%20ik%20cannabis%20verkopen').body;assert.match(r.answer,/verhindert verzenden/);
});
test('family sale choices use treasury quotes and never grant a member purchase authority',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id IN (1,2)");f.run("INSERT INTO family_assets VALUES(1,'warehouse-production-family',1)");
 assert.equal(f.call('production/start',{scope:'family',product:'cannabis',hours:6,units:20,requestKey:'family-sale-routes-start'}).status,200);f.advance(6*3600000);
 const d=f.call('production?scope=family',undefined,2).body,b=d.batches[0],r=b.saleChoices.best;assert.equal(d.canManage,false);assert.ok(r.cost<=d.funds);
 const advice=f.call('guide?lang=nl&q=waar%20kan%20familie%20cannabis%20verkopen',undefined,2).body;assert.equal(advice.drugSales.scope,'family');assert.match(advice.answer,/huidige rol/);
 const treasury=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 const body={scope:'family',id:b.id,city:r.city,mode:r.mode,quoteEpoch:d.quoteEpoch,requestKey:'family-sale-routes-locked'};
 assert.equal(f.call(r.mode==='local'?'production/sell':'production/ship',body,2).status,403);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,treasury);
});
