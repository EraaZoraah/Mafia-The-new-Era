import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {chooseVehicleCondition,vehicleSaleValue,stolenVehicles} from '../vehicle-catalog.js';
import {MAX_CASH} from '../money.js';
import {installBots} from '../bot-players.js';
const stock=(f,user=1)=>Number(f.run("INSERT INTO vehicle_loot(user_id,vehicle_id,city,state,created_at,condition_stars) VALUES(?,'dacia-sandero','New York','stored',?,5)",user,f.time()).lastInsertRowid);
const warehouse=(f,user)=>f.call('assets/buy',{category:'garage',id:'vehicle-warehouse'},user);
test('condition distribution is exactly 55/25/13/6/1; prices and persisted stars follow condition',t=>{
 const counts=[0,0,0,0,0];for(let n=1;n<=100;n++)counts[chooseVehicleCondition(()=>n).stars-1]++;assert.deepEqual(counts,[55,25,13,6,1]);
 const values=[1,2,3,4,5].map(s=>vehicleSaleValue(stolenVehicles[0],'New York',0,1,s));assert.deepEqual([...values].sort((a,b)=>a-b),values);assert.equal(values[4],Math.floor(values[3]*1.35));
 const f=fixture(t);f.high((min,max)=>max===100?100:min);const theft=f.call('action',{kind:'car'});assert.equal(theft.body.vehicle.condition_stars,5);assert.equal(theft.body.vehicle.condition.name,'Pristine');assert.equal(warehouse(f,1).status,201);assert.equal(f.call('vehicles/store',{id:theft.body.vehicle.id}).status,200);f.reset();assert.equal(f.call('vehicles').body.entries[0].condition_stars,5);
});
test('vehicle auction locks disposal, escrows bids, reserves bays, refunds and transfers once with 3% commission',t=>{
 const f=fixture(t);warehouse(f,1);warehouse(f,2);warehouse(f,3);const id=stock(f),cash=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(f.call('vehicles/auction/list',{id:{bad:true},reserve:1,hours:6}).status,400);
 const listed=f.call('vehicles/auction/list',{id,reserve:100000,hours:6});assert.equal(listed.status,200);assert.equal(listed.body.cost,500);assert.equal(f.call('vehicles/sell',{id}).status,409);assert.equal(f.call('vehicles/ship',{id,city:'London',mode:'boat'}).status,409);
 const a=listed.body.id;assert.equal(f.call('vehicles/auction/bid',{id:a,amount:100000}).status,409);assert.equal(f.call('vehicles/auction/bid',{id:a,amount:100000},4).status,409);
 assert.equal(f.call('vehicles/auction/bid',{id:a,amount:100000},2).status,200);assert.equal(f.call('vehicles').body.used,1);assert.equal(f.call('vehicles',undefined,2).body.reservedBays,1);
 f.run('UPDATE users SET cash=? WHERE id=2',MAX_CASH);assert.equal(f.call('vehicles/auction/bid',{id:a,amount:105000},3).status,200);assert.equal(f.q('SELECT amount FROM vehicle_refunds WHERE user_id=2').amount,100000);
 f.run('UPDATE users SET cash=cash-100000 WHERE id=2');f.advance(6*3600000+1);f.tick();assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,MAX_CASH);assert.equal(f.q('SELECT user_id FROM vehicle_loot WHERE id=?',id).user_id,3);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash-500+101850);f.tick();assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash-500+101850);assert.equal(f.q('SELECT condition_stars FROM vehicle_loot WHERE id=?',id).condition_stars,5);
});
test('unsold listings retain listing fee, late bids extend and autonomous players can bid',t=>{
 const f=fixture(t);warehouse(f,1);warehouse(f,3);const id=stock(f),list=f.call('vehicles/auction/list',{id,reserve:1000,hours:6});f.advance(6*3600000+1);f.tick();assert.equal(f.q('SELECT state FROM vehicle_auctions WHERE id=?',list.body.id).state,'unsold');
 const next=f.call('vehicles/auction/list',{id,reserve:1000,hours:6});f.advance(6*3600000-60000);f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(3,'builder',0)");const bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>b-1,call:(id,path,body)=>f.call(path,body,id)});bots.step(3,{domain:'vehicles'});assert.equal(f.q('SELECT bidder_id FROM vehicle_auctions WHERE id=?',next.body.id).bidder_id,3);assert.equal(f.q('SELECT ends_at FROM vehicle_auctions WHERE id=?',next.body.id).ends_at,f.time()+120000);
});

test('reset cancels vehicle auctions and preserves other bidders money without foreign key failures',t=>{
 const f=fixture(t);warehouse(f,4);warehouse(f,2);const id=stock(f,4),a=f.call('vehicles/auction/list',{id,reserve:1000,hours:6},4);assert.equal(a.status,200);assert.equal(f.call('vehicles/auction/bid',{id:a.body.id,amount:1000},2).status,200);
 const before=f.q('SELECT cash FROM users WHERE id=2').cash;assert.equal(f.call('admin/player-lifecycle',{id:4,confirmName:'Outsider',confirm:true,action:'reset'}).status,200);f.tick();assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,before+1000);assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
});
