// Deterministic, disposable simulation through the real game handlers; never opens live data.
import assert from 'node:assert/strict';
import {fixture} from '../test/helpers/game-fixture.js';
import {writeFileSync} from 'node:fs';
import {progression,passiveMultiplier} from '../progression.js';
import {catalog} from '../catalog.js';
const simulationDays=Number(process.argv[2]||14);
assert.ok(Number.isInteger(simulationDays)&&simulationDays>=1&&simulationDays<=180);
const results=[];
for(const seed of (process.env.SIM_SEEDS?process.env.SIM_SEEDS.split(',').map(Number):[17,42,91,123,777])){
 let close;const f=fixture({after:fn=>close=fn},false);let state=seed,seq=0;
 const rand=(min,max)=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return min+state%(max-min+1)};
 f.dice(()=>rand(0,9999));f.high(rand);f.advance(Date.UTC(2026,9,12,8)-f.time());
 // A newly registered player: no XP, no family, $5,000 and the standard one-time kit.
 f.run("INSERT INTO users(id,username,email,password,cash,bank,xp,energy,health,heat,created_at,energy_at,health_at) VALUES(5,'NewPlayer','new@example.invalid','test',5000,0,0,100,100,0,?,?,?)",f.time(),f.time(),f.time());
 f.call('armory',undefined,5);
 const totals={crimeGross:0,fines:0,ammo:0,daily:0,passive:0,purchases:0,attempts:0,successes:0};let firstBusiness=null;const days=[];
 for(let day=0;day<simulationDays;day++){
  const end=f.time()+2*3600000;
  while(f.time()<end){
   const old=f.q('SELECT cash FROM users WHERE id=5').cash,u=f.settle(5);totals.passive+=u.cash-old;
   if(u.prison_until>f.time()||u.coma_until>f.time()){f.advance(60000);continue;}
   let inventory=f.call('armory',undefined,5).body;
   if(inventory.ammo<20&&u.cash>=1000){const r=f.call('armory/buy',{scope:'personal',kind:'ammo',quantity:20,requestKey:'simulation-'+seed+'-'+(++seq)},5);if(r.status===200){totals.ammo+=r.body.cost??1000;inventory=f.call('armory',undefined,5).body;}}
   const offer=f.call('catalog',undefined,5).body.crimes.filter(c=>!c.locked&&u.xp>=c.requiredXp&&c.energy<=u.energy&&c.supplies.tier<=inventory.tier&&c.supplies.ammo<=inventory.ammo&&!(f.q('SELECT available_at FROM actions WHERE user_id=5 AND kind=?',c.id)?.available_at>f.time())).sort((a,b)=>(b.payout.min*b.chance-b.supplies.ammo*50)/b.energy-(a.payout.min*a.chance-a.supplies.ammo*50)/a.energy)[0];
   if(offer){f.big(rand(0,9999));const r=f.call('action',{kind:offer.id},5);if(r.status===200){totals.attempts++;totals.successes+=Number(r.body.success);totals.crimeGross+=r.body.reward;totals.fines+=r.body.fine||0;}}
   const board=f.call('daily',undefined,5).body;for(const job of board.jobs.filter(j=>!j.claimed&&j.progress>=j.target)){const r=f.call('daily/claim',{day:board.day,job:job.id},5);if(r.status===200)totals.daily+=r.body.reward;}
   if(!f.q("SELECT 1 FROM possessions WHERE user_id=5 AND item_id='coffee'")&&f.q('SELECT cash FROM users WHERE id=5').cash>=125000){const r=f.call('assets/buy',{category:'business',id:'coffee'},5);if(r.status===201){totals.purchases+=r.body.cost;firstBusiness={day:day+1,minutes:Math.round((f.time()-Date.UTC(2026,9,12,8))/60000)};}}
   const a=inventory;if(a.tier===1&&f.q('SELECT cash FROM users WHERE id=5').cash>=1510000){const r=f.call('armory/buy',{scope:'personal',kind:'weapon',item:'crew-smg',requestKey:'simulation-'+seed+'-'+(++seq)},5);if(r.status===200)totals.purchases+=1500000;}
   f.advance(60000);
  }
  for(const m of f.call('achievements',undefined,5).body.milestones.filter(m=>m.earnedAt&&!m.xpClaimed)){const claim=f.call('achievements/claim',{milestone:m.id},5);assert.ok([200,409].includes(claim.status),JSON.stringify(claim));}
  const previous=f.q('SELECT cash FROM users WHERE id=5').cash,u=f.settle(5);totals.passive+=u.cash-previous;days.push({day:day+1,cash:u.cash,xp:u.xp,rank:progression(u.xp).rank,distinctions:progression(u.xp).distinctions,totals:{...totals}});if(day<simulationDays-1)f.advance(22*3600000);
 }
 const user=f.q('SELECT cash,xp FROM users WHERE id=5');assert.equal(user.cash,5000+totals.crimeGross-totals.fines-totals.ammo+totals.daily+totals.passive-totals.purchases,'Cash ledger must reconcile for seed '+seed);console.error('Completed seed '+seed);results.push({seed,firstBusiness,totals,netCrime:totals.crimeGross-totals.fines-totals.ammo,final:user,days});close();
}
const coffee=catalog.find(x=>x.id==='coffee');const report={method:results.length+' deterministic fresh accounts; '+simulationDays+' simulated days; two active hours/day, minute-by-minute actions; real handlers, seeded randomness, standard starter kit, daily crime rewards and one-time achievement XP; no staff grants, donations, gifts, casino or PvP. Purchases: first coffeeshop and tier-2 weapon when affordable. In-game wait time is advanced, not real elapsed time.',results,passivePayback:[0,110000,1350000].map(xp=>({rank:progression(xp).rank,hourly:Math.floor(coffee.income*passiveMultiplier(progression(xp).incomeMultiplier)),hours:coffee.price/(coffee.income*passiveMultiplier(progression(xp).incomeMultiplier))}))};
writeFileSync(simulationDays===14?'art/economy-playtest.json':'art/economy-v2-'+simulationDays+'d'+(process.env.SIM_SEEDS?'-pilot':'')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({results:results.map(({days,...r})=>r),passivePayback:report.passivePayback},null,2));
