import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {tuningModules,raceRoutes,raceStrategies,raceSetups,raceProjection} from '../midnight-catalog.js';
import {installBots} from '../bot-players.js';
import {gameKnowledge} from '../game-knowledge.js';
import {createTranslator} from '../public/i18n.js';
function equip(f,id=1,model='fiat500'){
 f.run("UPDATE users SET city='New York',energy=1000 WHERE id=?",id);
 assert.equal(f.call('assets/buy',{category:'garage',id:'collector'},id).status,201);
 assert.equal(f.call('assets/buy',{category:'car',id:model},id).status,201);
 return 'p:'+model;
}
const car=(f,id=1)=>f.call('circuit',undefined,id).body.cars[0];
function offer(f,module,id=1){const c=car(f,id),m=c.modules.find(m=>m.id===module);return {car:c.key,kind:'upgrade',module,maxCost:m.cost,revision:c.workshopRevision};}
const upgrade=(f,module,id=1)=>f.call('circuit/workshop',offer(f,module,id),id);

test('legacy balanced tuning migrates without losing levels and now contributes to matching rating',t=>{
 const f=fixture(t),key=equip(f);for(const m of tuningModules)f.db.exec('ALTER TABLE race_vehicle_state DROP COLUMN '+m.column);
 f.run('INSERT INTO race_vehicle_state(user_id,car_key,wear,tune) VALUES(?,?,25,2)',1,key);f.reset();let c=car(f);
 assert.equal(c.tune,2);assert.equal(c.wear,25);assert.equal(c.rating,c.stockRating+20);assert.equal(c.moduleUsed,0);
 f.reset();assert.equal(car(f).rating,c.rating);assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
});

for(const [model,max,budget] of [['fiat500',3,6],['rs7',4,8],['jesko',5,10]])test(model+' class budgets cap specialist levels with atomic payments',t=>{
 const f=fixture(t);equip(f,1,model);const paid=f.q('SELECT basis FROM purchased_car_bays WHERE user_id=1');
 assert.equal(car(f).maxModuleLevel,max);assert.equal(car(f).moduleBudget,budget);
 for(const module of ['handling','acceleration'])for(let i=0;i<max;i++){const quote=offer(f,module),cash=f.q('SELECT cash FROM users WHERE id=1').cash;assert.equal(f.call('circuit/workshop',quote).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash-quote.maxCost);}
 const c=car(f);assert.equal(c.moduleUsed,budget);assert.equal(c.stars,4);assert.equal(c.rating,c.stockRating+max*10);assert.deepEqual(f.q('SELECT basis FROM purchased_car_bays WHERE user_id=1'),paid);
 const cash=f.q('SELECT cash FROM users WHERE id=1').cash;assert.equal(upgrade(f,'reliability').status,409);assert.equal(upgrade(f,'handling').status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
});

test('specialization improves the intended route, reliability reduces risk and quoted retries cannot spend twice',t=>{
 const f=fixture(t);equip(f);const before=car(f),quote=offer(f,'handling'),projection=c=>raceRoutes.map(r=>raceProjection(c,r,raceStrategies[1],raceSetups[0]));
 assert.equal(f.call('circuit/workshop',{...quote,maxCost:1}).status,409);assert.equal(f.call('circuit/workshop',quote).status,200);
 const cash=f.q('SELECT cash FROM users WHERE id=1').cash;assert.equal(f.call('circuit/workshop',quote).status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
 const after=car(f),a=projection(before),b=projection(after);assert.ok(b[0].performance-a[0].performance>b[1].performance-a[1].performance);assert.equal(after.rating,before.rating+5);
 const stale=offer(f,'reliability');assert.equal(upgrade(f,'acceleration').status,200);assert.equal(f.call('circuit/workshop',stale).status,409);const old=projection(car(f));assert.equal(upgrade(f,'reliability').status,200);const next=projection(car(f));assert.ok(Math.abs(old[0].risk-next[0].risk-.003)<1e-9);
 assert.equal(f.call('circuit/workshop',{...offer(f,'handling'),module:'handling_tune=99'}).status,400);
});

test('workshop validates cash, custody and ownership; heavily worn cars can be repaired',t=>{
 const f=fixture(t),key=equip(f),o=offer(f,'handling');assert.equal(f.call('circuit/workshop',o,2).status,409);
 f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('circuit/workshop',o).status,409);assert.equal(car(f).moduleUsed,0);
 f.run('UPDATE users SET cash=1000000,prison_until=? WHERE id=1',f.time()+60000);assert.equal(f.call('circuit/workshop',o).status,409);assert.equal(f.call('circuit').body.workshopRecommendation,null);
 f.run('UPDATE users SET prison_until=0 WHERE id=1');f.run('INSERT INTO race_vehicle_state(user_id,car_key,wear) VALUES(?,?,90)',1,key);
 let c=car(f);assert.equal(upgrade(f,'handling').status,409);assert.equal(f.call('circuit/workshop',{car:key,kind:'repair',maxCost:c.repairCost}).status,200);assert.equal(car(f).wear,0);
});

test('installed tuning drives matchmaking and race snapshots remain locked',t=>{
 const f=fixture(t),key=equip(f,1,'civic');equip(f,2);for(const m of ['handling','acceleration'])for(let i=0;i<3;i++)assert.equal(upgrade(f,m).status,200);
 const c=car(f),body={car:key,route:'technical',strategy:'clean',setup:'street',mechanic:false,capacity:2,maxCost:c.fee,key:'specialist-lobby-0001'},r=f.call('circuit/create',body);assert.equal(r.status,200);assert.equal(r.body.race.rating,c.rating);assert.ok(r.body.race.rating-car(f,2).rating>80);
 const before=f.q('SELECT cash FROM users WHERE id=2').cash;assert.equal(f.call('circuit/join',{...body,car:'p:fiat500',raceId:r.body.race.id,key:'specialist-join-0001'},2).status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,before);
 assert.equal(f.call('circuit/workshop',{car:key,kind:'tune',maxCost:c.tuneCost}).status,409);assert.equal(upgrade(f,'reliability').status,409);
 const frozen=f.q('SELECT car_json FROM race_entries WHERE user_id=1').car_json;f.advance(1800001);assert.equal(f.call('circuit').body.history[0].state,'cancelled');assert.equal(f.q('SELECT car_json FROM race_entries WHERE user_id=1').car_json,frozen);
});

test('bots install specialist modules through the normal workshop and Luca quotes remain feasible',t=>{
 const f=fixture(t);equip(f,2);f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(2,'builder',0)");const calls=[];
 const bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>a,call:(id,path,body)=>{const r=f.call(path,body,id);calls.push({path,body,status:r?.status});return r;}});bots.step(2,{domain:'circuit'});
 assert.ok(calls.some(c=>c.path==='circuit/workshop'&&c.body.kind==='upgrade'&&c.status===200));assert.equal(car(f,2).moduleUsed,1);
 equip(f);const knowledge=gameKnowledge();for(const m of tuningModules)assert.ok(knowledge.some(k=>k.title===m.name));
 for(const lang of ['en','nl','es','fr','de']){const t=createTranslator(lang),r=f.call('guide?q=Midnight%20Circuit&lang='+lang).body,quote=f.call('circuit').body.workshopRecommendation;assert.ok(quote);assert.ok(r.answer.includes(quote.cost.toLocaleString('en-US')));if(lang!=='en')assert.notEqual(t(tuningModules[0].name),tuningModules[0].name);}
 for(const [lang,question] of [['es','Qué mejora puedo comprar en Midnight Circuit?'],['fr','Quelle amélioration puis-je acheter dans Midnight Circuit ?'],['de','Welche Tuning-Upgrades kann ich für Midnight Circuit kaufen?']]){const r=f.call('guide?q='+encodeURIComponent(question)+'&lang='+lang).body;assert.equal(r.language,lang);assert.ok(!r.answer.includes('Available workshop quote:'));assert.ok(!r.answer.includes('this is not a guaranteed win'));}
 f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(f.call('circuit').body.workshopRecommendation,null);
});
