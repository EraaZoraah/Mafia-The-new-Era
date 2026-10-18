import test from 'node:test';
import assert from 'node:assert/strict';
import {ranks,progression,distinctionStep,prestigeThreshold,passiveMultiplier} from '../progression.js';
import {businesses,catalog,purchasePrice,crimes} from '../catalog.js';

test('prestige reward per XP declines as gaps outgrow 7.5 percent bonuses',()=>{
 let previous=Infinity;
 for(let n=1;n<=30;n++){
  const before=progression(prestigeThreshold(n-1)),after=progression(prestigeThreshold(n));
  const efficiency=(after.incomeMultiplier-before.incomeMultiplier)/(prestigeThreshold(n)-prestigeThreshold(n-1));
  assert.ok(efficiency<previous);previous=efficiency;
 }
 assert.equal(passiveMultiplier(1e6),16);
});

test('starter opportunities survive while flagship businesses need long-term capital',()=>{
 assert.equal(crimes.find(c=>c.id==='courier').reward,1600);
 assert.equal(businesses[0].price,120000);assert.equal(businesses[0].income,120);
 assert.equal(catalog.find(c=>c.id==='fiat500').price,180000);
 const top=passiveMultiplier(progression(ranks.at(-1).xp).incomeMultiplier);
 const flagship=businesses.at(-1);
 assert.ok(flagship.price/(flagship.income*top*24)>5);
 assert.ok(purchasePrice(flagship,3)>purchasePrice(flagship,0));
 for(let i=5;i<businesses.length;i++)assert.ok(businesses[i].income/businesses[i].price<businesses[i-1].income/businesses[i-1].price);
});
