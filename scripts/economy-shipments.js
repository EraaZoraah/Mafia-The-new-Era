import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {fixture} from '../test/helpers/game-fixture.js';
import {shipmentTiers,careerRanks} from '../empire-catalog.js';
import {progression} from '../progression.js';
const results=[];
for(const xp of [0,110000,1350000])for(const tier of shipmentTiers)for(const scope of ['personal','family']){
 let close,state=42;const f=fixture({after:fn=>close=fn});const rand=(min,max)=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return min+state%(max-min+1)};
 f.dice(()=>rand(0,9999));f.high(rand);const careerXp=careerRanks.drugs[tier.level-1].xp;let personalNet=0,familyNet=0,successes=0,offer;
 for(let i=0;i<300;i++){
  f.run('UPDATE users SET xp=?,drugs_xp=?,cash=1000000000,energy=100,health=100,energy_at=?,health_at=? WHERE id=2',xp,careerXp,f.time(),f.time());
  f.run('UPDATE families SET drugs_xp=?,treasury=1000000000 WHERE id=1',careerXp);f.run("UPDATE armory_accounts SET ammo=100000");f.run('DELETE FROM actions WHERE user_id=2');
  offer=f.call('empire',undefined,2).body.shipments.find(s=>s.kind==='drugs'&&s.id===tier.id&&s.scope===scope);
  const r=f.call('shipments/run',{kind:'drugs',scope,tier:tier.id},2);assert.equal(r.status,200,JSON.stringify(r));successes+=Number(r.body.success);
  personalNet+=f.q('SELECT cash FROM users WHERE id=2').cash-1e9-(scope==='personal'?r.body.ammoUsed*50:0);
  familyNet+=f.q('SELECT treasury FROM families WHERE id=1').treasury-1e9-(scope==='family'?r.body.ammoUsed*50:0);
 }
 results.push({rank:progression(xp).rank,careerLevel:tier.level,tier:tier.id,scope,samples:300,successes,personalNet:Math.round(personalNet/300),familyNet:Math.round(familyNet/300),combinedNet:Math.round((personalNet+familyNet)/300),energy:tier.energy,ammoCost:offer.supplies.ammo*50,stake:offer.cost});close();
}
writeFileSync('art/economy-shipments.json',JSON.stringify({method:'Controlled 300-attempt samples per scenario via real handlers. Rank and career XP held constant at scenario thresholds, stocked required weapons. Net includes all entry costs and consumed rounds at replacement price $50. No escorts, donation perks or holdings; weapon capital costs excluded. These are comparison samples, not the new-account progression playtest.',results},null,2));console.log(JSON.stringify(results,null,2));
