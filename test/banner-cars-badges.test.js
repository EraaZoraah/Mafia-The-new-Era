import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fixture} from './helpers/game-fixture.js';
import {bannerCars} from '../collector-cars.js';
import {catalog} from '../catalog.js';
import {gameKnowledge} from '../game-knowledge.js';
import {supporterBadge,supporterDiamondSVG,profileDiamondSVG} from '../public/name-badges.js';

test('banner models use the ordinary catalog, garage, one-model cap and paid-cost resale',t=>{
 const f=fixture(t);
 for(const car of bannerCars){
  assert.equal(catalog.find(c=>c.category==='car'&&c.id===car.id),car);
  assert.equal(car.income,0);assert.equal(car.limit,1);
  assert.equal(f.call('assets/buy',{category:'car',id:car.id}).status,409);
 }
 assert.equal(f.call('assets/buy',{category:'garage',id:'collector'}).status,201);
 for(const car of bannerCars){
  const purchase=f.call('assets/buy',{category:'car',id:car.id});assert.equal(purchase.status,201,car.name);
  assert.equal(f.call('assets/buy',{category:'car',id:car.id}).status,409);
  assert.equal(f.call('vehicles/car/sell',{itemId:car.id}).body.payout,Math.floor(purchase.body.cost*.8));
  assert.equal(f.call('vehicles/car/sell',{itemId:car.id}).status,404);
 }
});
test('Luca indexes every new car in both languages and bot callers consume the live catalog',()=>{
 for(const lang of ['en','nl'])for(const car of bannerCars)assert.ok(gameKnowledge(lang).some(k=>k.title.includes(car.name)),car.name);
 const bot=readFileSync(new URL('../bot-autonomy.js',import.meta.url),'utf8');assert.match(bot,/get\('catalog'\)/);assert.match(bot,/send\('assets\/buy'/);
});
test('membership gems and the profile diamond have distinct faceted SVGs',()=>{
 assert.notEqual(profileDiamondSVG,supporterDiamondSVG);assert.match(profileDiamondSVG,/viewBox="0 0 40 40"/);
 assert.match(supporterBadge({tier:'silver'}),/supporter-silver/);assert.match(supporterBadge({tier:'gold'}),/Grand Supporter/);
 assert.equal(supporterBadge(null),'');assert.equal(supporterBadge({tier:'expired'}),'');
});
test('new model cards exist as unique images',()=>{
 const signatures=new Set();for(const car of bannerCars){const path=new URL('../public'+car.image,import.meta.url);assert.ok(existsSync(path),car.image);const bytes=readFileSync(path);assert.equal(bytes.subarray(1,4).toString(),'PNG');signatures.add(bytes.toString('base64'));}assert.equal(signatures.size,bannerCars.length);
});
import {pageArt} from '../public/page-art.js';
import {familyAssets} from '../empire-catalog.js';
import {autonomousMove} from '../bot-autonomy.js';

test('bots can choose and purchase each banner car through ordinary server validation',t=>{
 const f=fixture(t);f.call('assets/buy',{category:'garage',id:'collector'},4);
 for(const car of bannerCars){const commands=[];const result=autonomousMove({id:4,u:f.q('SELECT * FROM users WHERE id=4'),family:null,db:f.db,clock:f.time,get:path=>f.call(path,undefined,4).body,pick:items=>items.find(x=>x.id===car.id),act:(path,body)=>commands.push(f.call(path,body,4)),random:(a)=>a},'assets');assert.equal(result,true);assert.equal(commands[0].status,201,car.name);assert.equal(f.call('vehicles/car/sell',{itemId:car.id},4).status,200);}
});
test('all regenerated overview scenes exist, are panoramic and use unique image data',()=>{
 const hashes=new Set();for(const file of new Set(Object.values(pageArt).filter(x=>x.startsWith('banner-')).concat(['banner-owner-v3.png','banner-admin-v3.png']))){const b=readFileSync(new URL('../public/images/'+file,import.meta.url));const ratio=b.readUInt32BE(16)/b.readUInt32BE(20);assert.ok(ratio>2.9&&ratio<3.1,file);hashes.add(b.toString('base64'));}assert.equal(hashes.size,51);assert.equal(pageArt.armory,pageArt['family-armory']);
});
test('illustrated non-car asset types remain available from authoritative catalogs',()=>{
 for(const [category,ids] of [['home',['estate','chateau','beach']],['jet',['swift','regent','imperium']],['helicopter',['sparrow','meridian','obsidian']],['yacht',['riviera','sovereign','elysium']],['garage',['collector','vehicle-warehouse','production-warehouse']]])for(const id of ids)assert.ok(catalog.some(x=>x.id===id&&x.category===category),id);
 for(const id of ['compound-castle','compound-palace','safehouse-modern','safehouse-sanctuary','car-sedan','car-limousine','suv-armored'])assert.ok(familyAssets.some(x=>x.id===id));
});

import {carPerformance} from '../midnight-catalog.js';
test('new collectibles retain appropriate racing classes rather than following their price',()=>{
 assert.equal(carPerformance(bannerCars.find(c=>c.id==='jaguar-xk120')).class,'street');
 assert.equal(carPerformance(bannerCars.find(c=>c.id==='urus')).class,'gt');
 assert.equal(carPerformance(bannerCars.find(c=>c.id==='chiron')).class,'exotic');
 assert.equal(carPerformance(bannerCars.find(c=>c.id==='phantom-limousine')).class,'street');
});
