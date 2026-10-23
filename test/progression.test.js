import test from 'node:test';
import assert from 'node:assert/strict';
import {ranks,progression,distinctionStep,prestigeThreshold} from '../progression.js';
import {catalog,ownershipBenefits,assetLimit} from '../catalog.js';

test('25 ranks have increasing XP gaps, exact promotion boundaries and additive promotion increases',()=>{
  assert.equal(ranks.length,25);
  assert.equal(ranks.at(-1).name,'The Godfather');
  let gap=0;
  for(let i=1;i<ranks.length;i++){
    assert.ok(ranks[i].xp-ranks[i-1].xp>gap);
    gap=ranks[i].xp-ranks[i-1].xp;
    assert.equal(progression(ranks[i].xp-1).rank,ranks[i-1].name);
    const current=progression(ranks[i].xp),previous=progression(ranks[i-1].xp);
    assert.equal(current.rank,ranks[i].name);assert.equal(current.rankEnergyBonus,i*10);
    assert.ok(Math.abs(current.incomeMultiplier/previous.incomeMultiplier-1-ranks[i].promotionPercent/100)<1e-10);
    assert.ok(current.crimeChanceBonus>previous.crimeChanceBonus);
  }
  assert.ok(Math.abs(ranks[1].promotionPercent-10)<1e-9);assert.equal(progression(ranks.at(-1).xp).incomeMultiplier,500);

});
test('Godfather distinctions extend increasing XP gaps without changing rank',()=>{
  const top=ranks.at(-1).xp;
  assert.equal(distinctionStep,ranks.at(-1).xp-ranks.at(-2).xp);
  for(const number of [0,1,2,5,20,30]){
    const p=progression(prestigeThreshold(number));
    assert.equal(p.rank,'The Godfather');
    assert.equal(p.distinctions,number);assert.equal(p.rankEnergyBonus,240+number*10);
    assert.equal(p.nextRankXp,prestigeThreshold(number+1));
    assert.equal(p.rankProgress,0);
    assert.ok(p.distinctionIcon.length<=5);
  }
  assert.equal(progression(prestigeThreshold(1)-1).distinctions,0);
});
test('every purchasable asset adds income or a real stacking benefit and an unlocked title',()=>{
  for(const item of catalog){
    const b=ownershipBenefits([{category:item.category,item_id:item.id}]);
    assert.equal(b.titles.length,1);
    assert.ok(b.categories.includes(item.category));
    assert.ok(item.unlock);
    assert.match(item.image,/^\/images\/[a-z0-9-]+\.(?:jpg|png)$/);
    assert.ok(b.income>0||b.rewardBps>0||b.cooldownBps>0||b.energyMax>100||item.storageKind&&item.capacity>0||item.parkingCapacity>0);
  }
  const all=ownershipBenefits(catalog.map(x=>({category:x.category,item_id:x.id})));
  assert.equal(all.energyMax,1000);
  assert.equal(all.energyInterval,21000);
  assert.equal(all.healthInterval,42000);
  assert.equal(all.cooldownBps,3480);
  assert.equal(catalog.find(x=>x.id==='fiat500').price,180000);
  assert.equal(catalog.find(x=>x.id==='coffee').income,120);
});

test('only businesses generate cash and private collections cannot stack extra copies',()=>{
 const owned=catalog.map(x=>({category:x.category,item_id:x.id,quantity:100}));
 const b=ownershipBenefits(owned);
 assert.equal(b.income,catalog.filter(x=>x.category==='business').reduce((n,x)=>n+x.income*10,0));
 assert.equal(b.energyMax,1000);assert.ok(b.cooldownBps<=6000);
 for(const a of catalog)assert.equal(a.limit,assetLimit(a));
 assert.ok(catalog.filter(x=>x.category!=='business').every(x=>x.income===0));
});

test('crime rewards rise in severity order while success odds fall, and budget assets add no energy',async()=>{
 const {crimes}=await import('../catalog.js');
 for(let i=1;i<crimes.length;i++){assert.ok(crimes[i].reward>crimes[i-1].reward);assert.ok(crimes[i].chance<=crimes[i-1].chance);assert.ok(crimes[i].energy>=crimes[i-1].energy);assert.ok(crimes[i].cooldown>=crimes[i-1].cooldown)}
 assert.equal(crimes[0].id,'courier');assert.equal(crimes.at(-1).id,'vault');
 for(const category of ['car','home']){const items=catalog.filter(x=>x.category===category).sort((a,b)=>a.price-b.price);for(const item of items.slice(0,3))assert.equal(item.perks.energyCapacity,0);for(let i=1;i<items.length;i++)assert.ok(items[i].perks.energyCapacity>=items[i-1].perks.energyCapacity);}
 assert.equal(ownershipBenefits([{category:'car',item_id:'fiat500',quantity:4},{category:'home',item_id:'studio',quantity:4}]).energyMax,100);
});
