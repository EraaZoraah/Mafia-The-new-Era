import {familyHourlyIncome} from './territory-income.js';
import {MAX_XP} from './money.js';
import {sundayBonus} from './calendar-events.js';
import {compoundUpgrades} from './crew-operations.js';
import {assertHostile,installDiplomacy,succeedDon} from './diplomacy.js';
import {installTerritoryMap} from './territory-map.js';
import {installFamilyCommand} from './family-command.js';
import {installWarOperations} from './war-operations.js';
import {installFamilyWars,raidChance} from './family-wars.js';
import {order} from './purchases.js';
import {operationSupply} from './logistics.js';
import {personalRespect} from './underworld.js';
import {installInvestments,respect} from './investments.js';
import {career,careerRanks,familyAssets,musclePackages,shipmentTiers,mysteryJobs,MAX_CASH,personalProtectionMax,protectionPrice,familyPrice} from './empire-catalog.js';
import {progression,passiveMultiplier} from './progression.js';

export function installEmpire(db,{offerBribe=()=>null,detain=()=>{},supporterBonus=()=>1,marriageBonus=()=>1,consume,familyPower,transaction,settleRaw,available,promote,log,roll,draw,notify,blockedMillis,clock=()=>Date.now()}){
 const q=(sql,...args)=>db.prepare(sql).get(...args),all=(sql,...args)=>db.prepare(sql).all(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
 const integer=(n,min=0,max=MAX_CASH)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 transaction(()=>{
  // The tables also make this module safe to migrate in isolated legacy fixtures.
  db.exec(`CREATE TABLE IF NOT EXISTS families(id INTEGER PRIMARY KEY,name TEXT UNIQUE NOT NULL COLLATE NOCASE,leader_id INTEGER NOT NULL REFERENCES users(id),created_at INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS family_members(user_id INTEGER PRIMARY KEY REFERENCES users(id),family_id INTEGER NOT NULL REFERENCES families(id));`);
  const add=(table,name,type)=>{if(!all('PRAGMA table_info('+table+')').some(c=>c.name===name))db.exec('ALTER TABLE '+table+' ADD COLUMN '+name+' '+type)};
  for(const name of ['drugs_xp','guns_xp','personal_protection','muscle_until','muscle_uses','muscle_bonus','mystery_next_at','family_join_after'])add('users',name,'INTEGER NOT NULL DEFAULT 0');
  for(const name of ['treasury','drugs_xp','guns_xp','shield_until','raid_until','guard_until'])add('families',name,'INTEGER NOT NULL DEFAULT 0');
  add('family_members','family_role',"TEXT NOT NULL DEFAULT 'member' CHECK(family_role IN ('member','capo'))");
  db.exec(`CREATE TABLE IF NOT EXISTS family_assets(family_id INTEGER NOT NULL REFERENCES families(id),item_id TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 5),PRIMARY KEY(family_id,item_id));
   CREATE TABLE IF NOT EXISTS family_events(id INTEGER PRIMARY KEY,family_id INTEGER NOT NULL REFERENCES families(id),message TEXT NOT NULL,created_at INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS mystery_offers(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),kind TEXT NOT NULL,reward_min INTEGER NOT NULL,reward_max INTEGER NOT NULL,expires_at INTEGER NOT NULL);`);
  if(!q("SELECT sql FROM sqlite_master WHERE name='mystery_offers'").sql.includes('AUTOINCREMENT'))db.exec(`ALTER TABLE mystery_offers RENAME TO mystery_offers_legacy;
   CREATE TABLE mystery_offers(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),kind TEXT NOT NULL,reward_min INTEGER NOT NULL,reward_max INTEGER NOT NULL,expires_at INTEGER NOT NULL);
   INSERT INTO mystery_offers SELECT * FROM mystery_offers_legacy;DROP TABLE mystery_offers_legacy;`);
 });
 if(!q("SELECT sql FROM sqlite_master WHERE name='family_assets'").sql.includes('BETWEEN 1 AND 525'))transaction(()=>{db.exec(`CREATE TABLE family_assets_new(family_id INTEGER NOT NULL REFERENCES families(id),item_id TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 525),PRIMARY KEY(family_id,item_id));INSERT INTO family_assets_new SELECT * FROM family_assets;DROP TABLE family_assets;ALTER TABLE family_assets_new RENAME TO family_assets;`)});
 installDiplomacy(db);
 const membership=id=>q('SELECT m.*,f.leader_id FROM family_members m JOIN families f ON f.id=m.family_id WHERE m.user_id=?',id);
 if(!q("SELECT sql FROM sqlite_master WHERE name='family_members'").sql.includes("'consigliere'"))transaction(()=>{db.exec(`CREATE TABLE family_members_new(user_id INTEGER PRIMARY KEY REFERENCES users(id),family_id INTEGER NOT NULL REFERENCES families(id),family_role TEXT NOT NULL DEFAULT 'member' CHECK(family_role IN ('member','soldier','enforcer','consigliere','underboss','capo')));INSERT INTO family_members_new SELECT user_id,family_id,family_role FROM family_members;DROP TABLE family_members;ALTER TABLE family_members_new RENAME TO family_members;`)});
 const role=m=>m.user_id===m.leader_id?'don':m.family_role;
 function familyMember(id,manager=false){const m=membership(id);if(!m)fail('Join a family first.',403);if(manager&&!['don','capo'].includes(role(m)))fail('Only the Don or a Capo can spend family funds.',403);return m}
 const familyLog=(id,message)=>run('INSERT INTO family_events(family_id,message,created_at) VALUES(?,?,?)',id,message,clock());
 const ready=(id,kind)=>{const until=q('SELECT available_at FROM actions WHERE user_id=? AND kind=?',id,kind)?.available_at||0;if(until>clock())fail('This operation is on cooldown.',429)};
 const cooldown=(id,kind,ms)=>run('INSERT INTO actions(user_id,kind,available_at) VALUES(?,?,?) ON CONFLICT(user_id,kind) DO UPDATE SET available_at=excluded.available_at',id,kind,clock()+ms);
 const debit=(id,amount)=>{if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',amount,id,amount).changes)fail('Insufficient cash.')};
 const familyDebit=(id,amount)=>{if(!run('UPDATE families SET treasury=treasury-? WHERE id=? AND treasury>=?',amount,id,amount).changes)fail('The family treasury has insufficient funds.')};
 function holdings(id){return all('SELECT item_id,quantity FROM family_assets WHERE family_id=?',id)}
 function defense(id){
  const f=q('SELECT * FROM families WHERE id=?',id);if(!f)return {reduction:0,lossReduction:0,runBonus:0};
  const assets=holdings(id),sum=key=>assets.reduce((n,a)=>n+(familyAssets.find(x=>x.id===a.item_id)?.[key]||0)*a.quantity,0);
  const members=q('SELECT COUNT(*) n FROM family_members m JOIN users u ON u.id=m.user_id WHERE m.family_id=? AND u.banned=0',id).n;
  const sabotageUntil=warOps.sabotageUntil(id);
  return {sabotageUntil,reduction:Math.min(.75,(sum('defense')+Math.min(15,members*2)+(f.guard_until>clock()?15:0))/100)*(sabotageUntil>clock()?.5:1),lossReduction:Math.min(.70,(sum('lossReduction')+sum('defense')*.25)/100),runBonus:Math.min(.12,sum('runBonus')/100)+all('SELECT upgrade_id FROM compound_upgrades WHERE family_id=?',id).reduce((n,x)=>n+(compoundUpgrades.find(v=>v.id===x.upgrade_id)?.chance||0),0)};
 }
 function personal(id){
  const u=q('SELECT * FROM users WHERE id=?',id),active=u.muscle_until>clock()&&u.muscle_uses>0;
  return {drugs:career('drugs',u.drugs_xp),guns:career('guns',u.guns_xp),protection:{level:u.personal_protection,max:personalProtectionMax,nextPrice:u.personal_protection<personalProtectionMax?protectionPrice(u.personal_protection):null,chanceReduction:u.personal_protection*.04,lossReduction:u.personal_protection*.03},muscle:{active,until:u.muscle_until,uses:active?u.muscle_uses:0,bonus:active?u.muscle_bonus/10000:0}};
 }
 const respectFor=(id,familyId)=>respect(q('SELECT total FROM family_contributions WHERE user_id=? AND family_id=?',id,familyId)?.total||'0');
 function familyView(id){
  const m=membership(id);if(!m)return {family:null};territoryMap.sync(m.family_id);const f=q('SELECT * FROM families WHERE id=?',m.family_id),assets=holdings(f.id);const compound=familyAssets.find(x=>x.category==='Compounds'&&assets.some(a=>a.item_id===x.id));
  return {family:{...f,hourlyIncome:familyHourlyIncome(db,f.id),warStats:wars.stats(f.id),territory:warOps.territory(f.id),mapHoldings:territoryMap.holdings(f.id),capture:territoryMap.captureState(f.id),archived:all('SELECT item_id,quantity FROM archived_family_assets WHERE family_id=?',f.id),role:role(m),respect:respectFor(id,f.id),canManage:['don','capo'].includes(role(m)),defense:defense(f.id),drugs:career('drugs',f.drugs_xp),guns:career('guns',f.guns_xp),
   assets:familyAssets.map(item=>{const quantity=assets.find(a=>a.item_id===item.id)?.quantity||0;return {...item,quantity,nextPrice:item.category==='Compounds'?Math.max(0,item.price-Math.floor((compound?.price||0)*.9)):familyPrice(item,quantity),tradeInCredit:item.category==='Compounds'?Math.floor((compound?.price||0)*.9):0,upgradeBlocked:item.category==='Compounds'&&compound?.price>=item.price}}),
   members:all('SELECT u.id,u.username,u.xp,m.family_role FROM family_members m JOIN users u ON u.id=m.user_id WHERE m.family_id=? ORDER BY u.xp DESC',f.id).map(p=>({...p,familyRole:p.id===f.leader_id?'don':p.family_role,respect:respectFor(p.id,f.id)})),
   events:all('SELECT message,created_at FROM family_events WHERE family_id=? ORDER BY id DESC LIMIT 20',f.id)}};
 }
 function shipmentOffer(user,kind,tier,scope){
  const p=personal(user.id),m=membership(user.id),f=m?q('SELECT * FROM families WHERE id=?',m.family_id):null;
  const own=p[kind],shared=f?career(kind,f[kind+'_xp']):null;
  // Shared contracts reward both careers without multiplying two exponential curves.
  const respectBonus=scope==='family'&&m?respectFor(user.id,m.family_id):{payoutBonus:0,chanceBonus:0};
  const multiplier=(scope==='family'&&shared?(own.multiplier+shared.multiplier)/2:own.multiplier)*(1+respectBonus.payoutBonus);
  const chance=Math.min(.97,tier.chance+own.chanceBonus+(scope==='family'&&shared?shared.chanceBonus/2+defense(f.id).runBonus:0)+p.muscle.bonus+respectBonus.chanceBonus);
  const factor=passiveMultiplier(progression(user.xp).incomeMultiplier)*multiplier*(1+personalRespect(user.respect_received).incomeBonus);
  return {...tier,marriageBonusPercent:Math.round((marriageBonus(user.id)-1)*100),personalCost:scope==='family'?Math.floor(tier.cost*.4):tier.cost,familyCost:scope==='family'?tier.cost-Math.floor(tier.cost*.4):0,familyVictoryBonus:scope==='family'&&m&&wars.stats(m.family_id).bonusUntil>clock()?.10:0,supplies:operationSupply('shipment',tier),kind,scope,locked:own.level<tier.level||(scope==='family'&&(!shared||shared.level<tier.level)),min:Math.min(MAX_CASH,Math.floor(tier.min*factor)),max:Math.min(MAX_CASH,Math.floor(tier.max*factor)),chance};
 }
 function operations(id){const user=q('SELECT * FROM users WHERE id=?',id);return {personal:personal(id),careerRanks,musclePackages,shipments:['drugs','guns'].flatMap(kind=>['personal','family'].flatMap(scope=>shipmentTiers.map(t=>shipmentOffer(user,kind,t,scope)))),cooldowns:all("SELECT kind,available_at FROM actions WHERE user_id=? AND kind LIKE 'shipment:%'",id)}}
 function shipment(id,body){
  if(!['drugs','guns'].includes(body.kind)||!['personal','family'].includes(body.scope))fail('Choose a career and scope.');
  const tier=shipmentTiers.find(t=>t.id===body.tier);if(!tier)fail('Unknown shipment.');
  return transaction(()=>{
   wars.settle();const user=settleRaw(id);available(user);ready(id,'shipment:'+body.kind);
   const m=body.scope==='family'?familyMember(id):null,offer=shipmentOffer(user,body.kind,tier,body.scope);
   if(offer.locked)fail('Reach the required career rank for this shipment.',403);
   if(user.energy<tier.energy)fail('Not enough energy.',429);
   const ammoUsed=consume(id,body.scope,offer.supplies);debit(id,offer.personalCost);if(m&&!run('UPDATE families SET treasury=treasury-? WHERE id=? AND treasury>=?',offer.familyCost,m.family_id,offer.familyCost).changes)fail('The family treasury cannot cover its share of shipment costs.',409);const success=roll()<offer.chance*10000,rolled=success?draw(offer.min,offer.max):0;
   const familyReward=m?Math.min(Math.floor(rolled*.60*sundayBonus(clock())*(wars.stats(m.family_id).bonusUntil>clock()?1.10:1)),MAX_CASH-q('SELECT treasury FROM families WHERE id=?',m.family_id).treasury):0;
   const personalReward=Math.min(Math.floor((m?Math.floor(rolled*.40):rolled)*marriageBonus(id)),MAX_CASH-(user.cash-offer.personalCost));const xp=success?tier.xp:Math.ceil(tier.xp/5);
   // kind has been checked against a fixed allowlist.
   run('UPDATE users SET cash=cash+?,energy=energy-?,'+body.kind+'_xp=MIN(?,'+body.kind+'_xp+?) WHERE id=?',personalReward,tier.energy,MAX_XP,Math.floor(xp*marriageBonus(id)),id);
   if(user.muscle_until>clock()&&user.muscle_uses>0)run('UPDATE users SET muscle_uses=muscle_uses-1 WHERE id=?',id);
   if(m){run('UPDATE families SET treasury=treasury+?,'+body.kind+'_xp=MIN(?,'+body.kind+'_xp+?) WHERE id=?',familyReward,MAX_XP,Math.floor(xp*sundayBonus(clock())),m.family_id);familyLog(m.family_id,user.username+' completed a '+body.kind+' shipment: '+(success?'success':'failed')+'. Treasury +$'+familyReward+'; career +'+xp+' XP.');}
   cooldown(id,'shipment:'+body.kind,tier.cooldown);run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(?,?,?,?)',id,'shipment',success?1:0,clock());log(id,tier.name+' ('+body.kind+'): '+(success?'success':'failed')+'. Personal payout $'+personalReward+'. Career +'+xp+' XP.');
   return {success,image:`/images/shipment-${body.kind}-${tier.id}.png`,ammoUsed,personalCost:offer.personalCost,familyCost:offer.familyCost,personalReward,familyReward,careerXp:Math.floor(xp*marriageBonus(id)),personalRank:personal(id)[body.kind],familyRank:m?career(body.kind,q('SELECT '+body.kind+'_xp xp FROM families WHERE id=?',m.family_id).xp):null};
  });
 }
 function mystery(id){return transaction(()=>{
  const user=q('SELECT * FROM users WHERE id=?',id),now=clock();let offer=q('SELECT * FROM mystery_offers WHERE user_id=?',id);
  if(offer&&offer.expires_at<=now){run('DELETE FROM mystery_offers WHERE user_id=?',id);offer=null;run('UPDATE users SET mystery_next_at=? WHERE id=?',now+draw(20,45)*60000,id);}
  else if(!offer&&!user.mystery_next_at){run('UPDATE users SET mystery_next_at=? WHERE id=?',now+draw(5,12)*60000,id);}
  else if(!offer&&user.mystery_next_at<=now){
   const job=mysteryJobs[draw(0,mysteryJobs.length-1)],mult=progression(user.xp).incomeMultiplier*(1+personalRespect(user.respect_received).incomeBonus);
   run('INSERT INTO mystery_offers(user_id,kind,reward_min,reward_max,expires_at) VALUES(?,?,?,?,?)',id,job.id,Math.min(MAX_CASH,Math.floor(12000*mult)),Math.min(MAX_CASH,Math.floor(20000*mult)),now+10*60000);
   run('UPDATE users SET mystery_next_at=? WHERE id=?',now+draw(20,45)*60000,id);offer=q('SELECT * FROM mystery_offers WHERE user_id=?',id);
  }
  return {offer:offer?{...offer,reward_min:Math.floor(offer.reward_min*marriageBonus(id)),reward_max:Math.floor(offer.reward_max*marriageBonus(id)),...mysteryJobs.find(j=>j.id===offer.kind),id:offer.id,chance:.85,energy:0,supplies:operationSupply('mystery')}:null};
 })}
 function resolveMystery(id,body){if(!integer(body.id,1)||!['accept','decline'].includes(body.choice))fail('Choose whether to accept this offer.');return transaction(()=>{
  const offer=q('SELECT * FROM mystery_offers WHERE id=? AND user_id=?',body.id,id);if(!offer)fail('This invitation is no longer available.',409);if(offer.expires_at<=clock())fail('This invitation has expired.',409);
  const user=settleRaw(id);if(body.choice==='accept')available(user);
  run('DELETE FROM mystery_offers WHERE id=?',offer.id);run('UPDATE users SET mystery_next_at=? WHERE id=?',clock()+draw(20,45)*60000,id);
  if(body.choice==='decline')return {declined:true,reward:0};
  const ammoUsed=consume(id,'personal',operationSupply('mystery'));
  const success=roll()<8500,reward=success?Math.min(MAX_CASH-user.cash,Math.floor(draw(offer.reward_min,offer.reward_max)*marriageBonus(id))):0;
  run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(?,?,?,?)',id,'contact mission',success?1:0,clock());
  const healthLost=!success&&['attack','liquidation','hostage'].includes(offer.kind)?Math.min(user.health-1,offer.kind==='liquidation'?25:15):0;run('UPDATE users SET cash=cash+?,health=health-? WHERE id=?',reward,healthLost,id);let prisonMinutes=0;if(!success&&roll()<5000){prisonMinutes=draw(5,30);detain(id,'prison',prisonMinutes*60000,prisonMinutes*100000,'The contact mission failed. Arrested for '+prisonMinutes+' minutes.');}const bribe=prisonMinutes?offerBribe(id,{label:'Contact mission',referenceCash:(offer.reward_min+offer.reward_max)/2*marriageBonus(id)}):null;log(id,'Anonymous invitation: '+(success?'completed':'unsuccessful')+'. $'+reward+' earned. No energy spent.');return {bribe,success,ammoUsed,reward,healthLost,prisonMinutes};
 })}
 const wars=installFamilyWars(db,{clock,familyLog,notify,fail});
 const territoryMap=installTerritoryMap(db,{clock,transaction,familyMember,settleRaw,available,familyDebit,familyLog,fail});
 function familyArt(id,plotId=null){
  const pref=q('SELECT crest,banner FROM family_preferences WHERE family_id=?',id),holdings=all('SELECT item_id FROM family_assets WHERE family_id=?',id).map(x=>familyAssets.find(a=>a.id===x.item_id)).filter(Boolean),extensions=all('SELECT upgrade_id FROM compound_upgrades WHERE family_id=?',id).map(x=>compoundUpgrades.find(a=>a.id===x.upgrade_id)).filter(Boolean);
  const selected=holdings.find(a=>a.id===pref?.banner)||extensions.find(a=>'extension:'+a.id===pref?.banner),base=holdings.filter(a=>['Compounds','Safehouses'].includes(a.category)).sort((a,b)=>(b.category==='Compounds')-(a.category==='Compounds')||b.price-a.price)[0],plot=plotId?q('SELECT item_id FROM city_territories WHERE id=? AND owner_id=?',plotId,id):null;
  return {headquartersImage:plot?familyAssets.find(a=>a.id===plot.item_id)?.image||null:selected?.image||(pref?.banner==='city'?'/images/city-new-york.png':base?.image)||null,crest:pref?.crest||'lion'};
 }
 const command=installFamilyCommand(db,{clock,transaction,familyMember,fail,wars,familyArt});
 const warOps=installWarOperations(db,{clock,transaction,settleRaw,available,familyMember,familyDebit,consume,wars,raidQuote,roll,draw,fail,territoryMap});
 function raidQuote(from,target){const attackPower=familyPower(from.id).total,defenderPower=familyPower(target.id).total,protection=defense(target.id);return {attackPower,defenderPower,chance:raidChance(attackPower,defenderPower,protection.reduction),maxLoot:Math.max(0,Math.min(MAX_CASH-from.treasury,Math.floor(target.treasury*.10*(1-protection.lossReduction)))),defense:protection}}
 function rivalView(id){return transaction(()=>{wars.settle();territoryMap.sync();const m=membership(id);if(!m)return {family:null,families:[],wars:[],serverTime:clock()};const from=q('SELECT * FROM families WHERE id=?',m.family_id),current=wars.active(from.id);return {serverTime:clock(),family:{...from,warStats:wars.stats(from.id),...warOps.view(from.id),power:familyPower(from.id).total,capture:territoryMap.captureState(from.id),canManage:['don','capo'].includes(role(m)),activeWar:current?.id||null},wars:wars.history(from.id),families:all('SELECT * FROM families WHERE id<>? ORDER BY name',from.id).map(target=>({...target,capture:territoryMap.captureState(target.id),...familyArt(target.id),warStats:wars.stats(target.id),territory:warOps.territory(target.id),plots:territoryMap.holdings(target.id).map(p=>({...p,captureFactor:territoryMap.factor(p,from.id)})),...raidQuote(from,target),truceUntil:wars.truce(from.id,target.id),activeWar:wars.active(target.id)?.id||null}))}})}
 function raid(id,body){if(!integer(body.familyId,1))fail('Choose a rival family.');return transaction(()=>{
  const u=settleRaw(id);available(u);const m=familyMember(id),from=q('SELECT * FROM families WHERE id=?',m.family_id),target=q('SELECT * FROM families WHERE id=?',body.familyId);
  if(!target||target.id===from.id)fail('Choose another family.');assertHostile(db,from.id,target.id);if(u.xp<500)fail('Requires 500 normal XP.',403);
  if(from.created_at>clock()-3600000||target.created_at>clock()-3600000)fail('New families have one hour of protection.',409);
  if(from.raid_until>clock())fail('Your family is regrouping after its last raid.',429);if(target.shield_until>clock())fail('This family has a recovery shield.',409);
  if(u.energy<35)fail('A family raid costs 35 energy.',429);
  const ammoUsed=consume(id,'family',operationSupply('raid'));
  wars.settle();if(wars.truce(from.id,target.id)>clock())fail('A ceasefire protects these families from mutual raids.',409);
  const quote=raidQuote(from,target),chance=quote.chance,success=roll()<chance*10000;
  const stolen=success?Math.floor(quote.maxLoot*draw(50,100)/100):0;
  const warId=wars.record(from.id,target.id,id,success,stolen,chance,quote.attackPower,quote.defenderPower);
  run('UPDATE users SET energy=energy-35 WHERE id=?',id);run('UPDATE families SET treasury=treasury+?,raid_until=? WHERE id=?',stolen,clock()+15*60000,from.id);run('UPDATE families SET treasury=treasury-?,shield_until=? WHERE id=?',stolen,clock()+15*60000,target.id);
  run('INSERT INTO family_raid_history(attacker_family,target_family,success,loot,created_at) VALUES(?,?,?,?,?)',from.id,target.id,success?1:0,stolen,clock());
  run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(?,?,?,?)',id,'family raid',success?1:0,clock());
  familyLog(from.id,u.username+' raided '+target.name+': '+(success?'success':'failed')+'. Treasury +$'+stolen+'.');
  familyLog(target.id,from.name+' attempted a raid. Treasury loss: $'+stolen+'. A 20-minute recovery shield is active.');
  for(const member of all('SELECT user_id FROM family_members WHERE family_id=?',target.id))notify(member.user_id,'Your family was raided',from.name+' attempted a raid. Treasury lost $'+stolen+'. A 20-minute shield is active.','/images/scene-families.jpg');
  log(id,'Family raid against '+target.name+': '+(success?'success':'failed')+'.');return {success,ammoUsed,reward:stolen,chance,warId,message:(success?'Raid succeeded against ':'Raid failed against ')+target.name+(warId?'. War score updated.':'.'),image:'/images/scene-families.jpg'};
 })}
 const investments=installInvestments(db,{supporterBonus,transaction,settleRaw,familyMember,role,familyLog,log,draw,clock,blockedMillis,maxCash:MAX_CASH});
 function route(method,path,body,user,url=path){
  const commandResult=command.route(method,path,body,user,url);if(commandResult!==null)return commandResult;
  const investmentResult=investments.route(method,path,body,user);if(investmentResult!==null)return investmentResult;
  const id=user.id;
  if(method==='GET'){
   if(path==='/api/empire')return transaction(()=>{wars.settle();return operations(id)});
   if(path==='/api/family/possessions')return transaction(()=>{familyMember(id,true);return familyView(id)});
   if(path==='/api/family')return transaction(()=>{wars.settle();return {...familyView(id),careerRanks}});
   if(path==='/api/family/rivals')return rivalView(id);
   if(path==='/api/family/map')return transaction(()=>territoryMap.view(id,new URL(url,'http://localhost').searchParams.get('city')||'New York'));
   if(path==='/api/mystery')return mystery(id);
   return null;
  }
  if(method!=='POST')return null;
  if(path==='/api/family/map/buy')return transaction(()=>territoryMap.buy(id,body));
  const warOperation=warOps.route(path,body,user);if(warOperation!==null)return warOperation;
  if(path==='/api/shipments/run')return shipment(id,body);
  if(path==='/api/mystery/resolve')return resolveMystery(id,body);
  if(path==='/api/family/raid')return raid(id,body);
  if(path==='/api/family/war/declare'||path==='/api/family/war/surrender')return transaction(()=>{
   const u=settleRaw(id);available(u);const m=familyMember(id,true);
   if(path.endsWith('/surrender'))return wars.surrender(m.family_id);
   if(!integer(body.familyId,1)||body.familyId===m.family_id)fail('Choose a rival family.');
   const target=q('SELECT * FROM families WHERE id=?',body.familyId);if(!target)fail('Family not found.',404);
   return wars.declare(q('SELECT * FROM families WHERE id=?',m.family_id),target);
  });
  const supported=['/api/security/personal','/api/security/muscle','/api/family/donate','/api/family/buy','/api/family/guards','/api/family/role','/api/family/kick','/api/family/leave','/api/families/join'];
  if(!supported.includes(path))return null;
  return transaction(()=>{
   const u=settleRaw(id);
   if(path==='/api/security/personal'){
    if(u.personal_protection>=personalProtectionMax)fail('Personal protection is fully upgraded.',409);const {quantity,cost:price}=order(body.quantity??1,personalProtectionMax-u.personal_protection,u.cash,i=>protectionPrice(u.personal_protection+i),fail);debit(id,price);run('UPDATE users SET personal_protection=personal_protection+? WHERE id=?',quantity,id);log(id,'Upgraded permanent personal protection to level '+(u.personal_protection+quantity)+'.');return {ok:true};
   }
   if(path==='/api/security/muscle'){
    const pack=musclePackages.find(p=>p.id===body.package);if(!pack)fail('Unknown escort package.');if(u.muscle_until>clock()&&u.muscle_uses>0)fail('Use your current escort or wait for it to expire.',409);debit(id,pack.price);run('UPDATE users SET muscle_until=?,muscle_uses=?,muscle_bonus=? WHERE id=?',clock()+pack.minutes*60000,pack.uses,Math.round(pack.bonus*10000),id);log(id,'Hired '+pack.name+'.');return {ok:true};
   }
   if(path==='/api/families/join'){
    if(membership(id))fail('You already belong to a family.',409);if(u.family_join_after>clock())fail('Wait one hour after leaving before joining another family.',429);if(!integer(body.id,1)||!q('SELECT 1 FROM families WHERE id=?',body.id))fail('Family not found.',404);run('INSERT INTO family_members(user_id,family_id) VALUES(?,?)',id,body.id);familyLog(body.id,u.username+' joined the family.');return {ok:true};
   }
   const m=familyMember(id,['/api/family/buy','/api/family/guards'].includes(path));
   if(path==='/api/family/donate'){
    if(!integer(body.amount,1))fail('Enter a whole positive donation.');const f=q('SELECT treasury FROM families WHERE id=?',m.family_id);if(f.treasury+body.amount>MAX_CASH)fail('The treasury has reached its capacity.');debit(id,body.amount);run('UPDATE families SET treasury=treasury+? WHERE id=?',body.amount,m.family_id);const donated=BigInt(respectFor(id,m.family_id).donated)+BigInt(body.amount);run('INSERT INTO family_contributions(user_id,family_id,total) VALUES(?,?,?) ON CONFLICT(user_id,family_id) DO UPDATE SET total=excluded.total',id,m.family_id,donated.toString());familyLog(m.family_id,u.username+' contributed $'+body.amount+'.');return {ok:true};
   }
   if(path==='/api/family/buy'){
    if(familyAssets.find(x=>x.id===body.id)?.category==='Territory')return territoryMap.buy(id,body);
    const item=familyAssets.find(x=>x.id===body.id);if(!item)fail('Unknown family asset.');const qty=q('SELECT quantity FROM family_assets WHERE family_id=? AND item_id=?',m.family_id,item.id)?.quantity||0;if(qty>=item.limit)fail('This family asset is fully acquired.',409);const current=familyAssets.find(x=>x.category==='Compounds'&&holdings(m.family_id).some(a=>a.item_id===x.id));if(item.category==='Compounds'&&current&&item.price<=current.price)fail('Choose a better master compound. Only one base is allowed.',409);const credit=item.category==='Compounds'?Math.floor((current?.price||0)*.9):0,firstPrice=item.category==='Compounds'?item.price-credit:familyPrice(item,qty);const {quantity:count,cost:price}=order(body.quantity??1,item.limit-qty,q('SELECT treasury FROM families WHERE id=?',m.family_id).treasury,i=>item.category==='Compounds'?firstPrice:familyPrice(item,qty+i),fail);familyDebit(m.family_id,price);if(item.category==='Compounds'&&current)run('DELETE FROM family_assets WHERE family_id=? AND item_id=?',m.family_id,current.id);run('INSERT INTO family_assets(family_id,item_id,quantity) VALUES(?,?,1) ON CONFLICT(family_id,item_id) DO UPDATE SET quantity=quantity+1',m.family_id,item.id);if(count>1)run('UPDATE family_assets SET quantity=quantity+? WHERE family_id=? AND item_id=?',count-1,m.family_id,item.id);familyLog(m.family_id,u.username+' acquired '+count+' × '+item.name+' for $'+price+'.');return {ok:true,cost:price,quantity:count,image:item.image,message:count+' × '+item.name+' added to your family.'};
   }
   if(path==='/api/family/guards'){
    const f=q('SELECT guard_until FROM families WHERE id=?',m.family_id);if(f.guard_until>clock())fail('Extra guards are already active.',409);if(defense(m.family_id).reduction>=.75)fail('Your family already has maximum raid defense.',409);familyDebit(m.family_id,500000);run('UPDATE families SET guard_until=? WHERE id=?',clock()+60*60000,m.family_id);familyLog(m.family_id,u.username+' hired extra guards for one hour.');return {ok:true};
   }
   if(path==='/api/family/role'||path==='/api/family/kick'){
    if(!['don','capo'].includes(role(m)))fail('Only the Don and Capos manage members.',403);
    const target=Number.isSafeInteger(body.userId)?q('SELECT m.*,u.role staff_role FROM family_members m JOIN users u ON u.id=m.user_id WHERE m.user_id=? AND m.family_id=?',body.userId,m.family_id):null;
    if(!target)fail('Member not found.',404);if(target.user_id===m.leader_id||target.user_id===id)fail('Choose another member, excluding the Don.',403);
    if(role(m)!=='don'&&(role(m)!=='capo'||target.family_role==='capo'))fail('Only the Don or a Capo can manage lower-ranking members.',403);
    if(target.staff_role==='owner'&&u.role!=='owner')fail('The Owner account is protected.',403);
    if(path==='/api/family/kick'){run('DELETE FROM family_members WHERE user_id=?',target.user_id);run('UPDATE users SET family_join_after=? WHERE id=?',clock()+3600000,target.user_id);familyLog(m.family_id,u.username+' removed player #'+target.user_id+'.');return {ok:true,message:'Member removed. A one-hour rejoin cooldown applies.'};}
    const roles=['member','soldier','enforcer','consigliere','underboss','capo'];if(!roles.includes(body.role)||role(m)!=='don'&&body.role==='capo')fail('Only the Don can appoint a Capo.',403);
    run('UPDATE family_members SET family_role=? WHERE user_id=?',body.role,target.user_id);familyLog(m.family_id,u.username+' appointed player #'+target.user_id+' as '+body.role+'.');return {ok:true,message:'Member role updated to '+body.role+'.'};
   }
   if(path==='/api/family/leave'){
    succeedDon(db,id,clock,fail);run('UPDATE users SET family_join_after=? WHERE id=?',clock()+3600000,id);familyLog(m.family_id,u.username+' left the family.');return {ok:true};
   }
  });
 }
 return {route,personal,defense,settleWars:()=>transaction(()=>wars.settle()),warStats:wars.stats,syncTerritory:territoryMap.sync};
}
