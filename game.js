import {installIncomeCycles} from './income-cycle.js';
import {installReferrals} from './referrals.js';
import {installMidnightCircuit} from './midnight-circuit.js';
import {installArtMarket} from './art-market.js';

import {installVehicles} from './vehicles.js';

import {installBribery} from './bribery.js';

import {bankMove} from './bank.js';

import {botCapabilities,botCommandBoundaries} from './bot-capabilities.js';

import {installTerritoryIncome} from './territory-income.js';

import {MAX_CASH,MAX_XP,drawAmount} from './money.js';

import {installBotSchema} from './bot-players.js';

import {sundayBonus,sundayEvent} from './calendar-events.js';

import {installCrewOperations} from './crew-operations.js';

import {guideAnswer} from './game-guide.js';

import {installCasinoExtra} from './casino-extra.js';

import {installCityExpansion} from './city-expansion.js';

import {installPlayerSystems,liquidationChance,backfireChance} from './player-systems.js';

import {installPresence} from './presence.js';

import {installPlayerCare} from './player-care.js';

import {installEconomy} from './economy.js';

import {installShop} from './shop.js';

import {installLegacy} from './legacy.js';

import {order} from './purchases.js';

import {installCasino} from './casino.js';

import {installDaily} from './daily.js';

import {AMMO_PRICE,installLogistics,operationSupply} from './logistics.js';

import {guardStaff,isStaff} from './staff.js';

import {installCommunity,familyCapacity} from './community.js';

import {installProfiles} from './profiles.js';

import {installUnderworld,detained,personalRespect} from './underworld.js';

import {installTransfers} from './transfers.js';

import {familyAssets,mysteryJobs} from './empire-catalog.js';

import {installOwnerAdmin} from './owner-admin.js';

import {installEmpire} from './empire.js';

import { randomInt } from 'node:crypto';

import { assetLimit, ENERGY_LIMIT, catalog, crimes, pvpActions, ownershipBenefits, purchasePrice, ranks } from './catalog.js';

import { progression, passiveMultiplier } from './progression.js';



export const MAX_MONEY = MAX_CASH;

export function installGame(db, { hash, log, json, onNotify=()=>{}, bribeRoll = () => randomInt(10000), bigScoreRoll = () => randomInt(10000), roll = () => randomInt(10000), draw = drawAmount, clock = () => Date.now() }) {

  const q = (sql,...args)=>db.prepare(sql).get(...args);

  const all = (sql,...args)=>db.prepare(sql).all(...args);

  const run = (sql,...args)=>db.prepare(sql).run(...args);

  let savepoint=0;

  const transaction = fn => {

    if(db.isTransaction){const name='game_'+(++savepoint);db.exec('SAVEPOINT '+name);try{const result=fn();db.exec('RELEASE '+name);return result}catch(error){db.exec('ROLLBACK TO '+name);db.exec('RELEASE '+name);throw error}}

    db.exec('BEGIN IMMEDIATE');

    try { const result=fn(); db.exec('COMMIT'); return result; }

    catch(error) { db.exec('ROLLBACK'); throw error; }

  };

  const fail = (message,status=400)=>{ throw Object.assign(new Error(message),{status}); };

  const integer = (value,min=0,max=MAX_MONEY)=>Number.isSafeInteger(value)&&value>=min&&value<=max;

  if(all('PRAGMA table_info(users)').some(c=>c.name==='role'))db.exec("UPDATE users SET role='player' WHERE role='moderator'");

  const columns=new Set(all('PRAGMA table_info(users)').map(x=>x.name));

  transaction(()=>{

    for(const name of ['energy_at','health_at','hospital_until','protected_until','captured_until','coma_until','prison_until','justice_protected_until','report_until','breakout_until','respect_received','pending_income','income_claim_at']) {

      if(!columns.has(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} INTEGER NOT NULL DEFAULT 0`);

    }

    if(!columns.has('selected_title'))db.exec("ALTER TABLE users ADD COLUMN selected_title TEXT NOT NULL DEFAULT ''");

    const time=clock();

    run('UPDATE users SET energy_at=? WHERE energy_at=0',time);

    run('UPDATE users SET health_at=? WHERE health_at=0',time);

    db.exec(`CREATE TABLE IF NOT EXISTS possessions(

      user_id INTEGER NOT NULL REFERENCES users(id),category TEXT NOT NULL CHECK(category IN ('business','car','home','helicopter','jet','garage','yacht')),

      item_id TEXT NOT NULL,acquired_at INTEGER NOT NULL,income_at INTEGER NOT NULL,

      PRIMARY KEY(user_id,category,item_id));

      CREATE TABLE IF NOT EXISTS owner_audit(id INTEGER PRIMARY KEY,actor_id INTEGER NOT NULL REFERENCES users(id),

      target_id INTEGER NOT NULL REFERENCES users(id),details TEXT NOT NULL,created_at INTEGER NOT NULL);

      CREATE TABLE IF NOT EXISTS promotion_notifications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),details TEXT NOT NULL);

      CREATE INDEX IF NOT EXISTS promotions_user ON promotion_notifications(user_id,id);

      CREATE INDEX IF NOT EXISTS messages_recipient ON messages(recipient_id,id);

      CREATE INDEX IF NOT EXISTS events_user ON events(user_id,id);`);

    if(!q("SELECT sql FROM sqlite_master WHERE name='possessions'").sql.includes("'yacht'")) {

      const fields=all('PRAGMA table_info(possessions)').map(x=>x.name);

      db.exec(`ALTER TABLE possessions RENAME TO possessions_legacy;

        CREATE TABLE possessions(user_id INTEGER NOT NULL REFERENCES users(id),category TEXT NOT NULL CHECK(category IN ('business','car','home','helicopter','jet','garage','yacht')),item_id TEXT NOT NULL,acquired_at INTEGER NOT NULL,income_at INTEGER NOT NULL,income_remainder INTEGER NOT NULL DEFAULT 0,quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity BETWEEN 1 AND 100),PRIMARY KEY(user_id,category,item_id));

        INSERT INTO possessions SELECT user_id,category,item_id,acquired_at,income_at,${fields.includes('income_remainder')?'income_remainder'+(fields.includes('quantity')?'':'*100'):'0'},${fields.includes('quantity')?'quantity':'1'} FROM possessions_legacy;

        DROP TABLE possessions_legacy;`);

    }

    if(!all('PRAGMA table_info(possessions)').some(x=>x.name==='income_remainder'))db.exec('ALTER TABLE possessions ADD COLUMN income_remainder INTEGER NOT NULL DEFAULT 0');

    if(!all('PRAGMA table_info(possessions)').some(x=>x.name==='quantity')){

      db.exec('ALTER TABLE possessions ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity BETWEEN 1 AND 100)');

      db.exec('UPDATE possessions SET income_remainder=income_remainder*100');

    }

  });



  if(!all('PRAGMA table_info(possessions)').some(x=>x.name==='elapsed_remainder'))db.exec('ALTER TABLE possessions ADD COLUMN elapsed_remainder INTEGER NOT NULL DEFAULT 0');

  // Discard surplus holdings under the current collection limits.

  transaction(()=>{

    db.exec('CREATE TABLE IF NOT EXISTS archived_possessions(user_id INTEGER,category TEXT,item_id TEXT,quantity INTEGER NOT NULL,archived_at INTEGER NOT NULL,PRIMARY KEY(user_id,category,item_id))');

    db.exec("DROP TRIGGER IF EXISTS possession_limit_insert; DROP TRIGGER IF EXISTS possession_limit_update;");

    for(const a of all("SELECT * FROM possessions WHERE quantity>CASE WHEN item_id IN ('vehicle-warehouse','production-warehouse') THEN 5 WHEN category='business' THEN 10 ELSE 1 END")){

      const limit=assetLimit(a);



      run('UPDATE possessions SET quantity=? WHERE user_id=? AND category=? AND item_id=?',limit,a.user_id,a.category,a.item_id);

    }

    for(const event of ['INSERT','UPDATE'])db.exec(`CREATE TRIGGER possession_limit_${event.toLowerCase()} BEFORE ${event} ON possessions WHEN NEW.quantity>CASE WHEN NEW.item_id IN ('vehicle-warehouse','production-warehouse') THEN 5 WHEN NEW.category='business' THEN 10 ELSE 1 END BEGIN SELECT RAISE(ABORT,'Collection limit: ten per business, one per other asset'); END;`);



  });

  let playerSystems=null,expansion=null,art=null,circuit=null;

  const supporterBonus=id=>shop.bonus(id)*sundayBonus(clock());

  const passiveSupporter=(id,from,to)=>{const active=Math.max(0,to-from-underworld.blockedMillis(id,from,to));if(!active)return 1;const m=q('SELECT m.tier,m.expires_at,g.created_at FROM supporter_memberships m JOIN shop_grants g ON g.id=m.grant_id WHERE m.user_id=?',id);let weighted=0;for(let start=from;start<to;){const end=Math.min(to,(Math.floor(start/86400000)+1)*86400000,...[m?.created_at,m?.expires_at].filter(x=>x>start));const elapsed=Math.max(0,end-start-underworld.blockedMillis(id,start,end));weighted+=elapsed*sundayBonus(start)*(m&&start>=m.created_at&&start<m.expires_at?(m.tier==='gold'?1.25:1.10):1);start=end;}return weighted/active;};

  const marriageBonus=id=>(playerSystems?.bonus(id)||1)*supporterBonus(id);

  const benefits=id=>{

    const u=q('SELECT xp,respect_received FROM users WHERE id=?',id),perks=ownershipBenefits(owned(id)),standing=progression(u.xp),respect=personalRespect(u.respect_received);const employeeIncome=expansion?.stats(id).income||0;perks.income+=employeeIncome;standing.incomeMultiplier*=1+respect.incomeBonus;standing.incomeMultiplier*=1+(art?.bonuses(id).income||0);const marriage=marriageBonus(id),passive=passiveMultiplier(standing.incomeMultiplier)*marriage;standing.incomeMultiplier*=marriage;

    return {...perks,...standing,marriageBonus:marriage,titles:[...(circuit?circuit.titles(id):[]),...(art?.bonuses(id).title?[{id:"art:collection",name:art.bonuses(id).title}]:[]),...perks.titles,...legacy.titles(id),...shop.titles(id)],respect,energyMax:Math.min(ENERGY_LIMIT,perks.energyMax+standing.rankEnergyBonus),baseIncome:perks.income,passiveIncomeMultiplier:passive,income:Math.min(MAX_MONEY,Math.floor((perks.income-employeeIncome)*passive+employeeIncome*marriage))};

  };

  function profile(user){

    logistics.ensure('personal',user.id);

    const perks=benefits(user.id);

    const title=perks.titles.find(x=>x.id===user.selected_title)||perks.titles.at(-1);

    return {marriage:playerSystems?.married(user.id)||null,supporter:shop.membership(user.id),power:logistics.personalPower(user.id),armory:logistics.inventory('personal',user.id),...progression(user.xp),incomeMultiplier:perks.incomeMultiplier,passiveIncomeMultiplier:perks.passiveIncomeMultiplier,respect:perks.respect,prison_until:user.prison_until,coma_until:user.coma_until,pending_income:user.pending_income,incomeClock:{serverTime:clock(),elapsed:incomeCycles.elapsed(user,clock(),perks.income>0),cap:86400000},detained:detained(user,clock()),benefits:perks,title:title?.name||'',selectedTitle:title?.id||'',promotion:pendingPromotion(user.id)};

  }

  function pendingPromotion(id){

    const row=q('SELECT * FROM promotion_notifications WHERE user_id=? ORDER BY id LIMIT 1',id);

    return row?{id:row.id,...JSON.parse(row.details)}:null;

  }

  // Invoked in the same transaction as the XP award, after its energy cost.

  function promote(id,previousXp,restore=true){

    const before=progression(previousXp),user=q('SELECT * FROM users WHERE id=?',id),after=progression(user.xp);

    const steps=after.rankLevel+after.distinctions-before.rankLevel-before.distinctions;

    if(steps<=0)return;

    const perks=benefits(id);

    if(restore)run('UPDATE users SET energy=MAX(energy,?),energy_at=? WHERE id=?',perks.energyMax,clock(),id);

    const details={rank:after.rank,distinctions:after.distinctions,steps,energyBonus:perks.energyMax-Math.min(ENERGY_LIMIT,ownershipBenefits(owned(id)).energyMax+before.rankEnergyBonus),energyMax:perks.energyMax,energyRestored:restore,

      incomePercent:(after.incomeMultiplier/before.incomeMultiplier-1)*100,

      passiveIncomePercent:(passiveMultiplier(after.incomeMultiplier)/passiveMultiplier(before.incomeMultiplier)-1)*100,

      chancePoints:(after.crimeChanceBonus-before.crimeChanceBonus)*100,

      unlocks:crimes.filter(c=>c.requiredXp>previousXp&&c.requiredXp<=user.xp).map(c=>({name:c.name,requires:c.requires||null,available:!crimeOffer(c,perks).locked}))};

    run('INSERT INTO promotion_notifications(user_id,details) VALUES(?,?)',id,JSON.stringify(details));

    log(id,'Promoted to '+after.rank+(after.distinctions?' · Legacy distinction '+after.distinctions:'')+'. Maximum energy is now '+perks.energyMax+(restore?'; energy fully restored.':'; Owner energy override applied.'));

  }

  function crimeOffer(spec,perks){

    const multiplier=Math.max(.1,Math.min(10,Number(q("SELECT value FROM settings WHERE key='crime_multiplier'")?.value)||1))*perks.incomeMultiplier*(1+perks.rewardBps/10000);

    const baseMin=Math.min(MAX_MONEY/2,Math.floor(spec.reward*multiplier)),baseMax=Math.min(MAX_MONEY/2,Math.floor(spec.reward*1.4*multiplier));

    const bonusMin=Math.max(1,Math.min(MAX_MONEY/2,Math.floor(spec.reward*.05*multiplier))),bonusMax=Math.max(bonusMin,Math.min(MAX_MONEY/2,Math.floor(spec.reward*.25*multiplier)));

    return {...spec,xp:Math.floor(spec.xp*perks.marriageBonus),supplies:operationSupply('crime',spec),chance:Math.min(.95,spec.chance+perks.crimeChanceBonus),cooldown:Math.round(spec.cooldown*(1-perks.cooldownBps/10000)),locked:!!spec.requires&&!perks.categories.includes(spec.requires)&&!(spec.requires==='car'&&perks.privateGarage),payout:{min:baseMin+bonusMin,max:baseMax+bonusMax,baseMin,baseMax,bonusMin,bonusMax}};

  }



  // Called inside a transaction. Fractional regeneration time is preserved.

  let economy=null;
  const incomeCycles=installIncomeCycles(db,{blockedMillis:(...args)=>underworld.blockedMillis(...args)});

  function settleRaw(...args){return economy?economy.withSource('passive',()=>settleRawImpl(...args)):settleRawImpl(...args)}

  function settleRawImpl(id,time=clock(),collect=true) {

    let user=q('SELECT * FROM users WHERE id=?',id);if(!user)return null;const perks=benefits(id);

    for(const [field,stamp,period,cap] of [['energy','energy_at',perks.energyInterval,perks.energyMax],['health','health_at',perks.healthInterval,100]]){

      if(field==='health'&&user.hospital_until>time){run('UPDATE users SET health_at=? WHERE id=?',time,id);continue;}

      if(!user[stamp]||user[field]>=cap)run('UPDATE users SET '+stamp+'=? WHERE id=?',time,id);

      else {const ticks=Math.max(0,Math.floor((time-user[stamp])/period));if(ticks){const value=Math.min(cap,user[field]+ticks);run('UPDATE users SET '+field+'=?,'+stamp+'=? WHERE id=?',value,value===cap?time:user[stamp]+ticks*period,id);}}

    }

    if(user.hospital_until>0&&user.hospital_until<=time){run('UPDATE users SET health=100,health_at=?,hospital_until=0,coma_until=0 WHERE id=?',time,id);underworld.notify(id,'Hospital stay completed','You have recovered. Income and activities are available again.','/images/scene-coma.jpg');}

    if(user.prison_until>0&&user.prison_until<=time){run('UPDATE users SET prison_until=0,justice_protected_until=MAX(justice_protected_until,?) WHERE id=?',user.prison_until+4*3600000,id);underworld.notify(id,'Sentence completed','You are free. Income and activities are available again.','/images/scene-breakout.jpg');}

    const incomeWindow=incomeCycles.window(user,time,perks.income>0);
    let earned=expansion?.accrue(id,time,perks.passiveIncomeMultiplier/supporterBonus(id),incomeWindow)||0;

    for(const asset of all('SELECT * FROM possessions WHERE user_id=?',id)){

      const item=catalog.find(x=>x.category===asset.category&&x.id===asset.item_id);if(!item)continue;

      const from=Math.max(asset.income_at,incomeWindow.from),end=Math.max(from,incomeWindow.to),elapsed=Math.max(0,end-from),blocked=underworld.blockedMillis(id,from,end),active=Math.max(0,elapsed-blocked)+(asset.elapsed_remainder||0),minutes=Math.floor(active/60000);

      const numerator=BigInt(minutes)*BigInt(item.income)*BigInt(asset.quantity)*BigInt(Math.round(perks.passiveIncomeMultiplier/supporterBonus(id)*passiveSupporter(id,from,end)*1000000))+BigInt(asset.income_remainder);

      earned=Math.min(MAX_MONEY,earned+Number(numerator/60000000n));

      run('UPDATE possessions SET income_at=?,elapsed_remainder=?,income_remainder=? WHERE user_id=? AND category=? AND item_id=?',time,active%60000,Number(numerator%60000000n),id,item.category,item.id);

    }

    run('UPDATE users SET pending_income=MIN(?,pending_income+?) WHERE id=?',MAX_MONEY,earned,id);

    user=q('SELECT * FROM users WHERE id=?',id);

    if(collect&&!detained(user,time)){const payout=Math.min(user.pending_income,MAX_MONEY-user.cash);if(payout>0){run('UPDATE users SET cash=cash+?,pending_income=pending_income-? WHERE id=?',payout,payout,id);if(payout===user.pending_income)incomeCycles.reset(id,time);}else if(!user.pending_income&&incomeWindow.elapsed>=86400000)incomeCycles.reset(id,time);}

    return q('SELECT * FROM users WHERE id=?',id);

  }

  const settle = (id,collect=true)=>transaction(()=>settleRaw(id,clock(),collect));

  const owned = id=>all('SELECT category,item_id,quantity,acquired_at FROM possessions WHERE user_id=?',id);

  function available(user) {

    if(user.prison_until>clock())fail('You are in prison. Arrange bail or wait for release.',409);

    if(user.hospital_until>clock()) fail('You are recovering in hospital.',409);

    if(user.captured_until>clock()) fail('You are being held. Wait for your release.',409);

    if(user.health<10) fail('You need at least 10 health. Health recovers automatically.',409);

  }

  function ready(id,kind) {

    const until=q('SELECT available_at FROM actions WHERE user_id=? AND kind=?',id,kind)?.available_at||0;

    if(until>clock()) fail(`Wait ${Math.ceil((until-clock())/1000)} seconds.`,429);

  }

  const cooldown=(id,kind,ms)=>run('INSERT INTO actions(user_id,kind,available_at) VALUES(?,?,?) ON CONFLICT(user_id,kind) DO UPDATE SET available_at=excluded.available_at',id,kind,clock()+ms);

  function act(id,kind,body={}) {

    const spec=crimes.find(x=>x.id===kind);

    if(!spec) fail('Unknown action');

    return transaction(()=>{

      const user=settleRaw(id); available(user); ready(id,kind);

      if(kind==='car')vehicles.assertResolved(id);

      const offer=crimeOffer(spec,benefits(id));

      if(offer.locked)fail(`Purchase a ${spec.requires} to unlock this operation.`,403);

      if(user.energy<spec.energy) fail('Not enough energy. Your energy regenerates automatically.',429);

      if(user.xp<spec.requiredXp) fail(`Requires ${spec.requiredXp} XP.`,403);

      if(kind==='hit'){

        const rounds=body.rounds===undefined?offer.supplies.ammo:body.rounds;

        if(!integer(rounds,offer.supplies.ammo,10000))fail('Choose '+offer.supplies.ammo+'–10,000 liquidation contract rounds.');

        offer.chance+=(1-offer.chance)*.8*(1-Math.exp(-(rounds-offer.supplies.ammo)/1500));offer.supplies.ammo=rounds;

      }

      const ammoUsed=logistics.consume(id,'personal',offer.supplies);

      const bigScore=bigScoreRoll()<500,success=roll()<offer.chance*10000||bigScore;

      const bonus=draw(offer.payout.bonusMin,offer.payout.bonusMax);

      const rolled=((success?draw(offer.payout.baseMin,offer.payout.baseMax):0)+bonus)*(bigScore?3:1);

      const reward=kind==='car'&&success?0:Math.min(MAX_MONEY-user.cash,rolled);

      const xp=Math.min(MAX_XP-user.xp,Math.floor((success?spec.xp:20)*(bigScore?3:1)*marriageBonus(id)));

      run('UPDATE users SET cash=MIN(?,cash+?),xp=MIN(?,xp+?),energy=energy-?,heat=MIN(100,heat+?) WHERE id=?',MAX_MONEY,reward,MAX_XP,xp,spec.energy,success?5:12,id);

      const healthLost=!success&&['hit','hostage','mugging','assault'].includes(kind)?Math.min(user.health-1,kind==='hit'?25:15):0;if(healthLost)run('UPDATE users SET health=health-?,health_at=? WHERE id=?',healthLost,clock(),id);

      promote(id,user.xp);

      cooldown(id,kind,offer.cooldown);

      let fine=0,prisonMinutes=0;

      if(!success){

        const severity=crimes.indexOf(spec)/(crimes.length-1);

        if(draw(1,100)<=45+Math.floor(user.heat/4)){prisonMinutes=5+Math.round(55*severity**1.5);underworld.detain(id,'prison',prisonMinutes*60000,Math.max(50000,prisonMinutes*100000),spec.name+' failed. Arrested for '+prisonMinutes+' minutes.');}

        else {fine=Math.min(q('SELECT cash FROM users WHERE id=?',id).cash,Math.max(1000,Math.floor(offer.payout.max*draw(2,8)/100)));run('UPDATE users SET cash=cash-? WHERE id=?',fine,id);}

      }

      run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(?,?,?,?)',id,'crime',success?1:0,clock());

      if(bigScore)run('INSERT INTO crime_big_scores(user_id,crime,reward,xp,created_at) VALUES(?,?,?,?,?)',id,kind,reward,xp,clock());

      log(id,`${bigScore?'BIG SCORE! ':''}${spec.name}: ${success?'success':'unsuccessful'} · $${reward} earned, including extra loot (+${xp} XP).${prisonMinutes?' Arrested for '+prisonMinutes+' minutes.':fine?' Fine: $'+fine+'.':''}`);

      const bribe=prisonMinutes?bribery.offer(id,{label:spec.name,referenceCash:(offer.payout.min+offer.payout.max)/2}):null;

      const recovered=kind==='car'&&success?vehicles.theft(id,user.city,bigScore?3:1):null;

      return {bribe,vehicle:recovered,success,bigScore,ammoUsed,reward,healthLost,fine,prisonMinutes,message:bigScore?'BIG SCORE! Triple payout and XP.':success?'Crime succeeded.':prisonMinutes?'Crime failed. Arrested for '+prisonMinutes+' minutes.':'Crime failed. Fine: $'+fine+'.',image:bribe?.image||recovered?.image||(prisonMinutes?'/images/scene-arrest.jpg':spec.image),bonus:Math.min(bonus*(bigScore?3:1),reward),xp,cooldown:offer.cooldown};

    });

  }

  function pvp(id,body) {

    const spec=pvpActions.find(x=>x.id===body.kind);

    if(!spec||typeof body.target!=='string') fail('Choose an action and a player.');

    return transaction(()=>{

      const user=settleRaw(id); available(user); ready(id,'pvp');

      const found=q('SELECT id FROM users WHERE username=? AND banned=0',body.target);

      if(!found||found.id===id) fail('Choose another active player.');

      const target=settleRaw(found.id,clock(),false);if(referrals.protectedTarget(target.id))fail('This referral player is protected until qualification and review.',409);

      if(user.xp<500||target.xp<500) fail('Both players need at least 500 XP. New players are protected.',403);

      if(target.prison_until>clock()||target.hospital_until>clock()||target.protected_until>clock()||target.captured_until>clock()) fail('This player is temporarily protected.',409);

      if(['rob','hostage','liquidate'].includes(spec.id)&&q('SELECT 1 FROM family_members a JOIN family_members b ON a.family_id=b.family_id WHERE a.user_id=? AND b.user_id=?',id,target.id))fail('You cannot rob, kidnap or liquidate a member of your own family.',403);

      if(body.anonymous!==undefined&&typeof body.anonymous!=='boolean')fail('Choose a valid anonymity option.');

      if(body.anonymous&&spec.id!=='liquidate')fail('Anonymous operations are available for liquidation attempts only.');

      const anonymousFee=body.anonymous?500000:0,actorName=body.anonymous?'An anonymous attacker':user.username;

      if(user.cash<anonymousFee)fail('Anonymous attempts require an extra $500,000.');

      if(anonymousFee)run('UPDATE users SET cash=cash-? WHERE id=?',anonymousFee,id);

      if(user.energy<spec.energy) fail('Not enough energy.',429);

      const supplies=operationSupply('pvp',spec),rounds=spec.id==='liquidate'?(body.rounds===undefined?60:body.rounds):supplies.ammo;

      if(!integer(rounds,60,10000)&&spec.id==='liquidate')fail('Choose 60–10,000 liquidation rounds.');

      const ammoUsed=logistics.consume(id,'personal',{...supplies,ammo:rounds});

      const protection=empire.personal(target.id).protection;

      const targetRank=(progression(target.xp).rankLevel-1)/24,hostage=spec.id==='hostage';

      const chance=(hostage?.65-.40*targetRank:spec.id==='liquidate'?liquidationChance(rounds):spec.chance)*(1-protection.chanceReduction)*(1-personalRespect(target.respect_received).defenseBonus);

      const success=roll()<chance*10000,quality=hostage&&success?draw(50,100):0;

      const hostageMaximum=Math.round(100000+9900000*targetRank**2);

      const stolen=success?Math.min(Math.floor((spec.id==='rob'?target.cash*.10:hostage?Math.min(target.cash,hostageMaximum*quality/100):0)*(1-protection.lossReduction)),MAX_MONEY-user.cash):0;

      run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(?,?,?,?)',id,'pvp:'+spec.id,success?1:0,clock());

      run('UPDATE users SET energy=energy-?,cash=cash+?,xp=MIN(?,xp+?),heat=MIN(100,heat+15),protected_until=0 WHERE id=?',spec.energy,stolen,MAX_XP,Math.floor((success?400:40)*marriageBonus(id)),id);

      if(success) {

        const damage=spec.id==='liquidate'?target.health:Math.ceil(spec.damage*(1-protection.lossReduction)),health=Math.max(0,target.health-damage);

        run('UPDATE users SET cash=cash-?,health=?,health_at=?,protected_until=?,captured_until=? WHERE id=?',stolen,health,clock(),clock()+10*60000,spec.id==='hostage'?clock()+2*60000:0,target.id);

        if(spec.id==='liquidate')underworld.detain(target.id,'coma',72*3600000,100000000,actorName+' liquidated you. You are in a coma for up to 72 hours. Treatment is scaled to your rank and decreases with time.');

        else if(health===0)underworld.detain(target.id,'hospital',3600000,5000000,'An attack left you in hospital for one hour.');

        else underworld.notify(target.id,'You were attacked',actorName+' used '+spec.name+'. Lost '+damage+' health and $'+stolen+'.','/images/scene-operations.jpg');

      } else {

        const damage=spec.id==='liquidate'?25:15;run('UPDATE users SET health=MAX(1,health-?),health_at=? WHERE id=?',damage,clock(),id);

        run('UPDATE users SET protected_until=? WHERE id=?',clock()+2*60000,target.id);

        underworld.notify(target.id,'An attack was repelled',actorName+' failed a '+spec.name+' against you.','/images/scene-operations.jpg');

      }

      let backfireRounds=0,backfireSuccess=false,bounty={amount:0,paid:0,pending:0};

      if(spec.id==='liquidate'){

        const defenseAmmo=logistics.inventory('personal',target.id);

        backfireRounds=defenseAmmo.tier>=3?Math.min(target.backfire_rounds||0,defenseAmmo.ammo):0;

        if(backfireRounds){logistics.consume(target.id,'personal',{ammo:backfireRounds,tier:3});backfireSuccess=roll()<backfireChance(backfireRounds)*10000;}

        if(success)bounty=playerSystems.award(id,target.id);

        if(backfireSuccess){underworld.detain(id,'coma',72*3600000,100000000,target.username+' returned fire. You are in a coma.');playerSystems.award(target.id,id);}

        if(backfireRounds)playerSystems.record(target.id,id,'backfire',backfireSuccess,backfireRounds);

        if(backfireRounds)underworld.notify(target.id,'Backfire resolved','Your guards used '+backfireRounds+' rounds. '+(backfireSuccess?'The attacker was also put into a coma.':'The attacker survived your return fire.'),'/images/scene-operations.jpg');

      }

      playerSystems.record(id,target.id,spec.id,success,ammoUsed,backfireRounds,backfireSuccess);

      promote(id,user.xp);

      cooldown(id,'pvp',spec.cooldown);

      log(id,`${spec.name} against ${target.username}: ${success?'success':'failed'}. Loot: $${stolen}. Anonymity fee: $${anonymousFee}.`);

      log(target.id,`${actorName}: ${spec.name.toLowerCase()} ${success?'succeeded':'failed'}. Cash lost: $${stolen}.`);

      return {success,backfireRounds,backfireSuccess,bountyReward:bounty.paid,bountyPending:bounty.pending,anonymousFee,ammoUsed,chance,quality,hostageMaximum,reward:stolen,healthLost:success?0:Math.min(user.health-1,spec.id==='liquidate'?25:15),image:spec.id==='liquidate'&&success?'/images/scene-coma.jpg':'/images/scene-operations.jpg',message:(backfireSuccess?'Return fire put you in a coma too. ':'')+(success?(spec.id==='liquidate'?'Liquidation succeeded. The target is in a 72-hour coma.':`${spec.name} succeeded. Loot: ${stolen}.`):'The operation failed. You lost '+Math.min(user.health-1,spec.id==='liquidate'?25:15)+' health.')};

    });

  }

  function adminPlayer(id) {

    const user=settle(id);

    if(!user) fail('Player not found',404);

    const {password,...safe}=user;

    return {player:safe,mysteryJobs,mysteryOffer:q('SELECT * FROM mystery_offers WHERE user_id=?',id)||null,familyRole:q('SELECT family_role FROM family_members WHERE user_id=?',id)?.family_role||'member',titles:benefits(id).titles,possessions:owned(id),families:all('SELECT id,name FROM families ORDER BY name'),cooldowns:all('SELECT kind,available_at FROM actions WHERE user_id=?',id),familyId:q('SELECT family_id FROM family_members WHERE user_id=?',id)?.family_id||null};

  }

  function editPlayer(actor,body) {

    if(!integer(body.id,1)) fail('Invalid player ID');

    const changes=body.changes||(body.field?{[body.field]:body.value}:null);

    if(!changes||typeof changes!=='object'||Array.isArray(changes)) fail('Invalid changes');

    const numeric={cash:MAX_MONEY,bank:MAX_MONEY,xp:MAX_XP,breakout_xp:MAX_XP,drugs_xp:MAX_XP,guns_xp:MAX_XP,respect_received:MAX_XP,pending_income:MAX_MONEY,prison_until:8640000000000000,coma_until:8640000000000000,justice_protected_until:8640000000000000,report_until:8640000000000000,breakout_until:8640000000000000,personal_protection:10,muscle_uses:8,muscle_bonus:1500,muscle_until:8640000000000000,mystery_next_at:8640000000000000,family_join_after:8640000000000000,created_at:8640000000000000,energy_at:8640000000000000,health_at:8640000000000000,energy:ENERGY_LIMIT,health:100,heat:100,banned:1,hospital_until:8640000000000000,protected_until:8640000000000000,captured_until:8640000000000000};

    const allowed=new Set([...Object.keys(numeric),'username','email','city','role','password','familyId','possessions','resetCooldowns','familyRole','selected_title','cooldowns','revokeSessions','mysteryOffer']);

    for(const key of Object.keys(changes)) if(!allowed.has(key)) fail('Unknown player field: '+key);

    return transaction(()=>{

      const target=settleRaw(body.id); if(!target) fail('Player not found',404);

      const audit={};

      for(const [field,value] of Object.entries(changes)) {

        if(field in numeric) { if(!integer(value,0,numeric[field])) fail('Invalid '+field); }

        else if(field==='username') { if(typeof value!=='string'||!(/^[a-zA-Z0-9_]{3,20}$/.test(value)||q('SELECT 1 FROM bot_players WHERE user_id=?',body.id)&&/^[A-Za-z]{2,18} [A-Za-z]{2,18}$/.test(value))) fail('Invalid username'); }

        else if(field==='email') { if(typeof value!=='string'||value.length>150||!/^\S+@\S+\.\S+$/.test(value)) fail('Invalid email'); }

        else if(field==='city') { if(typeof value!=='string'||value.trim().length<2||value.length>60) fail('Invalid city'); }

        else if(field==='role') { if(!['player','admin','owner'].includes(value)) fail('Invalid account role.',403); }

        else if(field==='password') { if(typeof value!=='string'||value.length<15||value.length>128) fail('New passwords must contain 15–128 characters.'); }

        else continue;

        if(field==='password') {

          run('UPDATE users SET password=? WHERE id=?',hash(value),body.id);

          run('DELETE FROM sessions WHERE user_id=?',body.id); audit.password='reset';

        } else { run(`UPDATE users SET ${field}=? WHERE id=?`,value,body.id); audit[field]={before:target[field],after:value}; }

      }

      if('selected_title' in changes){if(typeof changes.selected_title!=='string'||changes.selected_title&&!benefits(body.id).titles.some(t=>t.id===changes.selected_title))fail('Title is not unlocked');run('UPDATE users SET selected_title=? WHERE id=?',changes.selected_title,body.id);audit.selected_title=changes.selected_title;}

      for(const stamp of ['energy_at','health_at'])if(stamp in changes)run('UPDATE users SET '+stamp+'=? WHERE id=?',changes[stamp],body.id);

      if('energy' in changes&&!('energy_at' in changes)) run('UPDATE users SET energy_at=? WHERE id=?',clock(),body.id);

      if('health' in changes&&!('health_at' in changes)) run('UPDATE users SET health_at=? WHERE id=?',clock(),body.id);

      if(!q("SELECT 1 FROM users WHERE role='owner' AND banned=0")) fail('Keep at least one active Owner account.',409);

      if(changes.banned===1||'role' in changes&&changes.role!==target.role) run('DELETE FROM sessions WHERE user_id=?',body.id);

      if('familyId' in changes) {

        const family=changes.familyId;

        if(family!==null&&(!integer(family,1)||!q('SELECT 1 FROM families WHERE id=?',family))) fail('Invalid family');

        const led=q('SELECT id FROM families WHERE leader_id=?',body.id);

        if(led&&family!==led.id) fail('A family leader must remain in their family.');

        if(family!==null&&q('SELECT family_id FROM family_members WHERE user_id=?',body.id)?.family_id!==family&&q('SELECT COUNT(*) n FROM family_members WHERE family_id=?',family).n>=familyCapacity(db,family))fail('Family member capacity reached.',409);

        if(family===null)run('DELETE FROM family_members WHERE user_id=?',body.id);

        else run("INSERT INTO family_members(user_id,family_id) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET family_role=CASE WHEN family_id=excluded.family_id THEN family_role ELSE 'member' END,family_id=excluded.family_id",body.id,family);

        audit.familyId=family;

      }

      if('mysteryOffer' in changes){const o=changes.mysteryOffer,previous=q('SELECT * FROM mystery_offers WHERE user_id=?',body.id);if(o!==null&&(!o||!mysteryJobs.some(j=>j.id===o.kind)||!integer(o.reward_min,1,MAX_MONEY)||!integer(o.reward_max,o.reward_min,MAX_MONEY)||!integer(o.expires_at,0,8640000000000000)))fail('Invalid mystery offer');run('DELETE FROM mystery_offers WHERE user_id=?',body.id);if(o)run('INSERT INTO mystery_offers(user_id,kind,reward_min,reward_max,expires_at) VALUES(?,?,?,?,?)',body.id,o.kind,o.reward_min,o.reward_max,o.expires_at);audit.mysteryOffer={before:previous,after:o};}

      if('familyRole' in changes){if(!['member','soldier','enforcer','consigliere','underboss','capo'].includes(changes.familyRole))fail('Invalid family role');run('UPDATE family_members SET family_role=? WHERE user_id=?',changes.familyRole,body.id);audit.familyRole=changes.familyRole;}

      if('revokeSessions' in changes){if(typeof changes.revokeSessions!=='boolean')fail('Invalid session reset');if(changes.revokeSessions)run('DELETE FROM sessions WHERE user_id=?',body.id);audit.revokeSessions=changes.revokeSessions;}

      if('cooldowns' in changes){

        if(!Array.isArray(changes.cooldowns)||changes.cooldowns.length>crimes.length+4)fail('Invalid cooldowns');const seen=new Set();

        for(const c of changes.cooldowns){if(!c||![...crimes.map(x=>x.id),'pvp','shipment:drugs','shipment:guns','flight'].includes(c.kind)||seen.has(c.kind)||!integer(c.available_at,0,8640000000000000))fail('Invalid cooldown');seen.add(c.kind);}

        run('DELETE FROM actions WHERE user_id=?',body.id);for(const c of changes.cooldowns)run('INSERT INTO actions(user_id,kind,available_at) VALUES(?,?,?)',body.id,c.kind,c.available_at);audit.cooldowns=changes.cooldowns;

      }

      if('possessions' in changes) {

        if(!Array.isArray(changes.possessions)||changes.possessions.length>catalog.length) fail('Invalid possessions');

        const keys=new Set();

        for(const asset of changes.possessions) {

          if(!asset||!catalog.some(x=>x.id===asset.item_id&&x.category===asset.category)) fail('Unknown possession');

          if(!integer(asset.quantity??1,1,assetLimit(asset)))fail('Quantity must be between 1 and '+assetLimit(asset));

          const key=asset.category+':'+asset.item_id;if(keys.has(key)) fail('Duplicate possession');keys.add(key);

        }

        for(const asset of owned(body.id)) if(!keys.has(asset.category+':'+asset.item_id)) run('DELETE FROM possessions WHERE user_id=? AND category=? AND item_id=?',body.id,asset.category,asset.item_id);

        for(const asset of changes.possessions) run('INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at,quantity) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,category,item_id) DO UPDATE SET quantity=excluded.quantity,income_at=excluded.income_at',body.id,asset.category,asset.item_id,clock(),clock(),asset.quantity??1);

        audit.possessions=changes.possessions;

        run('UPDATE users SET energy_at=?,health_at=? WHERE id=?',clock(),clock(),body.id);

      }

      if('energy' in changes&&changes.energy>benefits(body.id).energyMax)fail('Energy exceeds the capacity provided by this player’s rank and assets (maximum 1,000).');



      if('xp' in changes)promote(body.id,target.xp,!('energy' in changes));

      if('resetCooldowns' in changes) {

        if(typeof changes.resetCooldowns!=='boolean') fail('Invalid cooldown reset');

        if(changes.resetCooldowns) {run('DELETE FROM actions WHERE user_id=?',body.id);audit.resetCooldowns=true;}

      }

      underworld.syncOwner(body.id,target,changes);

      run('INSERT INTO owner_audit(actor_id,target_id,details,created_at) VALUES(?,?,?,?)',actor,body.id,JSON.stringify(audit),clock());

      log(actor,`Owner updated ${target.username}: ${Object.keys(audit).join(', ')}.`);

      return {ok:true};

    });

  }

  const empire=installEmpire(db,{offerBribe:(...a)=>bribery.offer(...a),detain:(...a)=>underworld.detain(...a),supporterBonus,marriageBonus,familyPower:(...a)=>logistics.familyPower(...a),consume:(...a)=>logistics.consume(...a),transaction,settleRaw,available,promote,log,roll,draw,clock,notify:(...a)=>underworld.notify(...a),blockedMillis:(...a)=>underworld.blockedMillis(...a)});

  transaction(()=>{

    db.exec('CREATE TABLE IF NOT EXISTS archived_family_assets(family_id INTEGER,item_id TEXT,quantity INTEGER NOT NULL,archived_at INTEGER NOT NULL,PRIMARY KEY(family_id,item_id))');

    db.exec("DROP TRIGGER IF EXISTS family_asset_limit_insert; DROP TRIGGER IF EXISTS family_asset_limit_update; DROP INDEX IF EXISTS one_master_compound;");

    for(const a of all('SELECT * FROM family_assets')){const spec=familyAssets.find(x=>x.id===a.item_id);if(spec&&a.quantity>spec.limit)run('UPDATE family_assets SET quantity=? WHERE family_id=? AND item_id=?',spec.limit,a.family_id,a.item_id);}

    const compounds=familyAssets.filter(x=>x.category==='Compounds');

    for(const f of all('SELECT id FROM families')){const owned=all('SELECT * FROM family_assets WHERE family_id=?',f.id).filter(a=>compounds.some(c=>c.id===a.item_id)).sort((a,b)=>compounds.find(c=>c.id===b.item_id).price-compounds.find(c=>c.id===a.item_id).price);for(const a of owned.slice(1))run('DELETE FROM family_assets WHERE family_id=? AND item_id=?',f.id,a.item_id);}

    const compoundIds=compounds.map(c=>"'"+c.id+"'").join(',');

    db.exec(`CREATE UNIQUE INDEX one_master_compound ON family_assets(family_id) WHERE item_id IN (${compoundIds})`);

    const limits=familyAssets.map(x=>`WHEN '${x.id}' THEN ${x.limit}`).join(' ');

    for(const event of ['INSERT','UPDATE'])db.exec(`CREATE TRIGGER family_asset_limit_${event.toLowerCase()} BEFORE ${event} ON family_assets WHEN NEW.quantity>CASE NEW.item_id ${limits} ELSE 0 END BEGIN SELECT RAISE(ABORT,'Family asset quantity limit'); END;`);

  });

  const underworld=installUnderworld(db,{onNotify,offerBribe:(...a)=>bribery.offer(...a),supporterBonus,supply:()=>logistics,consume:(...a)=>logistics.consume(...a),transaction,settleRaw,benefits,available,log,roll,clock,fail});

  const logistics=installLogistics(db,{employeePower:id=>expansion?.stats(id).power||0,marriageBonus,transaction,settleRaw,available,clock,fail,log,blockedMillis:underworld.blockedMillis});

  const vehicles=installVehicles(db,{clock,transaction,settleRaw,available,fail,draw,log,notify:underworld.notify});

  const bribery=installBribery(db,{clock,transaction,fail,draw:bribeRoll,active:underworld.active,release:underworld.release,log});

  const community=installCommunity(db,{settleWars:empire.settleWars,warStats:empire.warStats,supply:logistics,transaction,clock,fail,notify:underworld.notify,log});

  const casino=installCasino(db,{supporterBonus,transaction,clock,fail,settleRaw,available,draw,log});

  const casinoExtra=installCasinoExtra(db,{transaction,clock,fail,settleRaw,available,draw,log,supporterBonus});

  const daily=installDaily(db,{marriageBonus,transaction,clock,fail,settleRaw,available,promote,notify:underworld.notify,log});

  const legacy=installLegacy(db,{marriageBonus,clock,transaction,fail,settleWars:empire.settleWars,power:logistics.personalPower,promote});

  const shop=installShop(db,{energyMax:id=>benefits(id).energyMax,transaction,clock,fail,notify:underworld.notify,promote,settleRaw});

  const profiles=installProfiles(db,{avatars:shop.avatars,owned,profile,transaction,fail,clock,achievements:legacy.sync,themes:id=>[...legacy.themes(id),...shop.themes(id)],honor:legacy.honor,frames:shop.frames});

  const referrals=installReferrals(db,{clock,transaction,fail,notify:underworld.notify,log});
  const transfers=installTransfers(db,{transaction,settleRaw,benefits,log,fail,notify:underworld.notify});

  const ownerAdmin=installOwnerAdmin(db,{transaction,log,clock,settleRaw,syncTerritory:empire.syncTerritory});

  const care=installPlayerCare(db,{transaction,clock,fail,notify:underworld.notify,settleRaw,cancelRaces:id=>circuit?.cancelPlayer(id)});

  economy=installEconomy(db,{clock,fail});

  installBotSchema(db);

  const presence=installPresence(db,{clock,fail,membership:shop.membership,lucky:casinoExtra.lucky});

  playerSystems=installPlayerSystems(db,{transaction,clock,fail,settleRaw,available,notify:underworld.notify});

  expansion=installCityExpansion(db,{passiveSupporter,marriageBonus:id=>playerSystems?.bonus(id)||1,transaction,clock,fail,settleRaw,available,benefits,promote,log,blockedMillis:underworld.blockedMillis,supporterBonus});

  const crew=installCrewOperations(db,{transaction,clock,fail,settleRaw,available,consume:logistics.consume,promote,notify:underworld.notify,log,rewardBonus:marriageBonus,power:logistics.personalPower,draw,roll});

  art=installArtMarket(db,{clock,transaction,fail,settleRaw,available,inventory:logistics.inventory,promote,rewardBonus:marriageBonus,consume:(id,scope,ammo,tier)=>logistics.consume(id,scope,{ammo,tier}),draw,roll,log,notify:underworld.notify,arrest:(id,minutes)=>underworld.detain(id,'prison',minutes*60000,1500000,'Arrested after an art heist.'),offerBribe:bribery.offer});
  circuit=installMidnightCircuit(db,{clock,transaction,fail,draw,settleRaw,available,vehicleBoard:vehicles.view,notify:underworld.notify,arrest:(id,minutes)=>underworld.detain(id,'prison',minutes*60000,500000,'Arrested after a Midnight Circuit race.'),offerBribe:bribery.offer,currentBribe:bribery.current});

  const territoryIncome=installTerritoryIncome(db,{clock,transaction});

  function route(req,res,pathname,body,user) {

    try {

      guardStaff(db,user,pathname,body,req.url);
      if(req.method==='POST')referrals.guard(user.id,pathname);const referralResult=referrals.route(req,pathname,body,user);if(referralResult!==null)return json(res,200,referralResult);


      if(pathname==='/api/bank'&&req.method==='POST')return json(res,200,bankMove(db,user.id,body,log));

      const bribeResult=bribery.route(req,pathname,body,user);if(bribeResult!==null)return json(res,200,bribeResult);

      economy.withSource('territory-income',territoryIncome.settle);

      casinoExtra.settle();

      if(pathname==='/api/income/claim'&&req.method==='POST')return json(res,200,transaction(()=>{const before=q('SELECT cash FROM users WHERE id=?',user.id).cash;const u=settleRaw(user.id);available(u);const amount=u.cash-before;return {ok:true,payout:amount,message:amount?'All available personal hourly income collected.':'All available hourly income has already been credited automatically. Family income is credited directly to its treasury.',image:'/images/page-bank.png'};}));

      if(pathname==='/api/calendar'&&req.method==='GET'){const event=sundayEvent(clock());return json(res,200,{...event,seen:!!q('SELECT 1 FROM news_seen WHERE user_id=? AND token=?',user.id,'sunday:'+event.id)});}

      if(pathname==='/api/calendar/ack'&&req.method==='POST'){const event=sundayEvent(clock());if(!event.active||body.id!==event.id)fail('This Sunday event is no longer active.',409);run('INSERT OR IGNORE INTO news_seen(user_id,token) VALUES(?,?)',user.id,'sunday:'+event.id);return json(res,200,{ok:true});}

      if(req.method==='GET'&&pathname==='/api/guide'){

        const question=(new URL(req.url,'http://localhost').searchParams.get('q')||'').toLowerCase();

        return json(res,200,guideAnswer(db,q('SELECT * FROM users WHERE id=?',user.id),question,clock(),{incomeClock:profile(q('SELECT * FROM users WHERE id=?',user.id)).incomeClock,referrals:/referral|aanbreng|verwijz|invite.*friend|vriend.*uitnodig/.test(question)?referrals.view(user.id):null,language:new URL(req.url,'http://localhost').searchParams.get('lang')==='nl'?'nl':'en',circuit:circuit.board(user.id),art:art.board(user.id),bribe:bribery.current(user.id),armory:logistics.inventory('personal',user.id),crimes:crimes.map(c=>crimeOffer(c,benefits(user.id))),ammoPrice:AMMO_PRICE,milestones:legacy.sync(user.id),daily:daily.route({method:'GET'},'/api/daily',{},user).jobs,market:logistics.marketAdvice(q('SELECT * FROM users WHERE id=?',user.id)),vehicles:vehicles.advice(user.id),family:/territor|verover|capture|gebied|map|kaart/.test(question||'')?empire.route('GET','/api/family',{},user).family:null}));

      }

      const presenceResult=presence.route(req,pathname,body,user);if(presenceResult!==null)return json(res,200,presenceResult);

      economy.source(pathname.replace('/api/','')+(typeof body.kind==='string'?':'+body.kind.slice(0,40):''));

      if(req.method==='POST')care.guard(user,pathname,body);

      const careResult=care.route(req,pathname,body,user);if(careResult!==null)return json(res,200,careResult);

      const economyResult=economy.route(req,pathname,body,user);if(economyResult!==null)return json(res,200,economyResult);

      const restricted=detained(q('SELECT * FROM users WHERE id=?',user.id),clock());

      if(req.method==='POST'&&restricted&&!['/api/world-chat/send','/api/world-chat/hide','/api/family/chat/send','/api/conversation/read','/api/profile/settings','/api/custody/pay','/api/notifications/ack','/api/promotion/ack','/api/messages','/api/bank','/api/news/read'].includes(pathname)&&!pathname.startsWith('/api/admin/'))fail('Prison or hospital: income and activities are suspended. Arrange your release first.',409);

      const artResult=art.route(req,pathname,body,user);if(artResult!==null)return json(res,200,artResult);

      const circuitResult=circuit.route(req,pathname,body,user);if(circuitResult!==null)return json(res,200,circuitResult);
      const vehicleResult=vehicles.route(req,pathname,body,user);if(vehicleResult!==null)return json(res,200,vehicleResult);

      if(req.method==='GET'&&pathname==='/api/mystery'&&restricted)return json(res,200,{offer:null});

      const crewResult=crew.route(req,pathname,body,user);if(crewResult!==null)return json(res,200,crewResult);

      const expansionResult=expansion.route(req,pathname,body,user);if(expansionResult!==null)return json(res,200,expansionResult);

      const playerResult=playerSystems.route(req,pathname,body,user);if(playerResult!==null)return json(res,200,playerResult);

      const shopResult=shop.route(req,pathname,body,user);if(shopResult!==null)return json(res,200,shopResult);

      const legacyResult=legacy.route(req,pathname,body,user);if(legacyResult!==null){if(pathname==='/api/world-chat')legacyResult.messages=care.filter(user,legacyResult.messages,'user_id');return json(res,200,legacyResult);}

      const casinoExtraResult=casinoExtra.route(req,pathname,body,user);if(casinoExtraResult!==null)return json(res,200,casinoExtraResult);

      const casinoResult=casino.route(req,pathname,body,user);if(casinoResult!==null)return json(res,200,casinoResult);

      const dailyResult=daily.route(req,pathname,body,user);if(dailyResult!==null)return json(res,200,dailyResult);

      const logisticsResult=logistics.route(req,pathname,body,user);if(logisticsResult!==null)return json(res,200,logisticsResult);

      const communityResult=community.route(req,pathname,body,user);if(communityResult!==null)return json(res,200,communityResult);

      const profileResult=profiles.route(req.method,pathname,body,user);if(profileResult!==null)return json(res,200,profileResult);

      const worldResult=underworld.route(req.method,pathname,body,user);if(worldResult!==null){if(worldResult.topFamilies)worldResult.topFamilies=worldResult.topFamilies.map(f=>({...f,honor:legacy.honor(f.id)}));return json(res,200,worldResult);}

      const transferResult=transfers.route(req.method,pathname,body,user);if(transferResult!==null)return json(res,200,transferResult);

      const ownerResult=ownerAdmin.route(req,pathname,body,user);

      if(ownerResult!==null)return json(res,200,ownerResult);

      const extension=empire.route(req.method,pathname,body,user,req.url);

      if(extension!==null){if(pathname==='/api/family/chat')extension.messages=care.filter(user,extension.messages,'user_id');if(extension.family?.id)extension.family.honor=legacy.honor(extension.family.id);if(extension.families)extension.families=extension.families.map(f=>({...f,honor:legacy.honor(f.id)}));return json(res,200,extension);}

      if(pathname==='/api/messages'&&req.method==='POST'){

        const recipient=typeof body.recipient==='string'?q('SELECT id FROM users WHERE username=? AND banned=0 AND deleted_at=0',body.recipient):null;if(!recipient||recipient.id===user.id||typeof body.message!=='string'||body.message.trim().length<1||body.message.length>1000)fail('Invalid recipient or message');

        run('INSERT INTO messages(sender_id,recipient_id,body,created_at) VALUES(?,?,?,?)',user.id,recipient.id,body.message.trim(),clock());underworld.notify(recipient.id,'Private message received','A new private message from '+user.username+'.','/images/scene-messages.jpg');return json(res,200,{ok:true});

      }

      if(pathname==='/api/admin/bots'){

        if(user.role!=='owner')fail('Owner access required.',403);

        if(req.method==='POST'){if(typeof body.enabled!=='boolean')fail('Choose enabled or paused.');run("INSERT INTO bot_meta VALUES('enabled',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",String(body.enabled));if(!body.enabled)run('UPDATE users SET online_until=0 WHERE id IN (SELECT user_id FROM bot_players)');}

        return json(res,200,{enabled:q("SELECT value FROM bot_meta WHERE key='enabled'")?.value==='true',capabilities:botCapabilities,boundaries:botCommandBoundaries,coverage:all('SELECT * FROM bot_action_stats ORDER BY user_id,path'),bots:all('SELECT b.*,u.username,u.cash,u.xp FROM bot_players b JOIN users u ON u.id=b.user_id ORDER BY u.username')});

      }

      if(pathname==='/api/families'&&req.method==='POST')return transaction(()=>{

        const u=settleRaw(user.id);available(u);if(typeof body.name!=='string'||! /^[a-zA-Z0-9 _-]{3,30}$/.test(body.name))fail('Invalid family name');

        if(q('SELECT 1 FROM family_members WHERE user_id=?',u.id))fail('You already belong to a family',409);

        if(u.family_join_after>clock())fail('Wait before creating another family.',429);

        if(u.cash<1000000)fail('Creating a family costs $1,000,000');

        const r=run('INSERT INTO families(name,leader_id,created_at) VALUES(?,?,?)',body.name,u.id,clock());run('INSERT INTO family_members(user_id,family_id) VALUES(?,?)',u.id,r.lastInsertRowid);run('UPDATE users SET cash=cash-1000000 WHERE id=?',u.id);return json(res,201,{ok:true});

      });

      if(pathname==='/api/catalog'&&req.method==='GET') {

        const possessions=owned(user.id),perks=benefits(user.id);

        return json(res,200,{catalog:catalog.map(item=>{

          const quantity=possessions.find(a=>a.category===item.category&&a.item_id===item.id)?.quantity||0;

          return {...item,quantity,nextPrice:purchasePrice(item,quantity)};

        }),crimes:crimes.map(x=>crimeOffer(x,perks)),pvpActions:pvpActions.map(x=>({...x,supplies:operationSupply('pvp',x)})),ranks});

      }

      if(pathname==='/api/promotion/ack'&&req.method==='POST'){

        if(!integer(body.id,1))fail('Invalid promotion ID');

        run('DELETE FROM promotion_notifications WHERE user_id=? AND id=?',user.id,body.id);

        return json(res,200,{ok:true});

      }

      if(pathname==='/api/title'&&req.method==='POST') {

        if(typeof body.title!=='string'||!benefits(user.id).titles.some(x=>x.id===body.title))fail('This title is not unlocked.',403);

        run('UPDATE users SET selected_title=? WHERE id=?',body.title,user.id);return json(res,200,{ok:true});

      }

      if(pathname==='/api/assets'&&req.method==='GET') return json(res,200,{possessions:owned(user.id),archived:all('SELECT * FROM archived_possessions WHERE user_id=?',user.id)});

      if(pathname==='/api/assets/buy'&&req.method==='POST') {

        const item=catalog.find(x=>x.id===body.id&&x.category===body.category);

        if(!item) fail('Unknown item');

        const result=transaction(()=>{

          settleRaw(user.id);

          const quantity=q('SELECT quantity FROM possessions WHERE user_id=? AND category=? AND item_id=?',user.id,item.category,item.id)?.quantity||0;

          if(item.category==='car')vehicles.assertSpace(user.id);

          if(quantity>=assetLimit(item))fail('Collection limit: '+assetLimit(item)+' per asset type.',409);

          const {quantity:count,cost:price}=order(body.quantity??1,assetLimit(item)-quantity,q('SELECT cash FROM users WHERE id=?',user.id).cash,i=>purchasePrice(item,quantity+i),fail);

          if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',price,user.id,price).changes) fail('Insufficient cash');

          run('INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,category,item_id) DO UPDATE SET quantity=quantity+1,income_at=excluded.income_at',user.id,item.category,item.id,clock(),clock());

          if(item.category==='car')vehicles.recordPurchase(user.id,item.id,price);

          if(count>1)run('UPDATE possessions SET quantity=quantity+? WHERE user_id=? AND category=? AND item_id=?',count-1,user.id,item.category,item.id);

          run('UPDATE users SET energy_at=?,health_at=? WHERE id=?',clock(),clock(),user.id);

          log(user.id,`Purchased ${count} Ã— ${item.name} for $${price}.`); return {ok:true,cost:price,quantity:count,image:item.image};

        }); return json(res,201,result);

      }

      if(pathname==='/api/action'&&req.method==='POST') return json(res,200,act(user.id,body.kind,body));

      if(pathname==='/api/pvp'&&req.method==='POST') return json(res,200,pvp(user.id,body));

      if(pathname==='/api/players'&&req.method==='GET') return json(res,200,{players:all('SELECT id,username,xp,health,protected_until,hospital_until FROM users WHERE banned=0 AND id<>? ORDER BY xp DESC LIMIT 100',user.id)});

      if(pathname==='/api/protection'&&req.method==='POST') {

        transaction(()=>{

          const current=settleRaw(user.id); available(current);

          if(current.protected_until>clock()) fail('Protection is already active.',409);

          if(!run('UPDATE users SET cash=cash-50000,protected_until=? WHERE id=? AND cash>=50000',clock()+30*60000,user.id).changes) fail('VIP protection costs $50,000.');

          log(user.id,'Purchased 30 minutes of VIP protection.');

        });return json(res,200,{ok:true});

      }

      if(pathname==='/api/admin/player') {

        if(!isStaff(user)) fail('Staff access required',403);

        if(req.method==='GET') {const id=Number(new URL(req.url,'http://localhost').searchParams.get('id'));if(!integer(id,1))fail('Invalid player ID');return json(res,200,adminPlayer(id));}

        if(req.method==='POST') return json(res,200,editPlayer(user.id,body));

      }

      if(pathname==='/api/admin/user'&&req.method==='POST') {

        if(!isStaff(user)) fail('Staff access required',403);

        return json(res,200,editPlayer(user.id,body));

      }

      if(pathname==='/api/admin/audit'&&req.method==='GET') {

        if(!isStaff(user)) fail('Staff access required',403);

        return json(res,200,{entries:all('SELECT a.*,u.username actor,t.username target FROM owner_audit a JOIN users u ON u.id=a.actor_id JOIN users t ON t.id=a.target_id WHERE (?=1 OR t.role<>\'owner\') ORDER BY a.id DESC LIMIT 100',user.role==='owner'?1:0)});

      }

      return false;

    } catch(error) {

      if(error.status) return json(res,error.status,{error:error.message});

      if(error.message.includes('UNIQUE constraint')) return json(res,409,{error:'Username or email already taken'});

      throw error;

    } finally {economy.source('system')}

  }

  return {registerReferral:referrals.registration,presence,recordActivity:economy.withSource,tick:()=>{referrals.settle();economy.withSource('midnight-circuit',circuit.settle);economy.withSource('art-auction',art.settle);economy.withSource('vehicle-auction',vehicles.settle);economy.withSource('territory-income',territoryIncome.settle);care.beta();expansion.publish();return economy.withSource('season',legacy.tick)},settle,route,owned,profile,notify:underworld.notify,blockedMillis:underworld.blockedMillis};

}



