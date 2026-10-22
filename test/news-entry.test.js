import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewsEntry} from '../public/news-entry.js';
import {fixture} from './helpers/game-fixture.js';

test('fresh app entry checks news once and then preserves normal navigation',async()=>{
 let calls=0;const entry=createNewsEntry(async()=>{calls++;return {unread:true}});
 assert.equal(await entry.target(1,'profile'),'bulletins');assert.equal(await entry.target(1,'production'),'production');assert.equal(calls,1);
});
test('persistent per-account receipts reopen announcements only after new content',async t=>{
 const f=fixture(t),entry=createNewsEntry(()=>f.call('news').body);f.tick();
 assert.equal(await entry.target(1),'bulletins');let news=f.call('news').body;f.call('news/read',{tokens:news.tokens});entry.reset();assert.equal(await entry.target(1),'dashboard');
 f.call('admin/bulletins',{kind:'announcement',title:'A new beta update',body:'New features are now available.',status:'published',startsAt:f.time()-1,endsAt:f.time()+86400000,popup:false});
 entry.reset();assert.equal(await entry.target(1),'bulletins');assert.equal(f.call('news',undefined,2).body.unread,true);news=f.call('news').body;f.call('news/read',{tokens:news.tokens});entry.reset();assert.equal(await entry.target(1),'dashboard');
});
test('failed news checks can retry without incorrectly marking the account checked',async()=>{
 let calls=0;const entry=createNewsEntry(async()=>{if(!calls++)throw Error('Offline');return {unread:true}});
 await assert.rejects(entry.target(1),/Offline/);assert.equal(await entry.target(1),'bulletins');assert.equal(calls,2);
});
test('concurrent entry checks share a request and reset ignores old login results',async()=>{
 let done,calls=0;const entry=createNewsEntry(()=>{calls++;return new Promise(resolve=>{done=resolve})});
 const a=entry.target(1),b=entry.target(1);await Promise.resolve();done({unread:true});assert.deepEqual(await Promise.all([a,b]),['bulletins','bulletins']);assert.equal(calls,1);
 entry.reset();const stale=entry.target(1,'profile');await Promise.resolve();entry.reset();done({unread:true});assert.equal(await stale,'profile');
});
