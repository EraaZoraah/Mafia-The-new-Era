import {activeLocale as gameLocale} from './i18n.js';
import {html as lhtml,text as ltext} from './localization.js';
import {t} from './i18n.js';
import {pageArt} from './page-art.js';
import {bulkControls,affordable} from './bulk-ui.js';

export function createPremiumUI({api,getMe,refresh,toast,esc,money,date,navigate,updateTimers}){

  const compact=x=>x>=1000000?String.fromCharCode(36)+new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(x):money(x);

  const pct=bps=>(bps/100).toLocaleString(gameLocale,{maximumFractionDigits:2})+'%';

  const picture=(src,name,priority=false)=>lhtml`<img class="editorial-image" src="${src}" alt="${esc(name)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async" width="900" height="600">`;

  function perkLines(item){

    const lines=[];if(item.category==='garage')lines.push(item.storageKind?item.capacity+' storage capacity':'Six purchased-car bays');

    if(item.income)lines.push(`${money(Math.floor(item.income*getMe().user.passiveIncomeMultiplier))} passive income / hour`);

    if(item.perks.rewardBps)lines.push(`+${pct(item.perks.rewardBps)} to all crime payouts`);

    if(item.perks.energyCapacity)lines.push(`+${item.perks.energyCapacity} maximum energy`);

    if(item.perks.energySpeed)lines.push(`Energy regenerates ${item.perks.energySpeed/1000}s faster`);

    if(item.perks.healthSpeed)lines.push(`Health regenerates ${item.perks.healthSpeed/1000}s faster`);

    if(item.perks.cooldownBps)lines.push(`${pct(item.perks.cooldownBps)} shorter crime cooldowns`);

    return lines;

  }

  async function dashboard(el){

    const me=getMe(),u=me.user,b=u.benefits;

    el.innerHTML=lhtml`<section class="empire-hero">${picture('/images/'+pageArt.dashboard,'Your private empire command office',true)}<div class="hero-copy"><div class="eyebrow">${t('YOUR CITY. YOUR LEGACY.')}</div><h1>${t(lhtml('Power has<br>a new address.'))}</h1><p>${t('Build an empire that works for you.')}</p><button class="btn" id="empire-invest">${t('Explore investments')} <span>↗</span></button></div><div class="hero-caption">THE NEW ERA <span>${t('PRIVATE MEMBERS’ WORLD')}</span></div></section><section class="cards dashboard-stats">${[['AVAILABLE CASH',compact(u.cash)],['SECURED IN BANK',compact(u.bank)],['PASSIVE / HOUR',money(b.income)],['ENERGY',lhtml`<span data-energy>${Math.min(u.energy,b.energyMax)}</span><span class="stat-unit"> / ${b.energyMax}</span><span class="energy-overflow" data-energy-overflow>${u.energy>b.energyMax?" +"+(u.energy-b.energyMax).toLocaleString(gameLocale):""}</span>`]].map(([label,value])=>lhtml`<div class="stat"><small>${t(label)}</small><b>${value}</b></div>`).join('')}</section><div class="grid2"><section class="panel"><div class="eyebrow">${t('THE PERSON BEHIND THE EMPIRE')}</div><h3>${t('Your standing')}</h3><div class="rank-display">${esc(u.rank)}${u.distinctions?lhtml`<span class="distinction"><img class="prestige-emblem" src="${u.distinctionImage}" alt="Legacy distinction ${u.distinctions}"></span>`:''}<span>${u.xp.toLocaleString(gameLocale)} XP</span></div><div id="rank-progress"></div><label for="profile-title">${t('Your signature title')}</label><select id="profile-title" ${b.titles.length?'':'disabled'}><option value="">${t(b.titles.length?'Choose an unlocked title':'Your first acquisition unlocks a title')}</option>${b.titles.map(x=>lhtml`<option value="${esc(x.id)}" ${x.id===u.selectedTitle?'selected':''}>${esc(x.name)}</option>`).join('')}</select><p class="muted">${t('Titles are displayed beside your rank and on the leaderboard.')}</p><div class="benefit-summary"><span>+${pct(((1+b.rewardBps/10000)*u.incomeMultiplier-1)*10000)} ${t('crime income')}</span><span>+${pct((u.passiveIncomeMultiplier-1)*10000)} ${t('business income')}</span><span>−${pct(b.cooldownBps)} ${t('crime cooldowns')}</span><span>+${Math.round(b.crimeChanceBonus*100)} ${t('points crime success')}</span><span>+1 ${t('energy')} / ${b.energyInterval/1000}s</span><span>+1 ${t('health')} / ${b.healthInterval/1000}s</span></div><p class="muted">${esc(u.city)} · ${esc(me.family||t('Independent'))}</p><label>${t('Health')} · ${u.health}%</label><progress max="100" value="${u.health}"></progress><label>${t('Heat')} · ${u.heat}%</label><progress max="100" value="${u.heat}"></progress>${[['Hospital',u.hospital_until],['Protection',u.protected_until],['Release',u.captured_until]].filter(([,time])=>time>Date.now()).map(([label,time])=>lhtml`<p class="muted">${t(label)}: ${date(time)}</p>`).join('')}</section><section class="panel"><div class="eyebrow">${t('FROM THE STREETS')}</div><h3>${t('Your latest moves')}</h3><div class="activity-feed">${me.events.length?me.events.map(x=>lhtml`<div class="item"><span class="activity-dot"></span><div>${esc(x.message)}<small>${date(x.created_at)}</small></div></div>`).join(''):lhtml`<p class="muted">${t('The city is waiting for your first move.')}</p>`}</div></section></div><section class="panel portfolio-panel"><div><div class="eyebrow">${t('THE COLLECTION')}</div><h3>${t('{count} assets. One empire.',{count:me.possessions.reduce((n,a)=>n+a.quantity,0)})}</h3><p class="muted">${money(b.value)} ${t('base portfolio value · Income stacks per copy; active bonuses have limits.')}</p></div><button class="btn secondary" id="view-collection">${t('View the collection ↗')}</button></section>`;

    const claim=document.createElement('button');claim.className='btn';claim.textContent=t('Claim all hourly income')+' · '+money(u.pending_income||0);claim.disabled=!!u.detained;const incomeTimer=document.createElement('p');incomeTimer.className='muted';incomeTimer.setAttribute('role','timer');const start=Date.now(),clock=u.incomeClock||{elapsed:0,cap:86400000};const updateClock=()=>{const seconds=Math.floor(Math.min(clock.cap,clock.elapsed+(u.detained||!b.income?0:Date.now()-start))/1000);incomeTimer.textContent=t('Accrued time')+': '+String(Math.floor(seconds/3600)).padStart(2,'0')+':'+String(Math.floor(seconds/60)%60).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+' / 24:00:00';};updateClock();const interval=setInterval(()=>{if(!incomeTimer.isConnected){clearInterval(interval);return}updateClock()},1000);el.querySelector('.dashboard-stats').after(claim,incomeTimer);claim.onclick=async()=>{claim.disabled=true;try{await api('income/claim',{});await refresh()}catch(e){toast(e.message,true);claim.disabled=false}};
    el.querySelector('#empire-invest').onclick=()=>navigate('investments');

    el.querySelector('#view-collection').onclick=()=>navigate('inventory');

    el.querySelector('#profile-title').onchange=async e=>{if(!e.target.value)return;try{await api('title',{title:e.target.value});await refresh();toast(ltext('Your signature title has been updated.'))}catch(error){toast(error.message,true)}};

    try{const d=await api('catalog');if(!el.isConnected)return;el.querySelector('#rank-progress').innerHTML=lhtml`<div class="next-rank"><span>Next: ${esc(u.nextRank)}</span><b>${(u.nextRankXp-u.xp).toLocaleString(gameLocale)} XP to go</b></div><progress max="1" value="${u.rankProgress}"></progress><details class="rank-ladder"><summary>View all 25 ranks & legacy distinctions</summary><div class="rank-track">${d.ranks.map(r=>lhtml`<span class="${u.xp>=r.xp?'achieved':''}">${r.level}. ${esc(r.name)}<small>${r.xp.toLocaleString(gameLocale)} XP · ${r.incomeMultiplier.toFixed(2)}× income · +${r.promotionPercent.toFixed(2)}% this promotion</small></span>`).join('')}</div><p class="muted">After The Godfather, the next distinction requires ${u.distinctionStep.toLocaleString(gameLocale)} XP from the previous threshold. Each distinction increases active income by 7.5%; the XP required for the next distinction grows by 18.5%. Titles, stars and energy progression continue.</p></details>`;}catch(error){toast(error.message,true)}

  }

  async function missions(el){

    el.innerHTML=lhtml('<div class="section-heading"><div><div class="eyebrow">FORTUNE FAVORS THE BOLD</div><h2>The opportunity board</h2></div><span class="pill">LIVE PAYOUTS</span></div><p class="section-intro">Ordered from smaller jobs to the most dangerous contracts, with increasing payouts and risk. Payout ranges include your collection bonuses and random extra loot. Failed jobs yield small extra loot but also a fine (2–8% of the potential payout, minimum $1,000) or arrest (45–70% chance depending on local heat), lasting 5–60 minutes by severity. Fines cannot exceed available cash.</p><p class="notice crime-feature-note big-score-note"><img src="/icons/achievement-big-score.svg" alt=""><strong>BIG SCORE!</strong> Every eligible crime attempt has an independent 5% chance of a guaranteed success with 3× the rolled payout and 3× XP, within wallet and XP limits. Normal requirements, energy, ammunition and cooldowns still apply.</p>');

    try{

      const d=await api('catalog'),me=getMe();if(!el.isConnected)return;el.innerHTML+=lhtml`<p class="notice crime-feature-note armory-note"><img src="/icons/menu-armory.svg" alt="">Armory: ${me.user.armory.ammo} rounds · Tier ${me.user.armory.tier}. Buy supplies in Personal assets → Weapons & ammunition. Every valid attempt uses the listed rounds.</p>`;

      el.innerHTML+=lhtml`<div class="missions premium-grid">${d.crimes.map(c=>lhtml`<article class="mission photo-card ${c.locked?'locked-card':''}"><div class="image-wrap">${picture(c.image,c.name)}<span class="image-badge">${c.locked?ltext('ACQUISITION REQUIRED'):'+'+c.xp.toLocaleString(gameLocale)+' XP'}</span></div><div class="card-body"><div class="card-kicker">${c.severity}. ${esc(c.risk).toUpperCase()} BASE RISK · ${Math.round(c.chance*100)}% SUCCESS · ${c.energy} ENERGY</div><h3>${esc(c.name)}</h3><div class="payout-label">${c.id==='car'?ltext('VEHICLE RECOVERY'):ltext('ON SUCCESS · EXTRA LOOT INCLUDED')}</div><div class="payout-range">${c.id==='car'?ltext('One recovered vehicle'):money(c.payout.min)+' — '+money(c.payout.max)}</div><p class="bonus-line">${c.id==='car'?ltext('30 collectible vehicles · Sell immediately or store in a vehicle warehouse. Big Score triples the recovered vehicle value and XP.'):ltext('Random extra: ')+money(c.payout.bonusMin)+'–'+money(c.payout.bonusMax)+ltext(' on every attempt')}</p><div class="item">${c.supplies.ammo} rounds · Weapon tier ${c.supplies.tier}<br>${c.rewardXp??c.xp} XP on success · ${Math.ceil(c.cooldown/1000)}s cooldown</div>${c.requires?lhtml`<div class="unlock-note">${c.locked?ltext('Acquire'):ltext('Unlocked by')} a ${esc(c.requires)}${c.requiredXp?' · '+c.requiredXp.toLocaleString(gameLocale)+ltext(' XP required'):''}</div>`:''}${c.id==='hit'?lhtml`<label>Liquidation rounds<input id="contract-rounds" type="number" min="${c.supplies.ammo}" max="10000" step="1" value="${c.supplies.ammo}" required></label><p>Extra rounds improve this displayed base chance with diminishing returns.</p>`:''}<button class="btn" data-action="${c.id}" data-until="${me.cooldowns.find(x=>x.kind===c.id)?.available_at||0}" data-cost="${c.energy}" data-xp="${c.requiredXp}" data-locked="${c.locked?'true':'false'}" data-label="Take the opportunity">Take the opportunity</button></div></article>`).join('')}</div>`;

      updateTimers();

      el.querySelectorAll('[data-action]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const r=await api('action',{kind:button.dataset.action,...(button.dataset.action==='hit'?{rounds:Number(el.querySelector('#contract-rounds').value)}:{})});await refresh();toast(ltext`${r.success?'Success':'The main job failed'} · ${money(r.reward)} earned, including ${money(r.bonus)} extra loot · +${r.xp} XP.`,!r.success)}catch(error){toast(error.message,true);updateTimers()}});

    }catch(error){toast(error.message,true)}

  }

  const limits=lhtml('<details class="collection-rules"><summary>Collection rules & bonus limits</summary><p class="muted">Ten copies per business; one copy per home, vehicle, aircraft, yacht or garage. Each additional copy costs 10% more than the previous copy (maximum $1 trillion). Only businesses generate passive asset income; other assets grant their listed perks. Active perk limits: 1,000 total energy including rank, legacy, homes and premium cars, 5s energy recovery, 10s health recovery, 60% shorter cooldowns and +200% collection crime income. Offline accrual: up to 24 hours.</p></details>');

  function assetCard(x,inventory=false){

    const u=getMe().user,quantity=x.quantity||0;

    const income=Math.min(1000000000000000,Math.floor(x.income*u.passiveIncomeMultiplier));

    return lhtml`<article class="mission photo-card ${quantity>=x.limit?'collection-complete':quantity?'owned':''}"><div class="image-wrap">${picture(x.image,x.name)}<span class="image-badge">${quantity}/${x.limit} OWNED · ${esc(x.storageKind?ltext(x.storageKind==='production'?'Production warehouses':'Vehicle warehouses'):x.category.toUpperCase())}</span></div><div class="card-body"><h3>${esc(x.name)}</h3>${x.description?lhtml('<p class="asset-description">')+esc(x.description)+lhtml('</p>'):''}<div class="asset-price">${money(inventory?Math.min(1000000000000000,Math.floor(x.income*u.passiveIncomeMultiplier*quantity)):quantity>=x.limit?x.price:x.nextPrice)}<small>${inventory?ltext(' total / hour'):quantity>=x.limit?ltext(' collection complete'):x.limit===1?ltext(' purchase price'):ltext(' next copy')}</small></div><ul class="asset-benefits">${perkLines(x).map(line=>lhtml('<li>')+line+lhtml(' per copy</li>')).join('')}<li>Access to ${esc(x.unlock)}</li></ul><div class="title-unlock"><span>SIGNATURE TITLE</span>${esc(x.title)}</div>${inventory&&x.category==='garage'?lhtml`<button class="btn secondary" data-open-storage="${x.storageKind?'warehouses':'garage'}">Open ${x.storageKind?ltext('warehouse'):ltext('garage')} contents ↗</button>`:''}<button class="btn" data-buy="${x.id}" data-category="${x.category}" ${quantity>=x.limit||u.cash<x.nextPrice?'disabled':''}>${quantity>=x.limit?ltext('Collection limit reached'):u.cash<x.nextPrice?ltext('Insufficient cash'):quantity?ltext('Acquire another · ')+money(x.nextPrice):ltext('Acquire asset ↗')}</button></div></article>`;

  }

  async function bindPurchases(el){

    await api('catalog').then(d=>{if(!el.isConnected)return;el.querySelectorAll('[data-buy]').forEach(button=>{const item=d.catalog.find(x=>x.id===button.dataset.buy&&x.category===button.dataset.category);if(item.quantity>=item.limit)return;const max=affordable(item.limit-item.quantity,getMe().user.cash,i=>Math.min(1e12,Math.ceil(item.price*1.10**(item.quantity+i))));bulkControls(button,max,async quantity=>{try{await api('assets/buy',{id:item.id,category:item.category,quantity});await refresh();toast(ltext('Acquisition complete.'))}catch(error){toast(error.message,true)}},{single:item.limit===1});})}).catch(e=>toast(e.message,true));



  }

  async function shop(el,category){

    const labels={business:['THE BUSINESS DISTRICT','Income never sleeps.'],car:['THE MOTOR COLLECTION','Arrive on your terms.'],home:['EXCEPTIONAL ADDRESSES','Live above the ordinary.'],helicopter:['PRIVATE ROTOR COLLECTION','Own the skyline.'],jet:['THE PRIVATE FLEET','The world is within reach.'],garage:['THE PRIVATE GARAGES','A home for your collection.'],yacht:['THE PRIVATE MARINA','Your horizon. Your rules.']};

    const [eyebrow,title]=labels[category];

    el.innerHTML=lhtml`<div class="section-heading"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div></div>${limits}`;

    try{const d=await api('catalog');if(!el.isConnected)return;el.innerHTML+=lhtml('<div class="missions premium-grid">')+d.catalog.filter(x=>x.category===category&&!x.storageKind).sort((a,b)=>a.price-b.price).map(x=>assetCard(x)).join('')+lhtml('</div><p class="art-note">Cinematic AI-generated artwork. Vehicles are artistic interpretations; aircraft names and prices are fictional game content.</p>');await bindPurchases(el)}catch(error){toast(error.message,true)}

  }

  async function inventory(el){

    const b=getMe().user.benefits;

    el.innerHTML=lhtml`<div class="eyebrow">YOUR PERSONAL EMPIRE</div><h2>My possessions</h2><p class="section-intro">Your properties, garages, businesses and fleet, together in one collection. Each card shows the quantity you own and its total hourly income at your current rank.</p><section class="cards dashboard-stats"><div class="stat"><small>OWNED ASSETS</small><b>${getMe().possessions.reduce((n,a)=>n+a.quantity,0)}</b></div><div class="stat"><small>TOTAL PASSIVE / HOUR</small><b>${compact(b.income)}</b></div><div class="stat"><small>CRIME COOLDOWNS</small><b>−${pct(b.cooldownBps)}</b></div><div class="stat"><small>MAXIMUM ENERGY</small><b>${b.energyMax}</b></div></section>${limits}<section class="panel"><h3>Weapons & ammunition</h3><p>${getMe().user.armory.weaponCount} weapons · ${getMe().user.armory.ammo.toLocaleString(gameLocale)} rounds · ${money(getMe().user.armory.weaponValue)} paid for weapons</p><p>${getMe().user.armory.weapons.filter(w=>w.quantity).map(w=>esc(w.name)+' × '+w.quantity).join(' · ')}</p><button class="btn secondary" id="portfolio-armory">Open personal armory ↗</button></section><div id="portfolio-items"></div>`;

    el.querySelector('#portfolio-armory').onclick=()=>navigate('armory');

    try{const d=await api('catalog');const archive=await api('assets');if(!el.isConnected)return;if(archive.archived.length){const note=document.createElement('p');note.className='notice';note.textContent=archive.archived.reduce((n,a)=>n+a.quantity,0)+ltext(' legacy copies are archived under the ownership limits. Archived copies earn no income or bonuses; their records are preserved.');el.prepend(note);}const items=d.catalog.filter(x=>x.quantity&&x.category!=='car');el.querySelector('#portfolio-items').innerHTML=items.length?lhtml('<div class="missions premium-grid">')+[...new Set(items.map(x=>x.storageKind||x.category))].map(category=>lhtml`<section class="asset-category"><h3>${esc(ltext(({business:'Businesses',home:'Real estate',garage:'Private garages',car:'Cars',helicopter:'Helicopters',jet:'Private jets',yacht:'Yachts',vehicle:'Vehicle warehouses',production:'Production warehouses'})[category]||category))}</h3><div class="missions premium-grid">${items.filter(x=>(x.storageKind||x.category)===category).sort((a,b)=>b.price-a.price).map(x=>assetCard(x,true)).join('')}</div></section>`).join('')+lhtml('</div>'):lhtml('<p class="panel">Your collection starts with your first acquisition. Visit Businesses, Real estate or one of the fleet showrooms.</p>');await bindPurchases(el);el.querySelectorAll('[data-open-storage]').forEach(b=>b.onclick=()=>navigate(b.dataset.openStorage));}catch(error){toast(error.message,true)}

  }

  async function rankPage(el){

    const u=getMe().user;

    el.innerHTML=lhtml`<div class="eyebrow">THE ROAD TO THE THRONE</div><h2>Ranks & rewards</h2><p class="section-intro">Every promotion increases your earnings. The first ten ranks grow gently; higher ranks unlock a stronger but finite income curve. Godfather income reaches 500× starting income. Each legacy distinction adds 7.5% active income, while its XP gap grows by 18.5%. Passive income uses the square root of the rank multiplier, capped at 16× before other bonuses. Each promotion adds up to 10 maximum energy (1,000 total cap) and fully restores your energy. Each rank also adds 1.42 percentage points to crime success, up to each crime’s 95% ceiling.</p><div class="panel"><h3>${esc(u.rank)} · ${u.incomeMultiplier.toLocaleString(gameLocale,{maximumFractionDigits:2})}× starting income</h3><p>Next: ${esc(u.nextRank)} · ${(u.nextRankXp-u.xp).toLocaleString(gameLocale)} XP remaining</p><progress max="1" value="${u.rankProgress}"></progress></div><div id="rank-table"></div>`;

    try{const d=await api('catalog');if(!el.isConnected)return;

      el.querySelector('#rank-table').innerHTML=lhtml('<div class="rank-table-wrap"><table><thead><tr><th>Rank</th><th>Total XP</th><th>XP from previous</th><th>Active income vs previous</th><th>Total active income</th><th>Total passive income</th><th>Rank energy</th><th>Crime success bonus</th></tr></thead><tbody>')+d.ranks.map((r,i)=>{const next=d.ranks[i+1]?.xp??Infinity;const jobs=d.crimes.filter(c=>c.requiredXp>=r.xp&&c.requiredXp<next);return lhtml`<tr class="${u.rankLevel===r.level?'current-rank':''}"><td>${r.level}. ${esc(r.name)}</td><td>${r.xp.toLocaleString(gameLocale)}</td><td>${(r.xp-(d.ranks[i-1]?.xp||0)).toLocaleString(gameLocale)}</td><td>${i?'+'+((r.incomeMultiplier/d.ranks[i-1].incomeMultiplier-1)*100).toFixed(2)+'%':ltext('Starting rank')}</td><td>${r.incomeMultiplier.toFixed(2)}×</td><td>${Math.min(16,Math.sqrt(r.incomeMultiplier)).toFixed(2)}×</td><td>${100+(r.level-1)*10} (+${i?10:0})</td><td>+${(i/24*34).toFixed(2)} points total</td></tr>`}).join('')+lhtml('</tbody></table></div><section class="panel"><h3>The Godfather is only the beginning.</h3><p>Every prestige distinction has its own emblem. Required XP gaps grow by 18.5% after Godfather; each distinction increases the active reward factor by 7.5% and adds 10 maximum energy within the 1,000 cap. The next gap for your account is ')+u.distinctionStep.toLocaleString(gameLocale)+lhtml(' XP. Passive income has its own cap. Crimes retain a risk of failure, including at Godfather.</p></section>');

    }catch(error){toast(error.message,true)}

  }

  return {dashboard,missions,shop,inventory,rankPage};

}

