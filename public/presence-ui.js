import {supporterBadge,supporterClass} from './name-badges.js';
import {activeLocale as gameLocale,activeLanguage} from './i18n.js';
import {html as lhtml,text as ltext} from './localization.js';
import {staffTotals} from './staff-totals-ui.js';
export function resolvePresenceStatus(cached,ownMembership,rendered){
 if(ownMembership!==undefined)return {...cached,supporter:ownMembership};
 if(rendered&&(!cached||(cached.fetchedAt||0)<rendered.at))return {...cached,supporter:rendered.supporter};
 return cached;
}
export function createPresenceUI({api,getMe,esc,money}){
 let populationSort='created_at',populationDirection='desc';let timer,busy=false,observer,cache=new Map(),lastPulse=0,needsPoll=false;
 const visibleIds=()=>[...new Set([...document.querySelectorAll('a[href^="#profile/"],[data-presence-id],[data-presence-profile]')].map(e=>Number(e.dataset.presenceProfile||e.dataset.presenceId||e.getAttribute('href')?.split('/')[1])).filter(Number.isSafeInteger).filter(id=>id>0))];
 const stamp=p=>p?.online?lhtml('<span class="presence-online"><span class="online-dot" aria-hidden="true"></span> Online</span>'):lhtml('<span class="presence-offline">Last seen: ')+(p?.lastSeen?esc(new Date(p.lastSeen).toLocaleString(gameLocale)):'not recorded yet')+lhtml('</span>');
 function paint(){
  for(const a of document.querySelectorAll('a[href^="#profile/"], [data-presence-id]')){
   const id=Number(a.dataset.presenceId||a.getAttribute('href')?.split('/')[1]);if(!id)continue;
   const rendered=a.dataset.membershipRendered?{at:Number(a.dataset.membershipRendered),supporter:a.dataset.membershipTier?{tier:a.dataset.membershipTier,expiresAt:Number(a.dataset.membershipUntil)}:null}:null;const status=resolvePresenceStatus(cache.get(id),getMe()?.user.id===id?getMe().user.supporter:undefined,rendered);if(!status)continue;
   const tier=status.supporter?.tier||'',color=supporterClass(status.supporter);
   for(const c of ['supporter-gold','supporter-silver'])a.classList.toggle(c,c===color);
   let diamond=a.querySelector(':scope > .supporter-diamond');
   if(color&&!diamond){diamond=document.createElement('span');diamond.className='supporter-diamond';diamond.innerHTML=supporterBadge(status.supporter).match(/<img[^>]+>/)?.[0]||'';const following=a.querySelector(':scope > .staff-badge,:scope > .lucky-winner,:scope > .bot-badge,:scope > .online-dot,:scope > small');a.insertBefore(diamond,following||null)}
   if(diamond){if(!color)diamond.remove();else {diamond.querySelector('img')?.setAttribute('src','/icons/supporter-'+tier+'.svg');diamond.classList.toggle('supporter-gold',tier==='gold');diamond.classList.toggle('supporter-silver',tier==='silver');diamond.setAttribute('role','img');diamond.title=tier==='gold'?ltext('Grand Supporter'):ltext('Supporter');diamond.setAttribute('aria-label',diamond.title);}}
   let lucky=a.querySelector(':scope > .lucky-winner');if(cache.get(id)?.luckyWinner&&!lucky){lucky=document.createElement('span');lucky.className='lucky-winner';lucky.textContent=' ✦';lucky.title=ltext('Lucky Winner · daily lottery');lucky.setAttribute('aria-label',ltext('Lucky Winner'));a.append(lucky)}else if(!cache.get(id)?.luckyWinner&&lucky)lucky.remove();
   let bot=a.querySelector(':scope > .bot-badge');if(cache.get(id)?.bot&&!bot){bot=document.createElement('span');bot.className='bot-badge';bot.textContent=ltext(' BOT');bot.title=ltext('Autonomous game character');a.append(bot)}else if(!cache.get(id)?.bot&&bot)bot.remove();
   const detailedProfile=a.closest('.player-profile')?.querySelector('[data-presence-profile="'+id+'"]');let dot=a.querySelector(':scope > .online-dot');if(cache.get(id)?.online&&!detailedProfile&&!dot){dot=document.createElement('span');dot.className='online-dot';dot.title=ltext('Online');dot.setAttribute('aria-label',ltext('Online'));a.append(dot)}else if((!cache.get(id)?.online||detailedProfile)&&dot)dot.remove();
  }
  for(const e of document.querySelectorAll('[data-presence-profile]')){const html=stamp(cache.get(Number(e.dataset.presenceProfile)));if(e.innerHTML!==html)e.innerHTML=html;}
 }
 async function poll(){clearTimeout(timer);if(busy)return;if(!getMe()){cache.clear();return}busy=true;
  try{
   if(!document.hidden){if(Date.now()-lastPulse>25000){await api('presence/heartbeat',{language:activeLanguage});lastPulse=Date.now();}
    const ids=visibleIds();needsPoll=false;
    for(let i=0;i<ids.length;i+=100){const d=await api('presence?ids='+ids.slice(i,i+100).join(','));for(const id of ids.slice(i,i+100))cache.set(id,{id,bot:false,online:false,supporter:null,fetchedAt:Date.now()});for(const p of d.players)cache.set(p.id,{...p,fetchedAt:Date.now()})}paint();
   }
  }catch{}finally{busy=false;if(getMe())timer=setTimeout(poll,needsPoll?80:30000)}
 }
 function mount(){if(!observer){observer=new MutationObserver(()=>{paint();if(visibleIds().some(id=>!cache.has(id))){needsPoll=true;if(!busy){clearTimeout(timer);timer=setTimeout(poll,80)}}});observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)void poll()})}void poll()}
 async function population(el,filter='all',page=1){try{const d=await api('admin/population?filter='+filter+'&page='+page+'&sort='+populationSort+'&direction='+populationDirection);if(!el.isConnected)return;
  el.innerHTML=lhtml`${staffTotals(d.staff)}<section class="panel"><h3>Players & world totals</h3><div class="cards"><button class="stat population-count" data-population="all"><small>TOTAL PLAYERS</small><b>${d.total}</b><span>View all players</span></button><button class="stat population-count" data-population="online"><small>ONLINE NOW</small><b>${d.online}</b><span>View online players</span></button><div class="stat"><small>LIQUID MONEY IN GAME</small><b>${money(d.money)}</b></div><div class="stat"><small>TOTAL PLAYER XP</small><b>${BigInt(d.totalXp).toLocaleString(gameLocale)}</b></div></div><p>Money = player cash ${money(d.playerCash)} + banks ${money(d.playerBank)} + family treasuries ${money(d.familyTreasury)}. Bounty escrow: ${money(d.bountyEscrow||0)} (separate from liquid money). Holdings, locked principal and pending income are detailed in World economy below. Owner and Admin personal balances and XP are excluded. Family treasuries include all families. Player counts include staff. Deleted accounts excluded. Online means a visible signed-in game tab reported activity within 90 seconds.</p><details open><summary>${filter==='online'?ltext('Online players'):ltext('All players')} · page ${d.page}/${d.pages}</summary><div class="tablewrap"><table><tr><th>Player</th><th>XP</th><th>Created</th><th>Days played</th><th>Hours played</th><th>Status</th></tr>${d.players.map(p=>lhtml`<tr><td><a href="#profile/${p.id}">${esc(p.username)}</a></td><td>${p.xp.toLocaleString(gameLocale)}</td><td data-sort-value="${p.createdAt}">${esc(new Date(p.createdAt).toLocaleDateString(gameLocale))}</td><td>${p.daysPlayed}</td><td>${(p.playMillis/3600000).toFixed(1)}</td><td>${p.banned?ltext('Banned'):stamp(p)}</td></tr>`).join('')}</table></div><button class="btn secondary" data-pop-page="${page-1}" ${page<=1?'disabled':''}>Previous</button> <button class="btn secondary" data-pop-page="${page+1}" ${page>=d.pages?'disabled':''}>Next</button></details><button class="btn secondary" id="refresh-population">Refresh totals</button></section>`;
  el.querySelector('details table').sortRemote=(index,direction)=>{populationSort=['username','xp','created_at','days_played','play_ms','last_seen'][index];populationDirection=direction;void population(el,filter,1)};
  el.querySelectorAll('[data-population]').forEach(b=>b.onclick=()=>population(el,b.dataset.population));el.querySelectorAll('[data-pop-page]').forEach(b=>b.onclick=()=>population(el,filter,Number(b.dataset.popPage)));el.querySelector('#refresh-population').onclick=()=>population(el,filter,page);
 }catch(e){el.textContent=e.message}}
 async function languageUsage(el){try{const d=await api('admin/languages');if(!el.isConnected)return;
  const names={en:'English',nl:'Dutch',es:'Spanish',fr:'French',de:'German','':'Not reported yet'};
  el.innerHTML=lhtml`<section class="panel"><h3>Language usage</h3><p>Most recently reported language per account. Human accounts and bots are counted separately. Unreported languages are not guessed. Deleted accounts are excluded.</p><div class="cards"><div class="stat"><small>Human accounts</small><b>${d.players.toLocaleString(gameLocale)}</b></div><div class="stat"><small>Reported language</small><b>${d.reported.toLocaleString(gameLocale)}</b></div><div class="stat"><small>Not reported yet</small><b>${(d.players-d.reported).toLocaleString(gameLocale)}</b></div><div class="stat"><small>Bot accounts</small><b>${d.bots.toLocaleString(gameLocale)}</b></div></div><div class="tablewrap"><table><thead><tr><th>Language</th><th>Human accounts</th><th>Share of human accounts</th><th>Bot accounts</th><th>Total accounts</th></tr></thead><tbody>${d.languages.map(row=>lhtml`<tr><td>${row.code?lhtml`<img class="language-stat-flag" src="/icons/flag-${row.code}.svg" alt=""> `:''}${esc(ltext(names[row.code]))}${row.code?' ('+row.code.toUpperCase()+')':''}</td><td>${row.players.toLocaleString(gameLocale)}</td><td data-sort-value="${row.percent}">${row.percent.toFixed(1)}%</td><td>${row.bots.toLocaleString(gameLocale)}</td><td>${row.total.toLocaleString(gameLocale)}</td></tr>`).join('')}</tbody></table></div><button class="btn secondary" data-refresh-language>Refresh language usage</button></section>`;
  el.querySelector('[data-refresh-language]').onclick=()=>languageUsage(el);
 }catch(error){el.textContent=error.message}}
 return {mount,population,languageUsage};
}
