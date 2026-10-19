import {familyCrests} from './community.js';
import {referralEvent} from './referrals.js';
import {circuitRules} from './public/circuit-rules.js';
import {raceRoutes,driverRanks} from './midnight-catalog.js';
import {translateGenerated} from './public/generated-locale.js';
import {createTranslator} from './public/i18n.js';
import {artCatalog,artHeists} from './art-market.js';
import {stolenVehicles} from './vehicle-catalog.js';
import {coins} from './city-expansion.js';
import {respectRanks,prisonTerms} from './underworld.js';
import {skins} from './skins.js';
import {cityGeography} from './public/city-geography.js';
import {navigationSections} from './public/navigation.js';
import {catalog,crimes} from './catalog.js';
import {employees,breakoutRanks} from './city-expansion.js';
import {familyAssets,careerRanks,musclePackages,shipmentTiers,mysteryJobs} from './empire-catalog.js';
import {weapons,products,AMMO_MAX,AMMO_PRICE,operationSupply} from './logistics.js';
import {crewMissions,compoundUpgrades} from './crew-operations.js';
import {shopProducts} from './shop.js';
import {milestones} from './legacy.js';
import {ranks} from './progression.js';
import {createRulesUI} from './public/rules-ui.js';
import {pageArt} from './public/page-art.js';
import {transportModes,cityDrugMarkets} from './drug-markets.js';
const familyTab={Compounds:'family-compounds',Safehouses:'family-safehouses','Family cars':'family-fleet',SUVs:'family-fleet',Security:'family-upgrades',Territory:'family-territory'};
const dollars=n=>'$'+n.toLocaleString('en-US');
export function gameKnowledge(language='en'){
 const entries=[];const add=(tab,title,text)=>entries.push({tab,title,text});
 for(const crest of familyCrests)add('family',crest+' family crest',language==='nl'?'De Don of Capo kiest dit familiewapen via My family → Edit family. Opgeslagen op het familieprofiel en in de familielijst. Alleen uiterlijk; geen bonus.':'The Don or Capo selects this family crest through My family → Edit family. Saved on the family profile and in the family directory. Cosmetic only; no bonus.');
 add('referrals',referralEvent.name,`Registration referral bonus: $${referralEvent.starter}; referrer reward: $${referralEvent.reward} after rank ${referralEvent.rank} and ${referralEvent.days} distinct active UTC days. Five qualified human friends earn 30 free Supporter days; ten earn 30 free Grand Supporter days, once each. No purchase cash/XP. Existing paid membership time is preserved. Suspicious network/email aliases require staff review; bots never qualify. Player-to-player spending stays locked until qualification and review. Staff referral overview lists every link and totals.`);
 add('family-directory','All families','Browse every family, including your own, without joining one first. Search names and compare members, assets, Power, net worth and drugs/guns ranks. This is separate from the top ten rankings.');
 add('circuit','Midnight Circuit',circuitRules);
 for(const r of raceRoutes)add('circuit',r.name,r.description);
 for(const r of driverRanks)add('circuit',r.name,'Driver XP '+r.xp+'. Racing handling bonus +'+r.handlingBonus.toFixed(1)+'.');
 add('warehouses','Vehicle condition & auctions','Stolen cars have 1–5 stars: Worn 55%, Used 25%, Good 13%, Perfect 6%, Pristine 1%. Value uses the model, condition, city and hourly quote. Condition factors are 35%, 55%, 75%, 100% and 135%. Store the car before listing. Choose a minimum price and 6, 12 or 24 hours. Non-refundable listing fee: 0.25% of the current quote, minimum $500, maximum $250,000. Successful sales charge 3% commission. Bids reserve cash and one warehouse bay. Minimum bid increment 5%. Outbid cash is refunded with protected credit if full. Listed cars cannot be sold, shipped or replaced.');
 const translateNavigation=createTranslator(language);
 for(const section of navigationSections)for(const item of section.items)for(const [tab,label] of Array.isArray(item)?[item]:item.items){
  if(['admin','tickets'].includes(tab))continue;
  const path=[section.label,...(Array.isArray(item)?[]:[item.label]),label].map(value=>translateNavigation(value.replace(/^[^A-Za-z]+/,''))).join(' → ');
  add(tab,label.replace(/^[^A-Za-z]+/,''),translateNavigation('Open this game page from {path}.',{path}));
 }
 for(const a of catalog)add(a.storageKind?'warehouses':a.category,a.name,`${a.description||''} Base price ${dollars(a.price)}. Maximum ${a.limit|| (a.category==='business'?10:1)} per type. Base hourly income ${dollars(a.income||0)}. ${Object.entries(a.perks||{}).filter(([,v])=>v).map(([k,v])=>k+': '+v).join('; ')}.`);
 for(const a of employees)add('employees',a.name,`Hire up to ${a.limit.toLocaleString('en-US')}. Price ${dollars(a.price)}, base hourly cash ${dollars(a.income)}, Power ${a.power}, respect per active day ${a.respectPerDay||0}. Income pauses during detention and stops after 24 active earning hours until saved personal income is fully claimed.`);
 for(const a of familyAssets)add(familyTab[a.category]||'family-assets',a.name,`${a.description} Price ${dollars(a.price)}, maximum ${a.limit||1}, defense ${a.defense}, shipment bonus ${a.runBonus} points, hourly treasury income ${dollars(a.income||0)}.`);
 for(const c of crimes){const s=operationSupply('crime',c);add('missions',c.name,`Requires ${c.requiredXp} XP, ${c.energy} energy, ${s.ammo} rounds and weapon tier ${s.tier}${c.requires?', '+c.requires+' ownership':''}. Base chance ${Math.round(c.chance*100)}%, cooldown ${Math.round(c.cooldown/1000)} seconds. Account-specific rewards and chance are shown on the crime card. Failures can cause fines or prison; Big Score chance is 5%.`);}
 for(const w of weapons)add('armory',w.name,`Tier ${w.tier}, base price ${dollars(w.price)}, Power ${w.power}. Maximum 10,000 copies; each further copy raises its unit price by 1% of base price. Ammunition costs ${dollars(AMMO_PRICE)} per round, capacity ${AMMO_MAX.toLocaleString('en-US')}.`);
 for(const p of products)add('production',p.name,`Unlocks at drugs career level ${p.level}. Base six-hour production cost ${dollars(p.cost)} before city factors. Terms 6, 12 or 24 hours. Up to 1,000 unsold crates per type; five occupied slots. Each production warehouse adds 1,000 total crates of capacity; buy warehouses before starting production. Each of ${Object.keys(cityDrugMarkets).length} cities has separate production and sale factors. Cargo must arrive before sale. ${transportModes.map(m=>m.name+': base '+m.hours+'h, '+Math.round(m.risk*100)+'% interception risk').join('; ')}. Destination, distance and cargo size affect the displayed quote. Detention pauses personal production and prevents dispatch/sale.`);
 for(const m of crewMissions)add('team-missions',m.name,`${m.description} Exactly ${m.size} people. Each participant: base cash ${dollars(m.cash)}, XP ${m.xp}, cost ${dollars(m.fee)}, energy ${m.energy}, rounds ${m.ammo}, weapon tier ${m.tier}; minimum ${m.requiredXp} XP. Base chance ${Math.round(m.chance*100)}%.`);
 for(const t of shipmentTiers)add('shipments',t.name,`Unlocks at career level ${t.level}, requires ${t.energy} energy and base stake ${dollars(t.cost)}, awards base ${t.xp} career XP with a ${Math.round(t.chance*100)}% base success chance. Live cards apply current account and family bonuses.`);
 for(const r of breakoutRanks)add('prison',r.name,`Breakout career level ${r.level}/15, threshold ${r.xp} breakout XP, success bonus ${(r.chanceBonus*100).toFixed(1)} percentage points.`);
 for(const m of mysteryJobs)add('missions',m.name,m.description+' Optional contact mission: failure can cause prison. Invitations are not guaranteed.');
 for(const m of compoundUpgrades)add('family-compounds',m.name,`${m.description} Price ${dollars(m.price)}, Power ${m.power}. One permanent extension per family, retained when moving.`);
 for(const m of musclePackages)add('security',m.name,`Price ${dollars(m.price)}, lasts ${m.minutes} minutes for ${m.uses} attempts. Adds ${Math.round(m.bonus*100)} percentage points success.`);
 for(const r of ranks)add('ranks',r.name,`Rank ${r.level}/25, requires ${r.xp.toLocaleString('en-US')} cumulative XP. Active income factor ${r.incomeMultiplier}. Rank-up restores energy and adds 10 maximum energy within the cap.`);
 for(const [kind,rows] of Object.entries(careerRanks))for(const r of rows)add('shipments',kind+' '+r.name,`Career level ${r.level}/15, threshold ${r.xp} career XP, payout factor ${r.multiplier.toFixed(3)}. Personal and family careers progress separately.`);
 for(const m of milestones)add('achievements',m.name,`${m.description} Target ${m.target}. Permanent title: ${m.title}${m.theme?', profile color '+m.theme:''}.`);
 for(const p of shopProducts)add('boutique',p.name,`Price €${(p.cents/100).toFixed(2)}. ${p.description||''} ${p.rewards?Object.entries(p.rewards).map(([k,v])=>k+': '+v.toLocaleString('en-US')).join('; '):''}`);
 for(const car of stolenVehicles)add('warehouses',car.name,`Car theft can recover this collectible vehicle. Base city sale value ${dollars(car.value)}; relative draw weight ${car.weight}. Store in a purchased vehicle warehouse (20 bays, five maximum), sell immediately, or ship between airport cities with small interception risk. Purchased cars instead use private garages with six bays and 80% paid-price resale.`);
 for(const c of coins)add('crypto',c.name+' ('+c.symbol+')',`Fictional tradable coin. Ten-minute live buy/sell quotes include spread. Holdings track purchase basis and profit/loss. Recheck the current quote before trading; base reference ${dollars(c.base)} is not an executable price.`);
 for(const r of respectRanks)add('respect',r.name+' respect',`${r.points} received respect, ${Math.round(r.incomeBonus*100)}% income bonus and ${(r.defenseBonus*100).toFixed(1)}% defense bonus.`);
 for(const term of prisonTerms)add('prison',term.hours+'-hour sentence',`Reporting cost ${dollars(term.cost)} before optional anonymous fee; court fine up to ${dollars(term.fine)}. Bail is scaled to rank and decreases with remaining time. Use the live release quote.`);
 for(const skin of skins.filter(s=>!s.ownerOnly))add(skin.cents?'boutique':'profile',skin.name,`Curated character skin. ${skin.cents?'Premium cosmetic, €'+(skin.cents/100).toFixed(2)+'.':'Standard skin.'} Choose only unlocked skins in Edit profile. Cosmetic appearance does not itself grant Power.`);
 for(const [city,g] of Object.entries(cityGeography))add('family-territory',city+' city map',`Interactive approximate historical city outline with ${g.cells.length} fictional game territories. Gold is your family, green allies, red rivals and neutral unclaimed. Hover highlights a plot; select to inspect purchase/capture options. These are not official districts.`);
 for(const a of artCatalog)add('art-market',a.name,`Unique collectible ${a.kind}. Base reference $${a.value}; rarity weight ${a.weight}. Appraisal costs 4% of base reference and reveals authenticity and condition-adjusted value. Trade via cash-backed auctions; estimates are not guaranteed bids.`);
 add('dashboard','Important notifications','Device push is temporarily paused. In-game notices remain available. Future activation requires HTTPS, browser permission, VAPID keys and real-device tests. Bots do not register browser devices.');
 add('art-market','Sovereign Curator','Personally steal the Diamond Phoenix and Platinum Crown from The Sovereign Collection, then appraise and certify both as originals. Auction purchases do not count. One item per successful heist; exclusive ascending pools contain 7, 6, 6 and 6 objects, with rarer high-value loot.');
 for(const h of artHeists)add('art-market',h.name,`Requires ${h.xp} XP, ${h.energy} energy, ${h.ammo} rounds, tier ${h.tier}, $${h.fee} fee. Shared art cooldown ${h.cooldown/3600000} hours. Fixed loot pool: ${h.loot.map(a=>a.name+' $'+a.value).join(', ')}. Higher-value objects are rarer. Failure can cause arrest; recovered pieces may be reproductions.`);
 const rules=createRulesUI({esc:s=>s,navigate:()=>{}});for(const [title,text] of rules.chapters)add('rules',title,text);for(const [title,text] of rules.questions)add('faq',title,text);
 if(language==='nl'){const t=createTranslator('nl');return entries.map(e=>({...e,title:/^(drugs|guns) /.test(e.title)?t(e.title.split(' ')[0])+' '+e.title.split(' ').slice(1).join(' '):translateGenerated(e.title,'nl',false,true),text:translateGenerated(e.text,'nl',false,true)}));}
 return entries;
}
export function findKnowledge(question,language='en'){
 const words=String(question).toLowerCase().replace(/[^\p{L}\p{N} -]/gu,' ').split(/\s+/).filter(w=>w.length>2&&!['the','what','where','how','can','you','een','het','hoe','waar','kan','voor','with','best','most','mijn','have'].includes(w));
 if(!words.length)return [];
 const aliases={bedrijven:'business',huizen:'estate',kunst:'art',antiek:'antiquities',veiling:'auction',taxatie:'appraisal',autos:'cars',vliegtuig:'jets',helikopters:'helicopters',bezittingen:'possessions',wapens:'weapons',kogels:'ammunition',huwelijk:'marriage',gevangenis:'prison',achtegrond:'cover',achtergrond:'cover'};const normalized=[...new Set(words.flatMap(w=>[w.replace(/s$/,''),aliases[w]||w]))];
 const english=gameKnowledge();return gameKnowledge(language).map((e,index)=>{const title=(e.title+' '+(language==='nl'?english[index].title:'')).toLowerCase(),text=(e.text+' '+(language==='nl'?english[index].text:'')).toLowerCase();return {...e,score:normalized.reduce((n,w)=>n+(title.includes(w)?6:0)+(text.includes(w)?1:0),0)+(question.length>4&&title===question.toLowerCase()?30:0)}}).filter(e=>e.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
}
