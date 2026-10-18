import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';

test('players without a family can load personal pages, recruitment and all public standings',t=>{
 const f=fixture(t),id=4;
 for(const route of ['family','family/dashboard','families','empire','investments','custody','underworld','profiles/4','armory?scope=personal','production?scope=personal','daily','casino']){
  const result=f.call(route,undefined,id);assert.equal(result.status,200,route+': '+JSON.stringify(result.body));
 }
 assert.equal(f.call('family',undefined,id).body.family,null);
 assert.deepEqual(f.call('family/dashboard',undefined,id).body,{family:null,invites:[]});
 assert.deepEqual(f.call('families',undefined,id).body.invites,[]);
 assert.equal(f.call('profiles/4',undefined,id).body.player.family,null);
 for(const route of ['armory?scope=family','production?scope=family']){const result=f.call(route,undefined,id);assert.equal(result.status,403);assert.equal(result.body.error,'Join a family first.');}
});

test('joining and leaving a family returns the player to a valid independent state',t=>{
 const f=fixture(t),id=4;
 assert.equal(f.call('families/join',{id:1},id).status,200);
 assert.equal(f.call('family/dashboard',undefined,id).body.family.id,1);
 assert.equal(f.call('family/leave',{},id).status,200);
 for(const route of ['family','family/dashboard','families','empire','profiles/4','underworld'])assert.equal(f.call(route,undefined,id).status,200,route);
 assert.equal(f.call('family/dashboard',undefined,id).body.family,null);
});
