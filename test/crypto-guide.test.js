import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {analyzeCrypto,isCryptoAnalysisQuestion,cryptoGuide} from '../guide-crypto.js';

function seed(f){
 const data=f.call('crypto').body,epoch=Math.floor(f.time()/300000);
 for(const c of data.coins)for(let i=0;i<=48;i++)f.run('INSERT OR REPLACE INTO crypto_history VALUES(?,?,?)',c.id,epoch-48+i,Math.round(c.price*(1.2-i*.2/48)));
 return f.call('crypto').body;
}
test('live crypto questions in all languages use real quotes, spread and personal capacity',t=>{
 const f=fixture(t),snapshot=seed(f),before=f.q('SELECT cash FROM users WHERE id=1').cash;
 const questions={en:'Which crypto coin should I buy now and why?',nl:'Welke cryptomunt moet ik nu kopen?',es:'Qué criptomoneda comprar ahora?',fr:'Quelle monnaie acheter maintenant?',de:'Welche Kryptowährung jetzt kaufen?'};
 for(const [lang,q] of Object.entries(questions)){
  assert.ok(isCryptoAnalysisQuestion(q));const r=f.call('guide?lang='+lang+'&q='+encodeURIComponent(q));assert.equal(r.status,200);assert.equal(r.body.links[0].tab,'crypto');if(lang!=='en')assert.ok(!r.body.answer.startsWith('Live crypto watchlist'));assert.ok(r.body.cryptoAnalysis.candidates.length);
  const first=r.body.cryptoAnalysis.candidates[0],quote=snapshot.coins.find(c=>c.id===first.id);assert.equal(first.buy,quote.buy);assert.ok(r.body.answer.includes('$'+quote.buy.toLocaleString('en-US')));assert.ok(first.breakEvenRise>2);assert.ok(first.maximum<=Math.floor(before/first.buy));
 }
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,before);
 assert.equal(f.q('SELECT COUNT(*) n FROM crypto_trade_history').n,0);
});
test('falling quotes are not presented as guaranteed bottoms; named coins can be inspected',t=>{
 const f=fixture(t);seed(f);
 const r=f.call('guide?lang=nl&q='+encodeURIComponent('Heeft Omerta nu een dieptepunt en gaat deze stijgen?')).body;
 assert.equal(r.cryptoAnalysis.candidates[0].id,'omerta');assert.ok(r.cryptoAnalysis.candidates[0].momentum<0);assert.match(r.answer,/geen bevestigd dieptepunt/);assert.match(r.answer,/niet gegarandeerd/);
});
test('insufficient cash, full basis, custody and health remove available purchases',t=>{
 const f=fixture(t),snapshot=seed(f),u=f.q('SELECT * FROM users WHERE id=1');
 assert.equal(analyzeCrypto(snapshot,{...u,cash:0},f.time()).filter(x=>x.eligible).length,0);
 assert.equal(analyzeCrypto(snapshot,{...u,prison_until:f.time()+1000},f.time()).filter(x=>x.eligible).length,0);
 assert.equal(analyzeCrypto(snapshot,{...u,hospital_until:f.time()+1000},f.time()).filter(x=>x.eligible).length,0);
 assert.equal(analyzeCrypto(snapshot,{...u,health:0},f.time()).filter(x=>x.eligible).length,0);
 snapshot.wallet=snapshot.coins.map(c=>({coin:c.id,basis:snapshot.limit,quantity:1}));assert.equal(analyzeCrypto(snapshot,u,f.time()).filter(x=>x.eligible).length,0);
});
test('partial, gapped or stale quotes cannot become eligible forecasts',t=>{
 const f=fixture(t),snapshot=seed(f),u=f.q('SELECT * FROM users WHERE id=1');
 assert.equal(analyzeCrypto({...snapshot,nextUpdate:f.time()},u,f.time()).filter(x=>x.eligible).length,0);
 const short={...snapshot,history:snapshot.history.filter(h=>h.epoch>=Math.floor(f.time()/300000)-5)};
 assert.equal(analyzeCrypto(short,u,f.time()).filter(x=>x.eligible).length,0);
 const gap={...snapshot,history:snapshot.history.filter(h=>h.epoch!==Math.floor(f.time()/300000)-2)};
 assert.equal(analyzeCrypto(gap,u,f.time()).filter(x=>x.eligible).length,0);
 const response=cryptoGuide('What crypto should I buy?',u,f.time(),{cryptoMarket:short});assert.match(response.answer,/No eligible purchase/);
});
test('live queries refresh quote expiry and never expose another players wallet',t=>{
 const f=fixture(t);seed(f);f.run("INSERT INTO crypto_wallet VALUES(1,'omerta',10,2500)");
 const a=f.call('guide?q=which%20crypto%20should%20I%20buy').body;
 f.advance(300000);const b=f.call('guide?q=which%20crypto%20should%20I%20buy',undefined,4).body;
 assert.ok(b.cryptoAnalysis.expiresAt>a.cryptoAnalysis.expiresAt);assert.ok(b.cryptoAnalysis.candidates.every(c=>c.held===0&&c.basis===0));
});
