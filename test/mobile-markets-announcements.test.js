import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './helpers/game-fixture.js';
import {releaseNotes} from '../release-notes.js';
import {rankedFreight} from '../public/freight-ui.js';
import {coins} from '../city-expansion.js';
const warehouse=f=>{f.run("UPDATE users SET city='New York',drugs_xp=1000000000 WHERE id=1");f.run("INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(1,'garage','production-warehouse',5,0,0)");};
test('production retains usable unlocked quotes without drug-type sale badges',t=>{
 const f=fixture(t);warehouse(f);const d=f.call('production').body;
 assert.equal(d.products.some(p=>p.bestChoice||p.highestProfit),false);
 const best=d.products[0];assert.equal(best.canStart,true);assert.equal(best.terms[0].hours,best.recommendation.hours);
 for(const p of d.products.filter(p=>p.canStart))assert.ok(p.recommendation.affordable);
 const before=f.q('SELECT cash FROM users WHERE id=1').cash;
 const started=f.call('production/start',{scope:'personal',product:best.id,hours:best.recommendation.hours,units:1,quoteEpoch:d.quoteEpoch,requestKey:'best-choice-start-0001'});
 assert.equal(started.status,200);assert.equal(before-f.q('SELECT cash FROM users WHERE id=1').cash,best.recommendation.cost);
});
test('unavailable production never receives a best choice badge',t=>{
 const f=fixture(t);warehouse(f);f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('production').body.products.some(p=>p.bestChoice),false);
 f.run('UPDATE users SET cash=1000000000,captured_until=? WHERE id=1',f.time()+3600000);assert.equal(f.call('production').body.products.some(p=>p.bestChoice),false);
 f.run("INSERT INTO family_assets(family_id,item_id,quantity) VALUES(1,'warehouse-production-family',1)");assert.equal(f.call('production?scope=family').body.products.some(p=>p.bestChoice),false);
 f.run('UPDATE users SET captured_until=0 WHERE id=1');f.run('DELETE FROM possessions WHERE user_id=1');assert.equal(f.call('production').body.products.some(p=>p.bestChoice),false);
});
test('freight ranking considers affordable expected returns and identifies superior local sales',()=>{
 const batch={netProfit:50,destinations:[{city:'A',routes:[{mode:'plane',cost:1000,expectedProfit:900}]},{city:'B',routes:[{mode:'boat',cost:20,expectedProfit:40}]}]};
 let ranked=rankedFreight(batch,100);assert.equal(ranked.best.city,'B');assert.equal(ranked.destinations[0].city,'B');assert.equal(ranked.localBest,true);
 ranked=rankedFreight(batch,2000);assert.equal(ranked.best.city,'A');assert.equal(ranked.localBest,false);
});
test('catch-up announcement publishes once, is visible and triggers unread news',t=>{
 const f=fixture(t),note=releaseNotes[0];assert.equal(note.announce,true);f.tick();
 const first=f.q('SELECT bulletin_id FROM release_announcements WHERE release_id=?',note.id);assert.ok(first);
 const entries=f.call('bulletins').body.entries;assert.equal(entries.find(b=>b.releaseId).releaseId,note.id);const entry=entries.find(b=>b.id===first.bulletin_id);assert.equal(entry.releaseId,note.id);assert.ok(entry.body.includes(note.items[0]));
 const news=f.call('news').body;assert.equal(news.unread,true);f.call('news/read',{tokens:news.tokens});assert.equal(f.call('news').body.unread,false);
 f.tick();f.reset();f.tick();assert.equal(f.q('SELECT COUNT(*) n FROM release_announcements WHERE release_id=?',note.id).n,1);
});
test('every crypto coin has distinct premium artwork and a smaller delivery copy',()=>{
 const designs=coins.map(c=>{const file='public'+c.image,b=fs.readFileSync(file),delivery=fs.readFileSync('public/images/optimized/'+file.split('/').at(-1)+'.webp');assert.equal(b.subarray(1,4).toString(),'PNG');assert.ok(delivery.length<b.length);return b.toString('base64');});assert.equal(new Set(designs).size,15);
});
