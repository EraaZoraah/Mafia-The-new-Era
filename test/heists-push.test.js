import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {artHeists,artLootPools} from '../art-market.js';
import {installPush,validPushSubscription,generatePushKeys} from '../push-notifications.js';
import {installBots} from '../bot-players.js';
import {menu} from '../public/navigation.js';
const sub=(id='one')=>({endpoint:'https://fcm.googleapis.com/fcm/send/'+id,keys:{p256dh:generatePushKeys().publicKey,auth:'a'.repeat(22)}});
test('four exclusive ascending loot pools hold 7/6/6/6 objects with strictly decreasing odds',()=>{
 assert.deepEqual(artLootPools.map(x=>x.length),[7,6,6,6]);assert.equal(new Set(artLootPools.flat().map(x=>x.id)).size,25);
 for(let i=0;i<4;i++){const pool=artLootPools[i];for(let j=1;j<pool.length;j++){assert.ok(pool[j].value>=pool[j-1].value);assert.ok(pool[j].weight<pool[j-1].weight)}if(i)assert.ok(pool[0].value>artLootPools[i-1].at(-1).value);}
 assert.ok(menu.find(x=>x.id==='operations').items.some(x=>x[0]==='art-market'));assert.ok(!menu.find(x=>x.id==='finances').items.some(x=>x[0]==='art-market'));
});
test('top art achievement requires two personally stolen certified originals and survives sale',t=>{
 const f=fixture(t);f.run('UPDATE users SET xp=2000000,energy=1000 WHERE id=1');f.dice(2000);f.high(true);
 const first=f.call('art/heist',{kind:'treasury'});assert.equal(first.status,200);assert.equal(first.body.object.spec_id,'diamond-phoenix');assert.equal(first.body.image,'/images/art-diamond-phoenix.png');assert.equal(first.body.object.marketEstimate,12000000000);assert.equal(first.body.object.estimated_value,undefined);
 const progress=id=>f.call('achievements',undefined,id).body.milestones.find(x=>x.id==='art-crown-jewels');
 assert.equal(progress(1).progress,0);assert.equal(f.call('art/appraise',{id:first.body.object.id}).status,200);assert.equal(progress(1).progress,1);
 f.advance(21600001);f.run('UPDATE users SET energy=1000 WHERE id=1');f.high((min,max)=>max===100?100:max-1);
 const second=f.call('art/heist',{kind:'treasury'});assert.equal(second.status,200);assert.equal(second.body.object.spec_id,'platinum-crown');assert.equal(f.call('art/appraise',{id:second.body.object.id}).status,200);assert.equal(progress(1).progress,2);assert.ok(progress(1).earnedAt);
 f.run('UPDATE art_objects SET user_id=2');assert.equal(progress(2).progress,0);assert.ok(progress(1).earnedAt);f.reset();assert.equal(progress(2).progress,0);assert.equal(progress(1).progress,2);
});
test('bots select the fourth heist through ordinary eligibility and Luca knows its capstone in EN/NL',t=>{
 const f=fixture(t);f.run('UPDATE users SET xp=2000000,energy=1000 WHERE id=3');f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(3,'builder',0)");f.dice(2000);
 const requests=[],bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>b-1,call:(id,path,body)=>{const r=f.call(path,body,id);requests.push({path,body,status:r.status});return r}});bots.step(3,{domain:'art'});assert.ok(requests.some(x=>x.path==='art/heist'&&x.body.kind==='treasury'&&x.status===200));
 for(const lang of ['en','nl']){const r=f.call('guide?q=sovereign%20curator&lang='+lang);assert.equal(r.status,200);assert.match(r.body.answer,/0\/2/);assert.ok(r.body.links.some(x=>x.tab==='art-market'));}
});
test('push opt-in binds devices to their owner, rejects arbitrary endpoints and filters alert kinds',async t=>{
 const f=fixture(t),sent=[],push=installPush(f.db,{clock:f.time,send:async(s,p)=>sent.push({s,p:JSON.parse(p)})});
 assert.equal(validPushSubscription({...sub(),endpoint:'https://127.0.0.1/a'}),false);assert.equal(validPushSubscription({...sub(),endpoint:'https://fcm.googleapis.com.evil.test/a'}),false);
 const save=(id,s,preferences)=>push.route('POST','/api/push/save',{subscription:s,preferences,locale:'nl'},{id});
 save(1,sub(),{personal:true,family:false,income:false});assert.throws(()=>save(2,sub(),{personal:true,family:true,income:true}),/previous account/);
 push.notice(1,'Private message received','','/images/scene-messages.jpg');push.notice(1,'You were attacked','','/images/scene-operations.jpg');push.notice(1,'Your family was raided','','/images/scene-families.jpg');await push.tick();assert.equal(sent.length,1);assert.equal(sent[0].p.tag,'mafia-personal');assert.match(sent[0].p.body,/aanval/);await push.tick();assert.equal(sent.length,1);
 assert.throws(()=>push.route('POST','/api/push/remove',{subscription:sub()},{id:2}),/previous account/);assert.equal(f.q('SELECT COUNT(*) n FROM push_devices').n,1);
 push.route('POST','/api/push/remove',{subscription:sub()},{id:1});assert.equal(f.q('SELECT COUNT(*) n FROM push_devices').n,0);
});
test('income push waits for 23 active hours, pauses in custody and warns once per claim cycle',async t=>{
 const f=fixture(t),sent=[],push=installPush(f.db,{clock:f.time,blockedMillis:()=>3600000,send:async(s,p)=>sent.push(JSON.parse(p))});
 f.run('UPDATE users SET income_claim_at=? WHERE id=1',f.time()-23*3600000);
 push.route('POST','/api/push/save',{subscription:sub(),preferences:{personal:false,family:true,income:true}},{id:1});await push.tick();assert.equal(sent.length,0);
 f.advance(3600000);f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);await push.tick();assert.equal(sent.length,0);f.run('UPDATE users SET prison_until=0 WHERE id=1');await push.tick();await push.tick();assert.equal(sent.length,1);assert.equal(sent[0].tag,'mafia-income');
 push.notice(1,'Your family was raided','','/images/scene-families.jpg');await push.tick();assert.equal(sent.at(-1).tag,'mafia-family');
});
test('expired push endpoints are removed and missing VAPID setup cannot accept new subscriptions',async t=>{
 const f=fixture(t),off=installPush(f.db,{env:{}});assert.equal(off.ready,false);assert.throws(()=>off.route('POST','/api/push/save',{subscription:sub(),preferences:{}},{id:1}),/not configured/);
 const p=installPush(f.db,{send:async()=>{throw Object.assign(new Error('expired'),{statusCode:410})}});p.route('POST','/api/push/save',{subscription:sub(),preferences:{personal:true,family:false,income:false}},{id:1});p.notice(1,'You were attacked','','');await p.tick();assert.equal(f.q('SELECT COUNT(*) n FROM push_devices').n,0);
 const keys=generatePushKeys();assert.equal(Buffer.from(keys.publicKey,'base64url').length,65);assert.equal(Buffer.from(keys.privateKey,'base64url').length,32);
});

 test('Web Push encrypts a real device payload using the generated VAPID pair without a network call',async()=>{
 const {default:webpush}=await import('web-push'),keys=generatePushKeys();const request=webpush.generateRequestDetails(sub('encrypted'),JSON.stringify({title:'Mafia: The New Era'}),{vapidDetails:{subject:'https://example.com',publicKey:keys.publicKey,privateKey:keys.privateKey},TTL:3600});assert.equal(request.method,'POST');assert.equal(request.headers['Content-Encoding'],'aes128gcm');assert.ok(request.body.length>50);assert.ok(request.headers.Authorization.startsWith('vapid '));
 });
