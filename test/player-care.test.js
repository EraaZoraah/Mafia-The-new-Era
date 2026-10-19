import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
const ticket={category:'bug',subject:'Broken button',body:'The action button is stuck.',target:'',key:'care-test'};
test('support is private, idempotent, staff-only management and shared unread inbox',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=3");
 const r=f.call('support/create',ticket,4);assert.equal(r.status,200);const id=r.body.id;
 assert.equal(f.call('support/create',ticket,4).body.id,id);
 assert.equal(f.call('support/create',{...ticket,body:'changed'},4).status,409);
 assert.equal(f.call('support/ticket?id='+id,undefined,2).status,404);
 assert.equal(f.call('admin/support',undefined,4).status,403);
 assert.equal(f.call('admin/support/count',undefined,3).body.count,1);
 assert.equal(f.call('support/ticket?id='+id,undefined,3).status,200);
 assert.equal(f.call('admin/support/count').body.count,0);
 assert.equal(f.call('support/reply',{id,body:'Investigating',status:'in_progress'},3).status,200);
 assert.equal(f.call('support',undefined,4).body.tickets[0].player_unread,1);
 assert.equal(f.call('support/reply',{id,body:'Thank you'},4).status,200);
 assert.equal(f.call('admin/support/count').body.count,1);
 assert.equal(f.call('support/reply',{id,body:'x'},2).status,404);
 assert.equal(f.q("SELECT COUNT(*) n FROM player_notifications WHERE title LIKE 'New support ticket%'").n,2);
});
test('block is bidirectional for private messages; mute filters both live chats; sanctions spare support',t=>{
 const f=fixture(t);
 assert.equal(f.call('player-controls',{target:'MemberOne',blocked:true,muted:true}).status,200);
 assert.equal(f.call('messages',{recipient:'MemberOne',message:'hello'}).status,403);
 assert.equal(f.call('messages',{recipient:'DonOne',message:'hello'},2).status,403);
 assert.equal(f.call('world-chat/send',{text:'public',key:'public-care-000001'},2).status,200);
 assert.equal(f.call('family/chat/send',{text:'family',key:'family-care-000001'},2).status,200);
 assert.equal(f.call('world-chat').body.messages.length,0);
 assert.equal(f.call('family/chat').body.messages.length,0);
 assert.equal(f.call('world-chat',undefined,4).body.messages.length,1);
 assert.equal(f.call('admin/chat-mute',{target:'MemberOne',hours:1,reason:'Spam'}).status,200);
 assert.equal(f.call('world-chat/send',{text:'again',key:'care-again'},2).status,403);
 assert.equal(f.call('support/create',ticket,2).status,200);
 f.advance(3600001);assert.equal(f.call('world-chat/send',{text:'restored',key:'care-restored-000001'},2).status,200);
});
test('alliance requires mutual Don consent and blocks hostile routes without spending',t=>{
 const f=fixture(t);
 assert.equal(f.call('family/alliance',{familyId:2,action:'request'},2).status,403);
 assert.equal(f.call('family/alliance',{familyId:2,action:'request'}).status,200);
 assert.equal(f.call('family/alliance',{familyId:2,action:'accept'}).status,403);
 assert.equal(f.call('family/alliance',{familyId:1,action:'accept'},3).status,200);
 const cash=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 for(const path of ['family/raid','family/war/declare','family/war/capture','family/war/sabotage']){
  const r=f.call(path,{familyId:2,targetId:2,city:'New York',plotId:1});assert.equal(r.status,409,path+JSON.stringify(r));
 }
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,cash);
 assert.equal(f.call('family/alliances').body.alliances[0].status,'accepted');
 assert.equal(f.call('family/alliance',{familyId:2,action:'end'}).status,200);
 assert.equal(f.call('family/raid',{familyId:2}).status,200);
});
test('Don handover and departure use highest role then respect, with no orphan family',t=>{
 const f=fixture(t);f.run("UPDATE family_members SET family_role='capo' WHERE user_id=2");
 assert.equal(f.call('family/transfer-don',{userId:2},2).status,403);
 assert.equal(f.call('family/transfer-don',{userId:2}).status,200);
 assert.equal(f.q('SELECT leader_id FROM families WHERE id=1').leader_id,2);
 assert.equal(f.q('SELECT family_role FROM family_members WHERE user_id=1').family_role,'capo');
 f.run("INSERT INTO family_members VALUES(4,1,'capo')");f.run('UPDATE users SET respect_received=100 WHERE id=4');
 assert.equal(f.call('family/leave',{},2).status,200);
 assert.equal(f.q('SELECT leader_id FROM families WHERE id=1').leader_id,4);
 assert.equal(f.call('family/leave',{},3).status,409);
 assert.equal(f.q('SELECT leader_id FROM families WHERE id=2').leader_id,3);
});
test('reset/delete confirm identity, protect Owner, preserve audit and revoke sessions',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=3");
 const action=(id,name,kind='reset',actor=3)=>f.call('admin/player-lifecycle',{id,confirmName:name,confirm:true,action:kind},actor);
 assert.equal(action(1,'DonOne').status,403);
 assert.equal(action(4,'Wrong').status,400);
 assert.equal(f.call('admin/player-lifecycle',{id:4,confirmName:'Outsider',confirm:true,action:'reset'},2).status,403);
 f.run("INSERT INTO sessions VALUES('test',4)");
 assert.equal(action(4,'Outsider').status,200);
 assert.equal(f.q('SELECT cash FROM users WHERE id=4').cash,5000);
 assert.equal(f.q('SELECT xp FROM users WHERE id=4').xp,0);
 assert.equal(f.q('SELECT COUNT(*) n FROM sessions WHERE user_id=4').n,0);
 assert.equal(action(4,'Outsider','delete').status,200);
 assert.equal(f.q('SELECT banned FROM users WHERE id=4').banned,1);
 assert.equal(f.call('profiles/4').status,404);
 assert.equal(f.call('admin/player',{id:4,changes:{banned:0}},1).status,403);
 assert.equal(f.q('SELECT COUNT(*) n FROM player_lifecycle').n,2);
 assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
});
test('economy ledger is staff-readable, separates donation flows and records beta announcement once',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=3");
 assert.equal(f.call('family/donate',{amount:10000},2).status,200);
 assert.equal(f.call('admin/economy/activity',undefined,3).status,200);
 const d=f.call('admin/economy/activity').body,rows=d.flows.filter(x=>x.source==='family/donate');
 assert.equal(rows.length,2);assert.equal(rows.reduce((a,r)=>a+r.net,0),0);
 f.tick();f.tick();f.call('support');
 assert.equal(f.q("SELECT COUNT(*) n FROM bulletins WHERE title='Welcome to the Mafia: The New Era beta'").n,1);
});

test('family shipment costs split fairly, and insufficient treasury rolls back cash and ammunition',t=>{
 const f=fixture(t);f.run('UPDATE users SET xp=0,drugs_xp=0 WHERE id=2');f.run('UPDATE families SET treasury=1499 WHERE id=1');
 const before=f.q('SELECT cash,energy FROM users WHERE id=2'),ammo=f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo;
 assert.equal(f.call('shipments/run',{kind:'drugs',scope:'family',tier:'local'},2).status,409);
 assert.deepEqual(f.q('SELECT cash,energy FROM users WHERE id=2'),before);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='family' AND owner_id=1").ammo,ammo);
 f.run('UPDATE families SET treasury=1500 WHERE id=1');f.dice(9999);
 const r=f.call('shipments/run',{kind:'drugs',scope:'family',tier:'local'},2);assert.equal(r.status,200);assert.equal(r.body.success,false);
 assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,before.cash-1000);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,0);
 assert.equal(r.body.personalCost+r.body.familyCost,2500);
});
test('active wars cannot be bypassed with alliance acceptance',t=>{
 const f=fixture(t);assert.equal(f.call('family/war/declare',{familyId:2}).status,200);
 assert.equal(f.call('family/alliance',{familyId:2,action:'request'}).status,200);
 assert.equal(f.call('family/alliance',{familyId:1,action:'accept'},3).status,409);
 assert.equal(f.call('family/alliances').body.alliances[0].status,'pending');
});
