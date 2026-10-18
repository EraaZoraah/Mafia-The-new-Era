import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {catalog} from '../catalog.js';
import {stolenVehicles} from '../vehicle-catalog.js';
const buy=(f,id,category='garage')=>f.call('assets/buy',{id,category});
const insert=(f,id='dacia-sandero',state='stored',user=1)=>Number(f.run('INSERT INTO vehicle_loot(user_id,vehicle_id,city,state,created_at) VALUES(?,?,?,?,?)',user,id,'New York',state,f.time()).lastInsertRowid);

test('purchased cars require six-bay garages and sell once at 80% of actual cost',t=>{
 const f=fixture(t),car=catalog.find(x=>x.category==='car'),garage=catalog.find(x=>x.category==='garage'&&!x.storageKind),cash=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(buy(f,car.id,'car').status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
 assert.equal(buy(f,garage.id).status,201);const bought=buy(f,car.id,'car');assert.equal(bought.status,201);
 let board=f.call('vehicles').body.garages;assert.equal(board.capacity,6);assert.equal(board.garages[0].cars[0].id,car.id);
 const sold=f.call('vehicles/car/sell',{itemId:car.id});assert.equal(sold.body.payout,Math.floor(bought.body.cost*.8));assert.equal(f.call('vehicles/car/sell',{itemId:car.id}).status,404);
 for(const x of catalog.filter(x=>x.category==='car').slice(0,6))assert.equal(buy(f,x.id,'car').status,201);
 assert.equal(buy(f,catalog.filter(x=>x.category==='car')[6].id,'car').status,409);
});
test('car theft recovers a weighted vehicle, pays no duplicate cash and requires a decision',t=>{
 const f=fixture(t),cash=f.q('SELECT cash FROM users WHERE id=1').cash,r=f.call('action',{kind:'car'});
 assert.equal(r.status,200);assert.equal(r.body.success,true);assert.equal(r.body.reward,0);assert.equal(r.body.vehicle.vehicleId,'dacia-sandero');assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
 assert.equal(f.call('vehicles/store',{id:r.body.vehicle.id}).status,409);f.advance(60000);assert.equal(f.call('action',{kind:'car'}).status,409);
 const sale=f.call('vehicles/sell',{id:r.body.vehicle.id});assert.ok(sale.body.payout>0);assert.equal(f.call('vehicles/sell',{id:r.body.vehicle.id}).status,409);
 assert.ok(stolenVehicles.filter(v=>v.value<100000).reduce((n,v)=>n+v.weight,0)>stolenVehicles.filter(v=>v.value>=1000000).reduce((n,v)=>n+v.weight,0)*10);
});
test('warehouse capacity, atomic swap, ownership and in-transit bay reservations',t=>{
 const f=fixture(t);assert.equal(buy(f,'vehicle-warehouse').status,201);for(let i=0;i<20;i++)insert(f);
 const pending=insert(f,'chiron','pending'),old=f.q("SELECT id FROM vehicle_loot WHERE state='stored'").id;
 assert.equal(f.call('vehicles/store',{id:pending}).status,409);const before=f.q('SELECT cash FROM users WHERE id=1').cash;
 assert.equal(f.call('vehicles/store',{id:pending,replaceId:old},2).status,409);assert.equal(f.call('vehicles/store',{id:pending,replaceId:old}).status,200);assert.ok(f.q('SELECT cash FROM users WHERE id=1').cash>before);assert.equal(f.call('vehicles').body.used,20);
 const shipment=f.call('vehicles/ship',{id:pending,city:'London',mode:'boat'});assert.equal(shipment.status,200);assert.equal(f.call('vehicles/sell',{id:pending}).status,409);assert.equal(f.call('vehicles').body.used,20);
 f.advance(20*3600000);const board=f.call('vehicles').body;assert.equal(board.used,19);assert.equal(f.q('SELECT state FROM vehicle_loot WHERE id=?',pending).state,'seized');
});
test('production requires warehouses and capacity is shared across all unsold drug types',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York',drugs_xp=10000000 WHERE id=1");let key=0;const start=(product,units)=>f.call('production/start',{product,units,hours:6,scope:'personal',requestKey:'new-storage-test-'+(++key)});
 assert.equal(start('cannabis',1).status,409);assert.equal(buy(f,'production-warehouse').status,201);assert.equal(start('cannabis',1000).status,200);assert.equal(start('hashish',1).status,409);
 assert.equal(buy(f,'production-warehouse').status,201);assert.equal(start('hashish',1).status,200);const storage=f.call('production').body.storage;assert.deepEqual(storage,{warehouses:2,capacity:2000,used:1001});
});

test('warehouses do not masquerade as private garages for vehicle operation unlocks',t=>{
 const f=fixture(t);assert.equal(buy(f,'vehicle-warehouse').status,201);assert.equal(buy(f,'production-warehouse').status,201);
 assert.equal(f.call('catalog').body.crimes.find(c=>c.id==='getaway').locked,true);
 assert.equal(buy(f,'collector').status,201);assert.equal(f.call('catalog').body.crimes.find(c=>c.id==='getaway').locked,false);
});
test('Big Score preserves triple vehicle value across storage and sale',t=>{
 const f=fixture(t),first=f.call('action',{kind:'car'}).body;assert.equal(f.call('vehicles/sell',{id:first.vehicle.id}).status,200);
 f.advance(60000);f.big(0);const big=f.call('action',{kind:'car'}).body;assert.equal(big.bigScore,true);assert.equal(big.xp,first.xp*3);assert.equal(big.vehicle.saleValue,first.vehicle.saleValue*3);
 assert.equal(buy(f,'vehicle-warehouse').status,201);assert.equal(f.call('vehicles/store',{id:big.vehicle.id}).status,200);
 const stored=f.call('vehicles').body.entries.find(x=>x.id===big.vehicle.id);assert.equal(stored.saleValue,big.vehicle.saleValue);assert.equal(f.call('vehicles/sell',{id:big.vehicle.id}).body.payout,big.vehicle.saleValue);
});
test('recovered inventory counts towards net worth without creating duplicate wealth when sold',t=>{
 const f=fixture(t),player=()=>f.call('underworld').body.players.find(p=>p.id===1),before=player();
 const id=insert(f,'lexus-lc','pending'),car=f.call('vehicles').body.entries.find(x=>x.id===id),withCar=player();
 assert.equal(withCar.value-before.value,car.saleValue);assert.equal(withCar.assetCount-before.assetCount,1);
 assert.equal(f.call('vehicles/sell',{id}).body.payout,car.saleValue);assert.equal(player().value,withCar.value);assert.equal(player().assetCount,before.assetCount);
});
