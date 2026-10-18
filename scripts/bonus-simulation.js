import {shopProducts} from '../shop.js';
// Five independent disposable worlds; no live database, network or wall-clock waiting.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fixture} from '../test/helpers/game-fixture.js';
import {progression,ranks,passiveMultiplier} from '../progression.js';
import {career} from '../empire-catalog.js';
import {catalog,purchasePrice} from '../catalog.js';
import {employees} from '../city-expansion.js';
const days=Number(process.argv[2]||180);assert.ok(Number.isInteger(days)&&days>=1&&days<=180);
const profiles=[{name:'No membership or marriage'},{name:'Marriage',marry:true},{name:'Supporter',product:'supporter'},{name:'Supporter + marriage',product:'supporter',marry:true},{name:'Grand Supporter + marriage',product:'grand-supporter',marry:true}];
const results=[];
const prefix=process.env.SIM_OUTPUT||'bonus';
for(const [index,config] of profiles.entries()){
 if(process.env.SIM_PROFILE!==undefined&&index!==Number(process.env.SIM_PROFILE))continue;
 let close,state=Number(process.env.SIM_SEED||20261014),sequence=0;const f=fixture({after:fn=>close=fn},false);
 const random=(min,max)=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return min+state%(max-min+1)};f.dice(()=>random(0,9999));f.high(random);
 const start=Date.UTC(2026,9,19,0);f.advance(start-f.time());
 f.run("INSERT INTO users(id,username,email,password,cash,bank,xp,energy,health,city,created_at,energy_at,health_at) VALUES(5,'SimPlayer','simulation@mafia.invalid','disabled',5000,0,0,100,100,'New York',?,?,?)",start,start,start);f.call('armory',undefined,5);
 const totals={income:0,expenses:0,packCash:0,packXp:0,passive:0,crimeAttempts:0,crimeSuccesses:0,shipments:0,shipmentSuccesses:0,byActivity:{}};const milestones={};const snapshots=[];
 const cash=()=>f.q('SELECT cash FROM users WHERE id=5').cash;
 const account=()=>{const before=cash(),u=f.settle(5),delta=u.cash-before;totals.passive+=delta;totals.income+=delta;return u};
 function act(path,body,id=5){if(id===5)account();const before=cash(),r=f.call(path,{...body,key:'simulation-key-'+(++sequence),requestKey:'simulation-key-'+sequence},id),delta=cash()-before;if(path==='admin/shop/grant'&&r.status===200){totals.packCash+=delta;totals.packXp+=shopProducts.find(p=>p.id===config.product).xp;}else{if(delta>0)totals.income+=delta;else totals.expenses-=delta;const bucket=totals.byActivity[path]||={income:0,cost:0,count:0};bucket.income+=Math.max(0,delta);bucket.cost+=Math.max(0,-delta);bucket.count+=Number(r.status<300);}if(r.status>=500)throw Error(JSON.stringify(r));return r;}
 const get=path=>{const r=f.call(path,undefined,5);assert.equal(r.status,200,path+': '+JSON.stringify(r));return r.body;};
 function snapshot(day){const u=account(),arm=get('armory'),p=progression(u.xp);const assets=f.db.prepare('SELECT * FROM possessions WHERE user_id=5').all();const propertyValue=assets.reduce((n,a)=>n+(catalog.find(c=>c.id===a.item_id)?.price||0)*a.quantity,0);const employeeValue=f.db.prepare('SELECT * FROM employees WHERE user_id=5').all().reduce((n,a)=>n+(employees.find(c=>c.id===a.item_id)?.price||0)*a.quantity,0);const fam=f.q('SELECT f.* FROM families f JOIN family_members m ON m.family_id=f.id WHERE m.user_id=5');
  assert.equal(u.cash,5000+totals.packCash+totals.income-totals.expenses,'Cash ledger day '+day);
  const row={day,cash:u.cash,bank:u.bank,xp:u.xp,rank:p.rank,distinctions:p.distinctions,propertyValue,weaponValue:arm.weaponValue,employeeValue,personalValue:u.cash+u.bank+propertyValue+arm.weaponValue+employeeValue,energy:u.energy,power:arm.power.total,drugs:career('drugs',u.drugs_xp).level,guns:career('guns',u.guns_xp).level,familyDrugs:fam?career('drugs',fam.drugs_xp).level:0,familyGuns:fam?career('guns',fam.guns_xp).level:0,familyTreasury:fam?.treasury||0,packCash:totals.packCash,packXp:totals.packXp,income:totals.income,expenses:totals.expenses,netCashFlow:totals.income-totals.expenses,passive:totals.passive};snapshots.push(row);
 }
 // Day 0 is before pack grants, to make the shared starting state explicit.
 snapshot(0);
 for(let day=0;day<days;day++){
  // Monthly packs renewed only in this comparison, with every grant separately recorded.
  if(config.product&&day%30===0){const r=act('admin/shop/grant',{recipient:'SimPlayer',product:config.product,reason:'Isolated simulation monthly pack'},1);if(r.status===409){(milestones.blockedRenewals||=[]).push(day+1);}else assert.equal(r.status,200,JSON.stringify(r));}
  for(let session=0;session<4;session++){
   const sessionTime=start+day*86400000+session*6*3600000;f.advance(sessionTime-f.time());
   for(let minute=0;minute<30;minute++){
    let u=account();if(Math.max(u.prison_until,u.coma_until,u.hospital_until)>f.time()){f.advance(60000);continue;}
    let arm=get('armory');
    if(arm.ammo<100&&u.cash>3000){act('armory/buy',{scope:'personal',kind:'ammo',quantity:Math.min(1000,Math.floor(u.cash*.1/arm.ammoPrice))});arm=get('armory');u=account();}
    const weapon=arm.weapons.filter(w=>w.tier>arm.tier&&w.price<u.cash*.2).sort((a,b)=>a.price-b.price)[0];if(weapon){act('armory/buy',{scope:'personal',kind:'weapon',item:weapon.id,quantity:1});arm=get('armory');u=account();}
    let acted=false;
    if(minute<2){const kind=minute===0?'drugs':'guns',fam=f.q('SELECT family_id FROM family_members WHERE user_id=5');let scope=fam?'family':'personal';
     if(fam){const fa=get('armory?scope=family'),treasury=f.q('SELECT treasury FROM families WHERE id=?',fam.family_id).treasury;if(fa.ammo<100&&treasury>3000)act('armory/buy',{scope:'family',kind:'ammo',quantity:100});const w=fa.weapons.filter(w=>w.tier>fa.tier&&w.price<treasury*.1).sort((a,b)=>a.price-b.price)[0];if(w)act('armory/buy',{scope:'family',kind:'weapon',item:w.id,quantity:1});if(!fa.tier)scope='personal';}
     const supply=scope==='family'?get('armory?scope=family'):arm;
     const offers=get('empire').shipments.filter(s=>s.kind===kind&&s.scope===scope&&!s.locked&&s.energy<=u.energy&&s.supplies.tier<=supply.tier&&s.supplies.ammo<=supply.ammo&&s.personalCost<u.cash*.1&&(!fam||s.familyCost<f.q('SELECT treasury FROM families WHERE id=?',fam.family_id).treasury*.1));const offer=offers.at(-1);
     if(offer){const r=act('shipments/run',{kind,scope,tier:offer.id});if(r.status===200){acted=true;totals.shipments++;totals.shipmentSuccesses+=Number(r.body.success);}}
    }
    if(!acted){u=account();const offers=get('catalog').crimes.filter(c=>!c.locked&&c.requiredXp<=u.xp&&c.energy<=u.energy&&c.supplies.tier<=arm.tier&&c.supplies.ammo<=arm.ammo&&!(f.q('SELECT available_at FROM actions WHERE user_id=5 AND kind=?',c.id)?.available_at>f.time())).sort((a,b)=>(b.payout.min*b.chance-b.supplies.ammo*25)/b.energy-(a.payout.min*a.chance-a.supplies.ammo*25)/a.energy);if(offers.length){f.big(random(0,9999));const r=act('action',{kind:offers[0].id});if(r.status===200){totals.crimeAttempts++;totals.crimeSuccesses+=Number(r.body.success);}}}
    f.advance(60000);
   }
   const board=get('daily');for(const j of board.jobs.filter(j=>!j.claimed&&j.progress>=j.target))act('daily/claim',{day:board.day,job:j.id});
   for(const m of get('achievements').milestones.filter(m=>m.earnedAt&&!m.xpClaimed))act('achievements/claim',{milestone:m.id});
   let u=account();
   if(config.marry&&!milestones.marriageDay&&u.cash>=6000000){const invite=act('marriage/invite',{target:'Outsider'});if(invite.status===200){const proposal=f.call('marriage',undefined,4).body.invitations.find(i=>i.sender_id===5);if(proposal){const accepted=act('marriage/respond',{id:proposal.id,action:'accept'},4);if(accepted.status===200)milestones.marriageDay=day+1;}}}
   u=account();if(!f.q('SELECT 1 FROM family_members WHERE user_id=5')&&u.cash>3000000){const created=act('families',{name:'Simulation Family'});if(created.status===201)milestones.familyDay=day+1;}
   const family=f.q('SELECT f.* FROM families f JOIN family_members m ON m.family_id=f.id WHERE m.user_id=5');u=account();if(family&&family.treasury<u.cash*.1&&u.cash>1e6)act('family/donate',{amount:Math.floor(u.cash*.05)});
   u=account();const businesses=catalog.filter(c=>c.category==='business'&&purchasePrice(c,f.q('SELECT quantity FROM possessions WHERE user_id=5 AND item_id=?',c.id)?.quantity||0)<u.cash*.2&&(f.q('SELECT quantity FROM possessions WHERE user_id=5 AND item_id=?',c.id)?.quantity||0)<10).sort((a,b)=>b.income/b.price-a.income/a.price);if(businesses[0]){const r=act('assets/buy',{id:businesses[0].id,category:'business',quantity:1});if(r.status===201&&!milestones.businessDay)milestones.businessDay=day+1;}
   u=account();const hire=employees.find(e=>e.income>0&&e.price<u.cash*.1&&(f.q('SELECT quantity FROM employees WHERE user_id=5 AND item_id=?',e.id)?.quantity||0)<e.limit);if(hire)act('employees/hire',{item:hire.id,quantity:Math.min(hire.limit-(f.q('SELECT quantity FROM employees WHERE user_id=5 AND item_id=?',hire.id)?.quantity||0),Math.floor(u.cash*.1/hire.price))});
   const p=progression(account().xp);if(p.rank==='The Godfather'&&!milestones.godfatherDay)milestones.godfatherDay=day+1;
  }
  f.advance(start+(day+1)*86400000-f.time());if((day+1)%5===0||day===days-1)snapshot(day+1);
  if((day+1)%30===0)console.error(config.name+': '+JSON.stringify(snapshots.at(-1)));
 }
 results.push({profile:config,seed:Number(process.env.SIM_SEED||20261014),milestones,totals,snapshots});writeFileSync('art/'+prefix+'-profile-'+index+'-'+days+'d.json',JSON.stringify(results.at(-1),null,2));close();
}
const report={days,economy:{godfatherXp:ranks.at(-1).xp,godfatherIncome:ranks.at(-1).incomeMultiplier,legacyMaximum:progression(1e12).incomeMultiplier,passiveMaximum:passiveMultiplier(1e12)},method:'Five isolated fresh accounts; four 30-minute sessions every six hours (two hours/day), one action opportunity per minute. Real server handlers, seeded random outcomes, calendar Sundays for everyone, normal detention/costs/ammo, daily and achievement claims. No PvP, casino, respect farming, team missions or external donations. Marriage purchased only once affordable; spouse supplies consent, no funding. Family founded and funded from earned money. Supporter packs renewed each 30 days in this comparison, including their stated cash/XP grants; live bots get only one month. Catalog-base asset valuation; purchases are cash outflow, not destroyed wealth. This is a strategy comparison, not a prediction or all-bonus maximum.',results};
mkdirSync('art',{recursive:true});writeFileSync('art/'+prefix+'-simulation-'+days+'d'+(process.env.SIM_PROFILE!==undefined?'-profile-'+process.env.SIM_PROFILE:'')+'.json',JSON.stringify(report,null,2));
const columns=['profile',...Object.keys(results[0].snapshots[0])];const rows=results.flatMap(r=>r.snapshots.map(s=>({profile:r.profile.name,...s})));writeFileSync('art/'+prefix+'-simulation-'+days+'d'+(process.env.SIM_PROFILE!==undefined?'-profile-'+process.env.SIM_PROFILE:'')+'.csv',[columns.join(','),...rows.map(row=>columns.map(k=>JSON.stringify(row[k])).join(','))].join('\n'));
console.log(JSON.stringify(results.map(r=>({profile:r.profile.name,milestones:r.milestones,final:r.snapshots.at(-1)})),null,2));
