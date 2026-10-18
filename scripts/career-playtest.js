// Isolated career cadence study: prepared weapons/funding; no claim about earned wealth.
import assert from 'node:assert/strict';
import {fixture} from '../test/helpers/game-fixture.js';
import {writeFileSync} from 'node:fs';
import {career} from '../empire-catalog.js';
const results=[];
for(const scope of ['personal','family'])for(const seed of [17,42,91,123,777]){
 let close,state=seed;const f=fixture({after:fn=>close=fn});f.run('UPDATE users SET xp=0');
 f.dice(()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%10000});
 const days=[],connect={};let runs=0,successes=0;
 for(let day=1;day<=120;day++){
  for(let session=0;session<4;session++){
   for(const kind of ['drugs','guns']){
    // Refill replacement ammunition, charging the correct wallet, from the prepared budget.
    const owner=scope==='family'?1:2,acct=f.q('SELECT ammo FROM armory_accounts WHERE scope=? AND owner_id=?',scope,owner);
    if(acct.ammo<60){f.run('UPDATE armory_accounts SET ammo=ammo+1000 WHERE scope=? AND owner_id=?',scope,owner);if(scope==='family')f.run('UPDATE families SET treasury=treasury-50000 WHERE id=1');else f.run('UPDATE users SET cash=cash-50000 WHERE id=2');}
    const offer=f.call('empire',undefined,2).body.shipments.filter(s=>s.scope===scope&&s.kind===kind&&!s.locked).at(-1);
    const r=f.call('shipments/run',{scope,kind,tier:offer.id},2);assert.equal(r.status,200,JSON.stringify(r));runs++;successes+=Number(r.body.success);
    if(r.body.personalRank.level===15&&!connect[kind])connect[kind]=day;
    if(scope==='family'){assert.equal(r.body.personalRank.currentXp,r.body.familyRank.currentXp);if(r.body.familyRank.level===15&&!connect['family_'+kind])connect['family_'+kind]=day;}
   }
   f.advance(6*3600000);
  }
  const u=f.q('SELECT drugs_xp,guns_xp FROM users WHERE id=2');days.push({day,drugs:career('drugs',u.drugs_xp),guns:career('guns',u.guns_xp)});
 }
 results.push({scope,seed,connect,runs,successes,days});close();
}
writeFileSync('art/career-playtest.json',JSON.stringify({method:'Four attempts per career per day, in four six-hour-spaced sessions. Both careers start at zero. Isolated prepared-budget study with required weapons and replacement ammunition; no escorts, family assets or donor bonuses. Normal rank held at Outsider. Family mode uses one contributor, sharing every run and earning the same personal and family XP. Larger active families advance faster. This is separate from the two-hour crime economy study.',results},null,2));
console.log(JSON.stringify(results.map(({days,...r})=>r),null,2));
