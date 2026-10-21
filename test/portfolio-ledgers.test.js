import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';

test('production sequences are per owner and drug; actual sold profit is recorded once',t=>{
 const f=fixture(t);
 for(const id of [1,2])f.run("INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(?,'garage','production-warehouse',0,0)",id);
 const start=(id,key)=>f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,requestKey:key},id);
 assert.equal(start(1,'ledger-batch-one-001').status,200);
 assert.equal(start(2,'ledger-batch-two-001').status,200);
 assert.equal(start(1,'ledger-batch-one-002').status,200);
 assert.deepEqual(f.call('production?scope=personal').body.batches.map(b=>b.batchNumber),[1,2]);
 assert.deepEqual(f.call('production?scope=personal',undefined,2).body.batches.map(b=>b.batchNumber),[1]);
 f.advance(6*3600000);const b=f.call('production?scope=personal').body.batches[0];
 const sale=f.call('production/sell',{scope:'personal',id:b.id,requestKey:'ledger-sold-batch-001'});assert.equal(sale.status,200);
 const row=f.call('production?scope=personal').body.freightHistory.find(x=>x.id===b.id);
 assert.equal(row.saleValue,sale.body.payout);assert.equal(row.netProfit,sale.body.payout-b.cost-b.freight_cost);
 assert.equal(f.call('production?scope=personal').body.productionSummary[0].batches,2);
 assert.equal(f.call('production?scope=personal',undefined,2).body.freightHistory.length,1);
 f.reset();assert.deepEqual(f.call('production?scope=personal').body.freightHistory.map(b=>b.batchNumber),[2,1]);
});

test('investment returns are recorded at collection and cannot be counted twice',t=>{
 const f=fixture(t),q=f.call('investments').body.accounts[0].quotes[0];
 assert.equal(f.call('investments/open',{scope:'personal',amount:1000000,hours:q.hours,rateBps:q.rateBps}).status,200);
 f.advance(q.hours*3600000);const p=f.call('investments').body.accounts[0].positions[0];
 const result=f.call('investments/claim',{scope:'personal',id:p.id});assert.equal(result.status,200);
 const summary=f.call('investments').body.accounts[0].performance;
 assert.equal(summary.profit,result.body.interest);assert.equal(summary.principal,1000000);assert.equal(summary.count,1);
 assert.equal(f.call('investments/claim',{scope:'personal',id:p.id}).status,409);
 assert.equal(f.call('investments').body.accounts[0].performance.profit,result.body.interest);
});

test('cargo route receipts and fees survive retry and are subtracted from sold profit',t=>{
 const f=fixture(t);f.high(true);
 f.run("INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(1,'garage','production-warehouse',0,0)");
 f.call('production/start',{scope:'personal',product:'cannabis',hours:6,units:1,requestKey:'route-ledger-start-0001'});f.advance(6*3600000);
 const b=f.call('production?scope=personal').body.batches[0],destination=b.destinations.find(d=>d.routes.length),r=destination.routes[0];
 const request={scope:'personal',id:b.id,city:destination.city,mode:r.mode,requestKey:'route-ledger-ship-0001'};
 assert.equal(f.call('production/ship',request).status,200);assert.equal(f.call('production/ship',request).status,200);
 // Force the delivered branch; interception is independently tested in freight coverage.
 f.run('UPDATE production_batches SET intercepted=0 WHERE id=?',b.id);
 f.advance(r.hours*3600000);f.call('production?scope=personal');
 const sale=f.call('production/sell',{scope:'personal',id:b.id,requestKey:'route-ledger-sale-0001'});assert.equal(sale.status,200);
 const history=f.call('production?scope=personal').body.freightHistory[0];
 assert.equal(history.routes.length,1);assert.equal(history.routes[0].destination,destination.city);assert.equal(history.freight_cost,r.cost);
 assert.equal(history.netProfit,sale.body.payout-b.cost-r.cost);
});

test('verified historical crypto receipts can be backfilled once without changing wallets',t=>{
 const f=fixture(t);f.run("DELETE FROM portfolio_migrations WHERE id='crypto-receipts-v1'");
 f.run("INSERT INTO crypto_wallet VALUES(1,'omerta',5,1500)");
 f.run("INSERT INTO events(user_id,message,created_at) VALUES(1,'Crypto buy 10 OMR for $3000',1),(1,'Crypto sell 5 OMR for $2000',2)");
 f.reset();assert.equal(f.call('crypto').body.performance.profit,500);assert.equal(f.call('crypto').body.performance.trades,1);
 f.reset();assert.equal(f.call('crypto').body.performance.trades,1);assert.equal(f.q("SELECT basis FROM crypto_wallet WHERE user_id=1 AND coin='omerta'").basis,1500);
});

test('crypto realized profit uses allocated purchase basis, fees and actual proceeds',t=>{
 const f=fixture(t);let c=f.call('crypto').body.coins[0];
 const bought=f.call('crypto/trade',{coin:c.id,side:'buy',quantity:10,epoch:c.epoch,key:'crypto-ledger-buy-0001'});assert.equal(bought.status,200);
 c=f.call('crypto').body.coins[0];const sold=f.call('crypto/trade',{coin:c.id,side:'sell',quantity:5,epoch:c.epoch,key:'crypto-ledger-sell-0001'});assert.equal(sold.status,200);
 const summary=f.call('crypto').body.performance;assert.equal(summary.profit,sold.body.payout-Math.floor(bought.body.cost/2));assert.equal(summary.trades,1);
 f.call('crypto/trade',{coin:c.id,side:'sell',quantity:5,epoch:c.epoch,key:'crypto-ledger-sell-0001'});
 assert.equal(f.call('crypto').body.performance.trades,1);
 assert.equal(f.call('crypto',undefined,2).body.performance.trades,0);
});

test('staff remain in directories but not competitive players or world player counts',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin',xp=9000000 WHERE id=3");f.run('UPDATE users SET xp=8000000 WHERE id=1');
 const d=f.call('underworld').body;assert.ok(d.topRank.every(p=>![1,3].includes(p.id)));assert.ok(d.topPower.every(p=>![1,3].includes(p.id)));
 assert.ok(f.call('directory').body.players.some(p=>p.id===1));
 const staff=f.call('admin/population').body;assert.equal(staff.total,2);assert.equal(staff.players.length,4);assert.equal(staff.staff.combined.count,2);
 assert.deepEqual(staff.staff.owner.accounts.map(p=>p.id),[1]);
 assert.deepEqual(staff.staff.admin.accounts.map(p=>p.id),[3]);
 for(const account of staff.staff.combined.accounts)assert.equal(account.username,f.q('SELECT username FROM users WHERE id=?',account.id).username);
});
