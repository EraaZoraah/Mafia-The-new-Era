import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedNumber} from '../public/input-limits.js';
import {fixture} from './helpers/game-fixture.js';

test('input caps clamp excessive quantities and preserve empty edits and exact money',()=>{
 assert.equal(boundedNumber('99','0','4','1'),4);
 assert.equal(boundedNumber('','0','4','1'),'');
 assert.equal(boundedNumber('1e5','0','4','1'),4);
 assert.equal(boundedNumber('999999999999999','0','1000000000000000','1',true),999999999999999);
 assert.equal(boundedNumber('9999999999999999','0','1000000000000000','1'),1000000000000000);
 assert.equal(boundedNumber('0','1','100','1'),0); // typing 10 remains possible
 assert.equal(boundedNumber('0','1','100','1',true),1);
 assert.equal(boundedNumber('1.7','0','4','1',true),2);
 assert.equal(boundedNumber('1.26','0','10','0.1',true),1.3);
 assert.equal(boundedNumber('0','0','0','1',true),0);
});

test('staff form gets real server limits and saves capped stats atomically',t=>{
 const f=fixture(t),limits=f.call('admin/player?id=2').body.numericLimits;
 assert.equal(limits.muscle_uses,8);assert.equal(limits.muscle_bonus,1500);
 assert.equal(limits.personal_protection,10);assert.equal(limits.energy,1000);
 const changes=Object.fromEntries(['muscle_uses','muscle_bonus','personal_protection'].map(k=>[k,boundedNumber('99999','0',String(limits[k]),'1',true)]));
 const response=f.call('admin/player',{id:2,changes});assert.equal(response.status,200);
 const saved=f.q('SELECT muscle_uses,muscle_bonus,personal_protection FROM users WHERE id=2');
 assert.deepEqual({...saved},changes);
 const invalid=f.call('admin/player',{id:2,changes:{cash:123,muscle_uses:9}});
 assert.equal(invalid.status,400);assert.notEqual(f.q('SELECT cash FROM users WHERE id=2').cash,123);
 assert.equal(f.call('admin/player?id=2',undefined,2).status,403);
});
