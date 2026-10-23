import {cityGeography} from '../public/city-geography.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {cities} from '../logistics.js';
const map=(f,city='New York',id=1)=>f.call('family/map?city='+encodeURIComponent(city),undefined,id).body;
const buy=(f,plots,id=1)=>f.call('family/map/buy',{city:plots[0].city,plotIds:plots.map(p=>p.id)},id);
const plan=f=>({targetId:2,kind:'raid',city:'New York',scheduledAt:f.time()+3600000,notes:'Meet at the docks.'});

test('maps use exactly the airport cities, with finite varied districts and public read access',t=>{
 const f=fixture(t),d=map(f);assert.deepEqual(d.cities.map(c=>c.name),cities);assert.equal(f.q('SELECT COUNT(*) n FROM city_territories').n,Object.values(cityGeography).reduce((n,c)=>n+c.count,0));
 for(const city of cities){const x=map(f,city,4);assert.equal(x.plots.length,cityGeography[city].count);assert.ok(x.plots.length>=40&&x.plots.length<=60);assert.ok(x.plots.some(p=>p.item_id==='territory-industry'));assert.equal(x.familyId,null);assert.equal(x.canManage,false)}
 assert.equal(f.call('family/map?city=Atlantis').status,400);
});
test('family buys twenty-five per city atomically, rejects conflicting ownership, and allows independent cities',t=>{
 const f=fixture(t);f.run('UPDATE families SET treasury=1000000000000');let d=map(f);const plots=d.plots.filter(p=>p.item_id==='territory-block').slice(0,20),cash=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 assert.equal(buy(f,plots,2).status,403);assert.equal(buy(f,plots,4).status,403);assert.equal(buy(f,plots).status,200);assert.equal(map(f).ownedInCity,20);assert.ok(f.q('SELECT treasury FROM families WHERE id=1').treasury<cash);
 assert.equal(buy(f,d.plots.filter(p=>!plots.includes(p)).slice(0,5)).status,200);const after=f.q('SELECT treasury FROM families WHERE id=1').treasury;assert.equal(buy(f,[map(f).plots.find(p=>p.owner_id===null)]).status,409);assert.equal(buy(f,[plots[0]],3).status,409);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,after);
 const miami=map(f,'Miami').plots.filter(p=>p.item_id==='territory-block');assert.equal(buy(f,miami.slice(0,5)).status,200);assert.equal(buy(f,[miami[5]]).status,200);assert.equal(map(f,'Miami').ownedInCity,6);
 const london=map(f,'London').plots.filter(p=>p.item_id==='territory-harbor').slice(0,2);f.run('UPDATE families SET treasury=1 WHERE id=1');assert.equal(buy(f,london).status,400);assert.equal(map(f,'London').ownedInCity,0);
 assert.equal(f.call('family/map/buy',{city:'New York',plotIds:[plots[0].id,plots[0].id]}).status,400);
 f.reset();assert.equal(map(f).holdings.length,31);
});
test('legacy holdings migrate once without changing treasury or quantities and reconcile reductions',t=>{
 const f=fixture(t);f.run("INSERT INTO family_assets VALUES(1,'territory-block',25),(1,'territory-industry',25),(1,'territory-harbor',25)");const cash=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 f.reset();const before=map(f).holdings;assert.equal(before.length,75);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,cash);f.reset();assert.deepEqual(map(f).holdings,before);
 f.run("UPDATE family_assets SET quantity=5 WHERE family_id=1 AND item_id='territory-block'");assert.equal(map(f).holdings.length,55);
});
test('capture takes the exact selected plot, obeys protection and stops at thirty-five in a city',t=>{
 const f=fixture(t);f.run('UPDATE families SET treasury=1000000000000');const d=map(f),blocks=d.plots.filter(p=>p.item_id==='territory-block'),districts=d.plots.filter(p=>p.item_id!=='territory-block');assert.equal(buy(f,blocks.slice(0,25)).status,200);assert.equal(buy(f,districts.slice(0,11),3).status,200);assert.equal(f.call('family/war/declare',{familyId:2}).status,200);
 assert.equal(f.call('family/war/capture',{familyId:2,plotId:districts[0].id}).status,409);f.advance(3600001);
 for(let n=0;n<10;n++){f.run('UPDATE users SET energy=100 WHERE id=1');const result=f.call('family/war/capture',{familyId:2,plotId:districts[n].id});assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.success,true);assert.equal(f.q('SELECT owner_id FROM city_territories WHERE id=?',districts[n].id).owner_id,1);f.advance(86400001);f.run("UPDATE family_wars SET ends_at=? WHERE status='active'",f.time()+86400000)}
 assert.equal(map(f).ownedInCity,35);assert.equal(f.call('family/war/capture',{familyId:2,plotId:districts[10].id}).status,409);assert.equal(f.q('SELECT owner_id FROM city_territories WHERE id=?',districts[10].id).owner_id,2);
});
test('chat is scoped to current family, paginated, bounded and duplicate-safe',t=>{
 const f=fixture(t),body={text:'Family intelligence <script>alert(1)</script>',key:'test-chat-request-0001'};
 assert.equal(f.call('family/chat',undefined,4).status,403);assert.equal(f.call('family/chat/send',body).status,200);assert.equal(f.call('family/chat/send',body).status,200);assert.equal(f.call('family/chat').body.messages.length,1);assert.equal(f.call('family/chat',undefined,2).body.messages[0].body,body.text);assert.equal(f.call('family/chat',undefined,3).body.messages.length,0);
 assert.equal(f.call('family/chat/send',{text:'spam',key:'test-chat-request-0002'}).status,429);f.advance(3001);assert.equal(f.call('family/chat/send',{text:'x'.repeat(1001),key:'test-chat-request-0002'}).status,400);
 assert.equal(f.call('family/chat/send',{text:'Second',key:'test-chat-request-0002'}).status,200);assert.equal(f.call('family/chat?after=1').body.messages.length,1);assert.equal(f.call('family/chat?before=2').body.messages.length,1);
 f.run('UPDATE family_members SET family_id=2 WHERE user_id=2');assert.equal(f.call('family/chat',undefined,2).body.messages.length,0);assert.equal(f.call('family/chat?after=-1').status,400);
});
test('planning enforces leadership, family isolation, validation and fresh volunteer consent on edits',t=>{
 const f=fixture(t),b=plan(f);assert.equal(f.call('family/plans/save',b,2).status,403);assert.equal(f.call('family/plans/save',{...b,scheduledAt:f.time()+8*86400000}).status,400);assert.equal(f.call('family/plans/save',{...b,kind:'capture'}).status,400);
 const cash=f.q('SELECT treasury FROM families WHERE id=1').treasury;const created=f.call('family/plans/save',b);assert.equal(created.status,200);const id=created.body.id;
 assert.equal(f.call('family/plans',undefined,3).body.plans.length,0);assert.equal(f.call('family/plans/join',{id},3).status,404);assert.equal(f.call('family/plans/join',{id},2).status,200);assert.equal(f.call('family/plans').body.plans[0].members.length,1);
 assert.equal(f.call('family/plans/save',{...b,id,notes:'Revised'}).status,200);assert.equal(f.call('family/plans').body.plans[0].members.length,0);assert.equal(f.call('family/plans/status',{id,status:'completed'},2).status,403);assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,cash);assert.equal(f.q('SELECT COUNT(*) n FROM family_wars').n,0);
 assert.equal(f.call('family/plans/status',{id,status:'completed'}).status,200);assert.equal(f.call('family/plans/join',{id},2).status,409);assert.equal(f.q('SELECT COUNT(*) n FROM family_war_battles').n,0);
 for(let n=0;n<10;n++)assert.equal(f.call('family/plans/save',b).status,200);assert.equal(f.call('family/plans/save',b).status,409);
});
