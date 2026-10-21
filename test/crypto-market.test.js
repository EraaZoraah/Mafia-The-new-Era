import test from 'node:test';
import assert from 'node:assert/strict';
import {nextCryptoPrice} from '../city-expansion.js';
import {fixture} from './helpers/game-fixture.js';
test('crypto supports ordinary moves, crashes and rare rallies with positive bounded quotes',()=>{
 const roll=(event,move)=>{let i=0;return ()=>i++?move:event};
 assert.equal(nextCryptoPrice(10000,10000,roll(500,-600)),9400);
 assert.equal(nextCryptoPrice(10000,10000,roll(10,-6500)),3500);
 assert.equal(nextCryptoPrice(10000,10000,roll(0,20000)),30000);
 assert.equal(nextCryptoPrice(200000,10000,roll(0,20000)),200000);
 assert.equal(nextCryptoPrice(1,100,roll(10,-6500)),1);
});
test('five minute quotes stay fixed until expiry, invalidate old trades and do not reroll on reload',t=>{
 const f=fixture(t),d=f.call('crypto').body,c=d.coins[0];
 assert.ok(d.nextUpdate-f.time()<=300000);
 assert.deepEqual(f.call('crypto').body.coins,d.coins);
 f.advance(d.nextUpdate-f.time());
 const next=f.call('crypto').body;
 assert.equal(next.coins[0].epoch,c.epoch+1);
 assert.equal(f.call('crypto/trade',{coin:c.id,side:'buy',quantity:1,epoch:c.epoch,key:'expired-crypto-quote-001'}).status,409);
 assert.deepEqual(f.call('crypto').body.coins,next.coins);
 const wallet=f.q('SELECT cash FROM users WHERE id=1').cash;f.reset();
 assert.deepEqual(f.call('crypto').body.coins,next.coins);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,wallet);
});
test('migration retains existing ten-minute price history without duplicate epoch collisions',t=>{
 const f=fixture(t);f.call('crypto');
 f.run("DELETE FROM crypto_market_migrations WHERE id='five-minute-v1'");
 f.run('DELETE FROM crypto_history');
 f.run('UPDATE crypto_prices SET epoch=?',Math.floor(f.time()/600000));
 f.run('INSERT INTO crypto_history VALUES(?,?,?)','omerta',10,123);
 f.run('INSERT INTO crypto_history VALUES(?,?,?)','omerta',20,456);
 const before=f.q('SELECT price FROM crypto_prices LIMIT 1').price;
 f.reset();
 assert.equal(f.q('SELECT price FROM crypto_prices LIMIT 1').price,before);
 assert.equal(f.q("SELECT price FROM crypto_history WHERE coin='omerta' AND epoch=20").price,123);
 assert.equal(f.q("SELECT price FROM crypto_history WHERE coin='omerta' AND epoch=40").price,456);
 f.reset();assert.equal(f.q("SELECT price FROM crypto_history WHERE coin='omerta' AND epoch=40").price,456);
});
