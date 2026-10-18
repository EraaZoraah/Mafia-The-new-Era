import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {catalog,purchasePrice} from '../catalog.js';
import {familyAssets} from '../empire-catalog.js';
let key=0;const request=b=>({...b,requestKey:'bulk-purchase-test-'+(++key)});
test('bulk personal purchases use current server prices and limits and reject unaffordable whole orders atomically',t=>{
 const f=fixture(t),item=catalog.find(x=>x.id==='coffee');f.run('UPDATE users SET cash=? WHERE id=1',purchasePrice(item,0)+purchasePrice(item,1));
 assert.equal(f.call('assets/buy',{id:item.id,category:item.category,quantity:3}).status,409);assert.equal(f.q('SELECT COUNT(*) n FROM possessions').n,0);
 const r=f.call('assets/buy',{id:item.id,category:item.category,quantity:'max',price:0});assert.equal(r.status,201);assert.equal(r.body.quantity,2);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,0);assert.equal(f.q('SELECT quantity FROM possessions WHERE user_id=1').quantity,2);
});
test('family bulk assets and possessions access require Don or Capo; most expensive compound costs five billion',t=>{
 const f=fixture(t);assert.equal(f.call('family/possessions',undefined,2).status,403);assert.equal(f.call('family/possessions').status,200);const r=f.call('family/buy',{id:'safehouse-starter',quantity:'max'});assert.equal(r.status,200);assert.equal(f.q("SELECT quantity FROM family_assets WHERE item_id='safehouse-starter'").quantity,1);assert.equal(familyAssets.find(x=>x.id==='compound-palace').price,5000000000);
});
test('custom ammunition, linear weapon pricing, ten-thousand cap and bulk replay safety',t=>{
 const f=fixture(t,false);f.run('UPDATE users SET cash=5500 WHERE id=1');const body=request({scope:'personal',kind:'ammo',quantity:'max'});assert.equal(f.call('armory/buy',body).body.quantity,220);assert.equal(f.call('armory/buy',body).body.quantity,220);assert.equal(f.call('armory').body.ammo,320);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,0);
 f.run('UPDATE users SET cash=1000000000000 WHERE id=1');const r=f.call('armory/buy',request({scope:'personal',kind:'weapon',item:'street-sidearm',quantity:'max'}));assert.equal(r.body.quantity,9999);assert.equal(f.call('armory').body.weapons[0].quantity,10000);assert.equal(f.call('armory/buy',request({scope:'personal',kind:'weapon',item:'street-sidearm'})).status,409);f.reset();assert.equal(f.call('armory').body.weapons[0].quantity,10000);
});
test('new family roles, per-member Power, promotion and kick permissions',t=>{
 const f=fixture(t);for(const role of ['soldier','enforcer','consigliere','underboss','capo'])assert.equal(f.call('family/role',{userId:2,role}).status,200);assert.equal(f.call('families/join',{id:1},4).status,200);assert.equal(f.call('family/role',{userId:4,role:'consigliere'},2).status,200);assert.equal(f.call('family/role',{userId:4,role:'capo'},2).status,403);const m=f.call('family/dashboard').body.family.members.find(m=>m.id===4);assert.equal(m.family_role,'Consigliere');assert.ok(m.power>0);assert.equal(f.call('family/kick',{userId:1},2).status,403);assert.equal(f.call('family/kick',{userId:4},2).status,200);assert.equal(f.q('SELECT family_join_after FROM users WHERE id=4').family_join_after,f.time()+3600000);
});
test('Admins manage Owner family and its other members but cannot mutate Owner membership',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=2");assert.equal(f.call('admin/player',{id:2,changes:{cash:500,familyRole:'consigliere'}},2).status,200);assert.equal(f.call('admin/family',{id:1,changes:{treasury:123}},2).status,200);assert.equal(f.call('admin/player',{id:1,changes:{cash:0}},2).status,403);assert.equal(f.call('admin/family',{id:1,changes:{members:[{username:'MemberOne',role:'capo',donated:'0'}]}},2).status,403);assert.equal(f.call('admin/family',{id:1,changes:{don:'MemberOne'}},2).status,403);
});
