import {drugSalesGuide} from './guide-drug-sales.js';
import {cryptoGuide} from './guide-crypto.js';
import {tradingGuide} from './guide-trading.js';
import {localizedGuideQuery,localizedGuideReply} from './guide-locales.js';
import {referralAdvice} from './referral-guide.js';
import {circuitGuide} from './circuit-guide.js';
import {guideAnswerNL} from './guide-nl.js';

import {findKnowledge,gameKnowledge} from './game-knowledge.js';

import {catalog,assetLimit,purchasePrice} from './catalog.js';

import {employees} from './city-expansion.js';

import {familyAssets} from './empire-catalog.js';

import {AMMO_MAX} from './logistics.js';

import {WEDDING_COST} from './player-systems.js';

import {progression} from './progression.js';

export const guideTopics=[

 ['auction-house','Auction house',/auction house|auction|veiling/,'Open Auction house under Finances to bid on art and recovered vehicles. List items from their collection pages. Art commission is 8%; vehicle sales charge 3% plus a non-refundable listing fee.'],
 ['art-market','Art & antiquities',/art\b|auction|antique|kunst|antiek|veiling|taxatie/,'Recover unique art through heists, appraise it to reveal authenticity and trade at auction. Bids are escrowed and refunded if outbid. Commission is 8%; auctions last 6, 12 or 24 hours with up to 30 minutes of anti-sniping extension. Three distinct certified originals give 1% income, capped at 3%; auctioned pieces do not count.'],

 ['prison','Police bribes',/brib|omkop|omkoop|corrupt|politie|police/,'Some failed crimes or missions that actually cause arrest offer a police bribe: 30% chance, at most 90 seconds to pay in cash. Price follows your rank and job value, with a ceiling of 65% of initial bail. Arrest remains in force until payment succeeds; closing, declining or expiry keeps you in prison. No extra rewards or XP.'],

 ['directory','Autonomous players',/\bbots?\b|automated|autonoom/,'Bot players are visibly marked automated characters. They use normal player handlers, pay the same costs and obey rank, storage, custody, cooldown and family-role restrictions. All personalities can choose ordinary gameplay domains, with different activity and preferences. They do not receive staff powers or make real payments. Not every action is appropriate or available on every turn.'],

 ['warehouses','Warehouses',/warehouse|opslag|magazijn|gestolen|stolen|garage|car theft/,'Vehicle warehouses hold twenty recovered vehicles each, with five warehouses maximum. Production warehouses provide one thousand total crates each across all drugs; buy them before production. Car theft awards a vehicle with 1–5 condition stars: Worn 55%, Used 25%, Good 13%, Perfect 6%, Pristine 1%. Model, condition, city and hourly quote determine its value. Sell, store or swap a stored car if full. Stored vehicles can be auctioned from Warehouses with your own minimum price, a non-refundable listing fee and 3% sale commission. Shipping between cities has a small interception risk. Purchased cars use ten separate six-bay garages (sixty places total) and eighty-percent purchase-price resale.'],

 ['crypto','Crypto exchange',/crypto|coin|wallet/,'Trade fictional coins on Crypto exchange under Finances. Quotes update every five minutes. Buy MAX respects cash and the $10 trillion purchase basis limit per coin. A 1% spread applies on each side.'],

 ['investments','Investments',/invest|beleg|rente/,'Invest personal or family funds for up to 72 hours, with up to $10,000,000,000,000 active principal and at most 8% total quoted return. Only Don and Capo manage family investments.'],

 ['missions','Crimes',/crime|misdaad|misdaden|overval|earn|verdien/,'Crimes need energy, ammunition and the listed weapon tier. Your rank improves rewards and success. A Big Score has a 5% chance and triples the successful cash and XP reward.'],

 ['team-missions','Team missions',/team|crew|samen|coop/,'Recruit exactly 2, 3, 4 or 5 players. Joining approves the displayed launch costs. The leader launches the full crew. Each player needs personal supplies and earns their own reward.'],

 ['armory','Weapons & ammunition',/weapon|wapen|ammo|ammunition|kogel/,'Your armory holds up to 10,000 copies per weapon and 1,000,000 rounds. A weapon is permanent; rounds are consumed on success and failure. The quantity control shows the full increasing purchase cost.'],

 ['employees','Employees',/employee|werknemer|staff income/,'Employee limits and specialties vary: some earn cash, some add Power, and your Personal Chauffeur earns respect. Income pauses in prison/hospital and stops after 24 active earning hours until all saved personal income is claimed.'],

 ['bank','Bank',/bank/,'The bank handles deposits and withdrawals. Crypto exchange and Investments have their own pages under Finances. Coins change price every five minutes; buy and sell quotes include a 1% spread on each side. Investments lock at a quoted return for up to 72 hours, with a $10,000,000,000,000 principal cap.'],

 ['business','Businesses',/business|bedrijf|bedrijven|passi/,'Businesses pay passive income. Buy up to ten per type; extra copies cost more. The displayed hourly income includes your current bonuses. Previously earned income is kept when detained; new income stops during detention. Personal passive cash stops after 24 active earning hours until saved income is claimed.'],

 ['families','My family',/family|familie|don|capo|allian/,'Joining an open family is free. Founding a family costs $1 million. Don and Capo manage purchases. Families can form consensual alliances, develop shared careers and cooperate in wars.'],

 ['family-compounds','Master compounds',/compound|hoofdkwartier|basis|upgrade/,'A family owns one master compound. Moving credits 90% of the old base price. Five permanent extensions add Power and shipment success, separate from security upgrades.'],

 ['family-territory','Territory',/territor|gebied|map|kaart/,'Territory is visible on city maps. Your family is gold, allies green, rivals red and unclaimed plots uncolored. Cities have 40–60 differently sized geographic parcels. Buy 25 per city and hold 10 additional conquered plots per city, for 35 total. Each city permits one successful capture per 24 hours and a 15-minute attempt cooldown; losing families receive a 24-hour capture shield in that city.'],

 ['rivals','Rival families',/war|oorlog|raid|rival/,'A war lasts up to 24 hours. The war room contains raids, capture, sabotage and joint assaults. Allies cannot attack each other. Raid theft is limited to 10% of cash treasury, before protection.'],

 ['prison','Prison',/prison|gevangen|breakout|uitbraak|arrest|bail/,'Prison shows current prisoners, decreasing bail and breakout missions. Breakout career has 15 ranks and raises the success chance to at most 95%. A failed rescue can put the rescuer in prison for six hours.'],

 ['hospital','Hospital',/hospital|ziekenhuis|coma|health|gezond/,'Successful liquidation causes a 72-hour coma. The release price depends on rank and remaining time. Personal funds, selected assets, another player or the family can fund release.'],

 ['marriage','Marriage',/marriage|wedding|trouw|huwelijk/,'A wedding costs $'+WEDDING_COST.toLocaleString('en-US')+' after the other player accepts. Both spouses receive a 10% bonus on eligible activities. Send and manage invitations on Marriage.'],

 ['shipments','Drugs & gun shipments',/shipment|drugrun|smokkel|connect/,'Drugs and guns each have 15 career ranks, personally and for the family. Complete shipments to gain career XP. Temporary muscle raises your chances; family missions use the shared armory.'],

 ['production','Drug production',/production|productie|grow|kweek/,'Choose a product and a 6-, 12- or 24-hour batch. Pay production cost first. Sell locally or send completed stock to another city by boat, plane or regional truck. Each drug has different production and sale factors per city. Dispatch fees, time and interception risk are quoted before you send; intercepted cargo is lost. Detention pauses personal production.'],

 ['airport','Airport',/airport|vlieg|flight|city|stad|heat/,'Own a private jet to fly between 15 cities. Flight fees and a cooldown apply. Heat stays on record in the city you leave, while the destination uses its own local heat.'],

 ['casino','Casino',/casino|lotter|poker|blackjack|roulette|fruit|safe code/,'Play Higher or Lower, Blackjack, roulette, safe cracking, video poker or slots. All bets use game cash. The daily lottery awards 200% of ticket sales. The winner wears Lucky Winner for 24 hours after the draw.'],

 ['respect','Player respect',/respect/,'Give respect to up to five different players per UTC day. Received respect builds your respect rank. Family respect can be given on My family.'],

 ['achievements','Introduction & achievements',/achievement|prestatie|medal|milestone|intro/,'Introductory missions guide you towards a business, family and team mission. Earn permanent achievement titles, matching medals and profile colors, then claim one-time milestone XP.'],

 ['profile','My profile',/avatar|profile|profiel|color|kleur|title|titel/,'Your profile shows rank, Power, family, possessions and progression. Customize it with curated avatars, unlocked titles, frames and colors. External image uploads are not allowed.'],

 ['ranks','Ranks & rewards',/rank|rang|godfather|xp|level/,'There are 25 main ranks, ending with The Godfather. Further XP earns legacy distinctions. Rank increases restore energy, raise its maximum and increase income. The ranks page shows thresholds and bonuses.'],

 ['daily','Daily objectives',/daily|dagelijk|objective/,'Daily objectives reset at 00:00 UTC. Complete the listed activities and claim each reward before the reset.'],

 ['messages','Messages',/message|bericht|inbox/,'Open a private conversation and reply with Enter. Shift+Enter adds a new line. Click a name to open the player profile.'],

 ['support','Support & reports',/helpdesk|bug|issue|report|melding|support|blocked|block|mute/,'Send a private support ticket to the game team. Choose a category and describe the issue. Blocking and muting are available through player interactions.'],

 ['rules','Game rules',/rule|regel|allowed|mag|cheat|bot/,'Game rules describe rewards, cooldowns and restrictions. Community & privacy covers conduct and data handling. No bots, exploits, harassment, threats or sharing private information.'],

 ['bulletins','Announcements & events',/event|sunday|zondag|change|nieuw|update/,'Announcements contains events and Changelogs. Sunday Funday runs every Sunday, 00:00–24:00 UTC: 1.5× eligible earned payouts and XP. Transfers, principal and gifts are excluded.']

];

export function guideAnswer(db,u,question,time=Date.now(),context={}){
 const crypto=cryptoGuide(question,u,time,context);if(crypto)return crypto;
 const trading=tradingGuide(question,context);if(trading)return trading;
 const sales=drugSalesGuide(question,u,time,context);if(sales)return sales;
 if(['es','fr','de'].includes(context.language))return localizedGuideReply(guideAnswer(db,u,localizedGuideQuery(question,context.language),time,{...context,language:'en',knowledgeLanguage:context.language}),u,context);

 const topicQuery=String(question||'').toLowerCase(),dutch=context.language==='nl';
 if(/language|dutch|nederlands|taal(?:keuze)?/.test(topicQuery))return {name:'Luca Moretti',mode:'local',answer:dutch?'Engels is de standaardtaal. Kies Nederlands (NL), Spaans (ES), Frans (FR) of Duits (DE) via het vlagmenu boven Uitloggen. Rangnamen, door spelers geschreven inhoud, dollars en de bestaande nummernotatie blijven ongewijzigd.':'English is the default. Select Dutch (NL), Spanish (ES), French (FR) or German (DE) from the flag menu above Log out. Rank names, player content, dollars and number punctuation stay unchanged.',links:[{tab:'faq',label:dutch?'FAQ':'FAQ'}],suggestions:[]};
 if(/push|device notification|browser notification/.test(topicQuery))return {name:'Luca Moretti',mode:'local',answer:dutch?'Pushmeldingen op apparaten zijn voorlopig gepauzeerd. Meldingen in het spel blijven werken. Voor latere activering zijn HTTPS, VAPID-sleutels, toestemming en tests op echte apparaten nodig.':'Device push notifications are temporarily paused. In-game notices still work. Future activation needs HTTPS, VAPID keys, permission and real-device tests.',links:[{tab:'dashboard',label:'Dashboard'}],suggestions:[]};
 if(/income cap|24.hour|24 uur|inkomen.*(?:vol|limiet|claim)|passive.*(?:cap|collect)|hourly income/.test(topicQuery)){
  const elapsed=Math.floor((context.incomeClock?.elapsed||0)/3600000),saved='$'+Number(u.pending_income||0).toLocaleString('en-US'),detained=Math.max(u.prison_until||0,u.hospital_until||0)>time;
  return {name:'Luca Moretti',mode:'local',answer:dutch?'Persoonlijk passief geld stopt na 24 actieve verdienuren totdat je al het opgeslagen inkomen claimt. Pagina’s openen of opnieuw inloggen omzeilt dit niet. Coma en gevangenis pauzeren de teller. Nu: '+elapsed+'/24 uur; opgeslagen '+saved+'.'+(detained?' Regel eerst je vrijlating.':' Claim via Dashboard.'): 'Personal passive cash stops after 24 active earning hours until all saved income is claimed. Browsing or signing in cannot bypass the cap. Coma and prison pause the clock. Current cycle: '+elapsed+'/24 hours; saved '+saved+'.'+(detained?' Arrange release first.':' Collect on Dashboard.'),links:[{tab:'dashboard',label:'Dashboard'}],suggestions:[]};
 }
 if(/referral|aanbreng|verwijz|invite.*friend|vriend.*uitnodig/.test(String(question||'').toLowerCase()))return referralAdvice(context.referrals,context.language);
 if(context.language==='nl')return guideAnswerNL(db,u,question,time,context);

 const q=(s,...v)=>db.prepare(s).get(...v),p=progression(u.xp),query=String(question||'').slice(0,500).toLowerCase();

 if(/crown jewels|sovereign curator|top.*(?:art|antique)|hoogste.*(?:kunst|antiek)/.test(query)){const m=context.milestones?.find(x=>x.key==='artCrownJewels'),h=context.art?.heists.find(x=>x.id==='treasury');return {name:'Luca Moretti',mode:'local',answer:'Personally steal Diamond Phoenix and Platinum Crown from The Sovereign Collection, then certify both as originals. Auction purchases do not qualify. Confirmed progress: '+(m?.progress||0)+'/2. A successful heist awards one object; the highest-value loot is rarest. '+(h?h.xp.toLocaleString('en-US')+' XP · '+h.energy+' energy · '+h.ammo+' rounds · tier '+h.tier+' · $'+h.fee.toLocaleString('en-US')+' · '+(h.available&&context.art.cooldownUntil<=time?'available now':'not available yet'):'Check current requirements on Art & antiquities.'),links:[{tab:'art-market',label:'Art & antiquities'},{tab:'achievements',label:'Introduction & achievements'}],suggestions:[]};}
 if(/achievement|milestone|prestatie|onderscheiding/.test(query)&&/pristine|art|antique|kunst|antiek/.test(query)){const key=/pristine/.test(query)?'pristineThefts':'artOriginals',list=(context.milestones||[]).filter(m=>m.key===key);return {name:'Luca Moretti',mode:'local',answer:(key==='pristineThefts'?'Personally steal 1, 5 or 25 Pristine cars. Auction purchases do not count; selling your theft does not erase your record. ':'Hold 1, 5, 10 or all 25 distinct appraised originals. Reproductions, duplicates and listed pieces do not count. ')+list.map(m=>m.name+': '+m.progress+'/'+m.target+(m.earnedAt?' (earned)':'')).join(' · ')+' Titles and medals stay unlocked after earning them; claim milestone XP on Introduction & achievements.',links:[{tab:'achievements',label:'Introduction & achievements'},{tab:key==='pristineThefts'?'warehouses':'art-market',label:key==='pristineThefts'?'Vehicle warehouses':'Art & antiquities'}],suggestions:[]};}
 if(/auction house|veilinghuis|autoveiling|car auction|vehicle auction/.test(query)&&!/condition|pristine|sterren/.test(query)){const topic=guideTopics.find(x=>x[0]==='auction-house');return {name:'Luca Moretti',mode:'local',answer:topic[3]+(Math.max(u.prison_until||0,u.hospital_until||0)>time?' Arrange your release before bidding.':''),links:[{tab:'auction-house',label:'Auction house'}],suggestions:[]};}
 if(context.circuit&&/midnight|circuit|racing|street.?rac|straat.?rac|race\b|races\b|rijrang/.test(query))return circuitGuide(context.circuit,u,time,'en');
 const suggestions=[];if(u.pending_income>0&&u.cash<1000000000000000&&Math.max(u.prison_until||0,u.hospital_until||0)<=time)suggestions.push({tab:'dashboard',label:'Collect your hourly income',text:'Uncredited personal income: $'+Math.min(u.pending_income,1000000000000000-u.cash).toLocaleString('en-US')+'.'});if(/pristine|condition|sterren|(?:vehicle|car|auto).*?(?:auction|veiling)/.test(query)){const topic=guideTopics.find(x=>x[0]==='warehouses');return {name:'Luca Moretti',mode:'local',answer:topic[3]+(context.vehicles?.pending?' Your pending car is '+context.vehicles.pending.name+', '+context.vehicles.pending.condition_stars+' stars, current quote $'+context.vehicles.pending.saleValue.toLocaleString('en-US')+'.':''),links:[{tab:topic[0],label:topic[1]}],suggestions};}if(context.art){const a=context.art,raw=a.collection.find(o=>!o.appraised&&o.appraisalCost<=u.cash);if(raw&&Math.max(u.prison_until||0,u.hospital_until||0)<=time)suggestions.push({tab:'art-market',label:'Appraise your recovered art',text:raw.name+' · $'+raw.appraisalCost.toLocaleString('en-US')+' appraisal. Authenticity and value are unknown until appraisal.'});if(/kunst|antiek|veiling|taxatie|art\b|auction|antique/.test(query))return {name:'Luca Moretti',mode:'local',answer:guideTopics.find(t=>t[0]==='art-market')[3]+' Your collection has '+a.bonus.unique+' unique certified originals and a '+Math.round(a.bonus.income*100)+'% income bonus. '+(u.prison_until>time||u.hospital_until>time?'Arrange release before trading.':a.cooldownUntil>time?'Your next art heist is on cooldown.':'Check the live heist requirements before spending.'),links:[{tab:'art-market',label:'Art & antiquities'}],suggestions};}if(u.prison_until>time)suggestions.push({tab:'prison',label:'Arrange your release',text:'You are currently in prison. Your activities and passive income are paused.'});else if(u.hospital_until>time)suggestions.push({tab:'hospital',label:'View your recovery',text:'You are recovering in hospital. Arrange treatment or wait for recovery.'});

 const ammo=q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=?",u.id)?.ammo||0;if(ammo<10)suggestions.push({tab:'armory',label:'Restock ammunition',text:'You have '+ammo+' rounds. Restock before attempting another operation.'});

 if(!q("SELECT 1 FROM possessions WHERE user_id=? AND category='business'",u.id)){const first=catalog.find(x=>x.category==='business');suggestions.push({tab:u.cash>=first.price?'business':'missions',label:'Work towards your first business',text:first.name+' costs $'+first.price.toLocaleString('en-US')+'. You currently have $'+u.cash.toLocaleString('en-US')+'.'})}

 if(!q('SELECT 1 FROM family_members WHERE user_id=?',u.id))suggestions.push({tab:'families',label:'Find a family',text:'Join an open family for free, or save $1 million to found your own.'});

 suggestions.push({tab:'daily',label:'Check today’s objectives',text:'Look for objectives that overlap with the activities you want to play.'},{tab:'team-missions',label:'Find a crew',text:'Recruit a crew for a team mission. Each player earns their own reward.'},{tab:'ranks',label:'Your next rank',text:'You are '+p.rank+'. Next: '+p.nextRank+' at '+p.nextRankXp.toLocaleString('en-US')+' XP ('+Math.max(0,p.nextRankXp-u.xp).toLocaleString('en-US')+' remaining).'});

 const holdings=db.prepare('SELECT category,item_id,quantity FROM possessions WHERE user_id=?').all(u.id);

 const opportunities=catalog.filter(a=>a.category==='business').map(a=>{const count=holdings.find(h=>h.category===a.category&&h.item_id===a.id)?.quantity||0;return {...a,count,nextCost:purchasePrice(a,count)}}).filter(a=>a.count<assetLimit(a)&&a.nextCost<=u.cash).sort((a,b)=>b.income/b.nextCost-a.income/a.nextCost);

 if(opportunities[0]&&Math.max(u.prison_until,u.coma_until,u.hospital_until)<=time){const a=opportunities[0];suggestions.unshift({tab:'business',label:'An affordable income investment',text:a.name+' costs $'+a.nextCost.toLocaleString('en-US')+' for your next copy. Among your affordable businesses it has the best base hourly income per dollar. Keep ammunition and mission costs in reserve.'})}

 if(/respect/.test(query)&&!q("SELECT 1 FROM employees WHERE user_id=? AND item_id='driver'",u.id))suggestions.unshift({tab:'employees',label:'Build respect with a chauffeur',text:'Personal Chauffeur earns '+employees.find(e=>e.id==='driver').respectPerDay+' respect per active day; player respect gifts provide another route.'});

 const goal=/respect/.test(query)?'respect':/cash|money|geld|income|verdien/.test(query)?'cash':'xp';

 const detained=Math.max(u.prison_until||0,u.coma_until||0,u.hospital_until||0)>time;

 if(!detained){

  const inv=context.armory||{tier:0,ammo:0};const cooldowns=db.prepare('SELECT kind,available_at FROM actions WHERE user_id=?').all(u.id);

  const ready=(context.crimes||[]).filter(c=>u.health>=10&&!c.locked&&u.xp>=c.requiredXp&&u.energy>=c.energy&&inv.tier>=c.supplies.tier&&inv.ammo>=c.supplies.ammo&&!cooldowns.some(cd=>cd.kind===c.id&&cd.available_at>time));

  const score=c=>(goal==='cash'?((c.payout.min+c.payout.max)/2*c.chance-c.supplies.ammo*context.ammoPrice):c.xp*c.chance)/c.energy;

  ready.sort((a,b)=>score(b)-score(a));

  if(ready[0]){const c=ready[0];suggestions.unshift({tab:'missions',label:goal==='cash'?'A cash-efficient crime you can attempt now':'An XP-efficient crime you can attempt now',text:c.name+' has '+Math.round(c.chance*100)+'% success, costs '+c.energy+' energy and '+c.supplies.ammo+' rounds. '+(goal==='cash'?'Expected successful reward contribution less ammunition: about $'+Math.floor((c.payout.min+c.payout.max)/2*c.chance-c.supplies.ammo*context.ammoPrice).toLocaleString('en-US')+' per attempt.':'Successful reward: '+c.xp.toLocaleString('en-US')+' XP. Ranked by expected successful XP per energy.')+' This comparison excludes Big Scores, fines, detention and cooldown strategy; check the live card before committing.'});}

  const count=q('SELECT COUNT(*) n FROM respect_gifts WHERE sender_id=? AND day=?',u.id,new Date(time).toISOString().slice(0,10)).n;

  if(goal==='respect')suggestions.unshift({tab:'respect',label:'Your respect plan',text:'You have '+u.respect_received+' received respect. You can give respect to '+Math.max(0,5-count)+' more different players today, earning cash and energy within your cap. Giving does not itself increase received respect. Build relationships or hire a Personal Chauffeur for passive received respect.'});

  const hires=db.prepare('SELECT item_id,quantity FROM employees WHERE user_id=?').all(u.id),earner=employees.filter(e=>e.income&&e.price<=u.cash&&(hires.find(h=>h.item_id===e.id)?.quantity||0)<e.limit).sort((a,b)=>b.income/b.price-a.income/a.price)[0];

  if(goal==='cash'&&earner)suggestions.unshift({tab:'employees',label:'An employee within your budget',text:earner.name+' costs $'+earner.price.toLocaleString('en-US')+' and pays $'+earner.income.toLocaleString('en-US')+' base per active hour. Base payback '+(earner.price/earner.income).toFixed(1)+' hours, before bonuses. Keep supplies in reserve.'});

 }else suggestions.splice(1);

 if(!detained){

  const claims=(context.milestones||[]).filter(m=>m.earnedAt&&!m.xpClaimed);if(claims.length)suggestions.unshift({tab:'achievements',label:'Collect earned milestone XP',text:claims.map(m=>m.name+' ('+m.xpReward.toLocaleString('en-US')+' XP)').join(', ')+'. These milestones are already earned and cost no energy to claim.'});

  const daily=(context.daily||[]).filter(d=>!d.claimed&&d.progress>=d.target);if(daily.length)suggestions.unshift({tab:'daily',label:'Claim completed daily rewards',text:daily.map(d=>d.name+': $'+d.cash.toLocaleString('en-US')+' and '+d.xp.toLocaleString('en-US')+' XP').join('; ')+'. Claim before the UTC reset.'});

 }

 const market=context.market;

 if(/brib|omkop|omkoop|corrupt|politie|police/.test(query)){

  const offer=context.bribe,parts=[guideTopics.find(t=>t[1]==='Police bribes')[3]];

  parts.push(offer?'Your current offer costs $'+offer.cost.toLocaleString('en-US')+' and expires '+new Date(offer.expires_at).toISOString()+'. '+(u.cash>=offer.cost?'You have enough cash.':'Your cash is insufficient; normal bail options remain available.'):'There is no active police offer on your account. A new offer is not guaranteed.');

  return {name:'Luca Moretti',mode:'local',answer:parts.join('\n\n'),links:[{tab:'prison',label:'Prison & release options'}],suggestions:suggestions.slice(0,5)};

 }

 const vehicles=context.vehicles;

 if(vehicles&&!detained){

  if(vehicles.pending)suggestions.unshift({tab:'warehouses',label:'Resolve your recovered car',text:vehicles.pending.name+' is waiting for a decision. Current local quote $'+vehicles.pending.saleValue.toLocaleString('en-US')+'. '+(vehicles.used<vehicles.capacity?'A warehouse bay is available.':'Storage is full or missing: sell immediately, or replace one stored car if you own storage.')+' Resolve this before the next car theft.'});

  else if(vehicles.best&&(goal==='cash'||/car|auto|vehicle|voertuig|warehouse|opslag/.test(query))){const b=vehicles.best;suggestions.unshift({tab:'warehouses',label:'A current vehicle transport opportunity',text:b.name+': '+b.mode+' from '+b.city+' to '+b.destination+'. Local sale $'+b.localValue.toLocaleString('en-US')+', destination $'+b.saleValue.toLocaleString('en-US')+', freight $'+b.cost.toLocaleString('en-US')+', '+b.hours+'h and '+(b.risk*100).toFixed(1)+'% interception. Expected proceeds after freight/risk $'+Math.floor(b.expected).toLocaleString('en-US')+'. Future quotes may change; not guaranteed profit.'});}

 }

 if(vehicles&&/car theft|stolen|gestolen|vehicle|warehouse|opslag|garage|auto.*verkop/.test(query)){

  const paragraphs=[guideTopics.find(t=>t[0]==='warehouses')[3],'Your storage: '+vehicles.used+'/'+vehicles.capacity+' recovered-car bays. Purchased-car garages: '+vehicles.garageUsed+'/'+vehicles.garageCapacity+' bays.'];

  if(detained)paragraphs.push('You are detained. Selling, storing and dispatching vehicles are unavailable until release.');

  if(vehicles.pending)paragraphs.push('Pending recovery: '+vehicles.pending.name+', live local sale value $'+vehicles.pending.saleValue.toLocaleString('en-US')+'. Sell, store or exchange from Warehouses.');

  if(vehicles.best&&!detained){const b=vehicles.best;paragraphs.push('Best affordable current transport improvement among your stored cars: '+b.name+' → '+b.destination+' by '+b.mode+'. Sale quote $'+b.saleValue.toLocaleString('en-US')+', freight $'+b.cost.toLocaleString('en-US')+', interception '+(b.risk*100).toFixed(1)+'%, expected proceeds $'+Math.floor(b.expected).toLocaleString('en-US')+' versus $'+b.localValue.toLocaleString('en-US')+' locally. Quotes expire '+new Date(vehicles.until).toISOString()+'. Prices can change before arrival.');}

  return {name:'Luca Moretti',mode:'local',answer:paragraphs.join('\n\n'),links:[{tab:'warehouses',label:'Warehouses & recovered cars'},{tab:'garage',label:'Private garages'}],suggestions:suggestions.slice(0,5)};

 }

 if(/territor|verover|capture|gebied|map|kaart/.test(query)){

  const f=context.family,parts=[guideTopics.find(t=>t[0]==='family-territory')[3],'Maps follow approximate historical city outlines, with fictional game parcels rather than official districts. Larger plots represent districts; smaller plots represent blocks. Capture costs $2.5 million, 45 energy and 75 family rounds. An active war, territorial foothold and Don/Capo authority are required. Relative family Power and defense affect success; the chance remains between 5% and 90%.'];

  if(!f)parts.push('Join a family first.');else{const c=f.capture.perCity?.[u.city]||{captured:0,attemptUntil:0,successUntil:0};parts.push('Your family currently holds '+c.captured+'/10 conquered plots in '+u.city+'. Treasury $'+f.treasury.toLocaleString('en-US')+'.');if(c.attemptUntil>time)parts.push('Attempt cooldown until '+new Date(c.attemptUntil).toISOString()+'.');if(c.successUntil>time)parts.push('Next successful capture allowed after '+new Date(c.successUntil).toISOString()+'.');if(c.captured>=10)parts.push('The conquered holding limit is full. Losing a conquered plot frees one slot.');if(!f.canManage)parts.push('Ask your Don or Capo to buy or capture land.');}

  if(detained)parts.push('Your detention prevents participating in captures until release.');

  return {name:'Luca Moretti',mode:'local',answer:parts.join('\n\n'),links:[{tab:'family-territory',label:'City territories'},{tab:'rivals',label:'Rival families & war room'}],suggestions:suggestions.slice(0,5)};

 }

 const describeMarket=o=>o.name+': produce one crate in '+o.origin+' ('+o.productionHours+'h), '+o.transport.toLowerCase()+' to '+o.destination+' ('+o.transportHours+'h). Production $'+o.productionCost.toLocaleString('en-US')+', freight $'+o.transportCost.toLocaleString('en-US')+(o.flightCost?', relocation flight $'+o.flightCost.toLocaleString('en-US'):'')+'. Current sale quote $'+o.saleValue.toLocaleString('en-US')+'. Net if delivered $'+Math.floor(o.netProfit).toLocaleString('en-US')+' ('+o.netMargin.toFixed(1)+'%); interception '+Math.round(o.risk*100)+'%. Risk-adjusted expected net $'+Math.floor(o.expectedProfit).toLocaleString('en-US')+' per batch, about $'+Math.floor(o.expectedPerHour).toLocaleString('en-US')+'/hour.';

 if(market&&!detained&&market.bestAvailable&&market.slotsUsed<5&&(goal==='cash'||!query))suggestions.unshift({tab:'production',label:'Your current production opportunity',text:describeMarket(market.bestAvailable)});

 if(market&&/drug|production|productie|crates|cannabis|hashish|ecstasy|cocaine|methamphetamine|transport|market|markt/.test(query)){

  const parts=['Live market comparison, refreshed for this request. It compares unlocked drugs, all cities, 6/12/24-hour terms and available transport modes for one crate, ranked by risk-adjusted expected profit per total production and transport hour.'];

  if(detained)parts.push('You are detained. Production actions are unavailable until release.');

  if(market.storage&&market.storage.used>=market.storage.capacity)parts.push('Production storage is full or missing. Buy a Production warehouse under My empire → Warehouses before starting another batch. Each warehouse holds 1,000 unsold crates shared across all drugs.');

  if(market.bestAvailable)parts.push((market.slotsUsed>=5?'All five production slots are occupied. After freeing a slot, an affordable route would be: ':'Best within your current cash and travel access: ')+describeMarket(market.bestAvailable));else parts.push('No new route fits your current cash and travel access. Earn cash or review existing stock first.');

  if(market.bestMarket)parts.push('Best market combination for your unlocked drugs: '+describeMarket(market.bestMarket)+(market.bestMarket.requiresTravel&&!market.hasJet?' You would first need a private jet to produce in that city.':''));

  if(market.bestStock){const b=market.bestStock;parts.push('For your completed stock, batch #'+b.batch+' ('+b.name+'): '+b.transport+' to '+b.destination+' has the highest current expected net, $'+Math.floor(b.expectedProfit).toLocaleString('en-US')+'. Net if delivered $'+Math.floor(b.netProfit).toLocaleString('en-US')+' ('+b.netMargin.toFixed(1)+'%); interception '+Math.round(b.risk*100)+'%.');}

  parts.push('Quotes expire '+new Date(market.until).toISOString()+'. Prices may move during production or transit. These are estimates, not guaranteed profits; larger cargo changes fees and risk. Recheck the route quote before dispatch.');

  return {name:'Luca Moretti',mode:'local',answer:parts.join('\n\n'),links:[{tab:'warehouses',label:'Warehouses & vehicle collections'},{tab:'production',label:'Production & live city markets'},{tab:'airport',label:'Airport & relocation'}],suggestions:suggestions.slice(0,5),market};

 }

 const directMatches=guideTopics.filter(([, ,pattern])=>pattern.test(query)),directTopic=directMatches.find(x=>['family-compounds','family-territory','rivals','production','respect'].includes(x[0]))||directMatches.find(x=>!['missions','families'].includes(x[0]))||directMatches[0];

 const knowledge=findKnowledge(query,context.knowledgeLanguage||'en');

 if(query&&knowledge.length&&(!guideTopics.some(([, ,p])=>p.test(query))||knowledge[0].title.toLowerCase()===query||knowledge[0].score>=10))return {name:'Luca Moretti',mode:'local',knowledgeCount:gameKnowledge().length,answer:knowledge.map(k=>k.title+': '+k.text).join('\n\n'),links:[...(directTopic?[{tab:directTopic[0],label:directTopic[1]}]:[]),...knowledge.filter(k=>k.tab!==directTopic?.[0]).map(k=>({tab:k.tab,label:k.title}))].slice(0,3),suggestions:suggestions.slice(0,5)};

 const named=[...catalog.map(a=>({...a,tab:a.category})),...employees.map(a=>({...a,tab:'employees'})),...familyAssets.map(a=>({...a,tab:'family-assets'}))].find(a=>query.length>3&&(query.includes(a.name.toLowerCase())||a.name.toLowerCase().includes(query)));

 if(named)return {name:'Luca Moretti',mode:'local',answer:named.name+': $'+named.price.toLocaleString('en-US')+' base price. Limit: '+(named.limit??assetLimit(named))+'. '+(named.income?'Base passive income: $'+named.income.toLocaleString('en-US')+' per hour. ':'')+(named.power?'Power: '+named.power+'. ':'')+(named.respectPerDay?'Respect per active day: '+named.respectPerDay+'. ':'')+(named.description||''),links:[{tab:named.tab,label:named.name}],suggestions:suggestions.slice(0,5)};

 const matches=guideTopics.filter(([, ,pattern])=>pattern.test(query));let topic=matches.find(x=>['family-compounds','family-territory','rivals','production','respect'].includes(x[0]))||matches.find(x=>!['missions','families'].includes(x[0]))||matches[0];if(topic?.[0]==='employees')topic=[...topic.slice(0,3),employees.map(e=>e.name+': max '+e.limit.toLocaleString('en-US')+', '+(e.income?'$'+e.income.toLocaleString('en-US')+'/hour; ':'')+(e.power?e.power+' Power; ':'')+(e.respectPerDay?e.respectPerDay+' respect/day; ':'')).join(' ')];if(topic?.[0]==='armory')topic=[...topic.slice(0,3),'Your armory holds '+AMMO_MAX.toLocaleString('en-US')+' rounds and up to 10,000 copies per weapon. Missions consume ammunition on success and failure.'];return {name:'Luca Moretti',mode:'local',answer:topic?topic[3]:'I can help you plan your next move and find game pages. Based on your current account, these are useful next steps. Ask about a topic such as crypto, family operations, marriage, rules or your next rank.',links:topic?[{tab:topic[0],label:topic[1]}]:[],suggestions:suggestions.slice(0,5)};

}

