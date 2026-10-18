import {t} from './i18n.js';
import {activeLocale as gameLocale} from './i18n.js';
import {html as lhtml,text as ltext} from './localization.js';
import {outcomeImage} from './outcome-images.js';
import {createBriberyUI} from './bribery-ui.js';
export function createFeedback({api,getMe,esc,refresh}) {
 const police=createBriberyUI({api,getMe,esc,refresh});
 const queue=[],seen=new Set();let busy=false;
 function enqueue(item){if(item.id&&seen.has(item.id))return;if(item.id)seen.add(item.id);queue.push(item);}
 async function poll(){if(!getMe()||document.hidden||busy)return;busy=true;try{const b=await api('bribery');if(b.offer){police.offer(b.offer);if(b.offer.notificationId)seen.add(b.offer.notificationId)}const d=await api('notifications');const received=d.notifications.filter(n=>!seen.has(n.id));const fresh=[];for(const n of received){if(document.querySelector('#midnight-circuit')&&[t('Midnight Circuit victory'),t('Midnight Circuit result')].includes(n.title)){await api('notifications/ack',{id:n.id});seen.add(n.id)}else if(n.title==='Private message received'&&document.querySelector('#conversation')){await api('notifications/ack',{id:n.id});seen.add(n.id)}else fresh.push(n)}for(const n of fresh)enqueue({...n,persistent:true});if(fresh.length)await refresh()}catch{}finally{busy=false}}
 function pump(){
  if(!getMe()||!queue.length||document.querySelector('dialog[open]'))return;
  const item=queue.shift(),dialog=document.createElement('dialog');
  dialog.className='promotion-dialog outcome-dialog';if(item.imageLayout==='full')dialog.classList.add('outcome-full-art');dialog.id='outcome-dialog';
  dialog.innerHTML=lhtml`<img class="mystery-image" src="${esc(outcomeImage(item))}" alt="${esc(t(item.title||'Action completed'))}"><div class="eyebrow">${item.error?ltext('SETBACK'):ltext('THE NEW ERA')}</div><h2>${esc(t(item.title||'Action completed'))}</h2><p>${esc(item.message||t('Your action has been completed.'))}</p><p class="outcome-error" role="alert"></p><button class="btn" autofocus>${esc(t(item.button||'Continue'))}</button>${item.action?lhtml('<button class="btn secondary" data-later>Later</button>'):''}`;
  const artwork=dialog.querySelector('.mystery-image');artwork.addEventListener('error',()=>{artwork.src='/images/outcome-notice.png'},{once:true});
  if(item.vehicle){
   const v=item.vehicle,tools=document.createElement('section');tools.className='panel';tools.innerHTML=lhtml`<p class="vehicle-condition">${'★'.repeat(v.condition_stars||4)}${'☆'.repeat(5-(v.condition_stars||4))} · ${esc(t(v.condition?.name||'Perfect'))}</p><div class="formrow"><button class="btn" data-loot-sell>Sell now · $${v.saleValue.toLocaleString(gameLocale)}</button><button class="btn secondary" data-loot-store ${v.capacity?'':'disabled'}>Store in warehouse</button></div><label data-replace-wrap hidden>Sell & replace stored vehicle<select data-loot-replace><option value="">Choose stored vehicle</option></select></label><button class="btn secondary small" data-open-warehouses>Open vehicle warehouses ↗</button>`;dialog.querySelector('.outcome-error').before(tools);
   const finish=async(route,body)=>{tools.querySelectorAll('button').forEach(b=>b.disabled=true);try{await api(route,body);dialog.close();dialog.remove();await refresh();pump()}catch(e){dialog.querySelector('.outcome-error').textContent=e.message;tools.querySelectorAll('button').forEach(b=>b.disabled=false)}};
   tools.querySelector('[data-loot-sell]').onclick=()=>finish('vehicles/sell',{id:v.id});tools.querySelector('[data-loot-store]').onclick=()=>finish('vehicles/store',{id:v.id,replaceId:Number(tools.querySelector('[data-loot-replace]').value)||undefined});tools.querySelector('[data-open-warehouses]').onclick=()=>{dialog.close();dialog.remove();document.querySelector('[data-tab="warehouses"]')?.click()};
   if(v.used>=v.capacity&&v.capacity){tools.querySelector('[data-replace-wrap]').hidden=false;tools.querySelector('[data-loot-store]').textContent=ltext('Sell selected & store this car');void api('vehicles').then(d=>{if(!dialog.isConnected)return;tools.querySelector('[data-loot-replace]').innerHTML+=d.entries.filter(x=>x.state==='stored'&&!x.auctioned).map(x=>lhtml`<option value="${x.id}">${esc(x.name)} · $${x.saleValue.toLocaleString(gameLocale)}</option>`).join('');}).catch(()=>{});}
  }
  const position={x:window.scrollX,y:window.scrollY};document.body.append(dialog);dialog.showModal();window.scrollTo(position.x,position.y);
  const button=dialog.querySelector('button[autofocus]');
  if(item.error&&/not enough.*ammunition|onvoldoende.*munitie/i.test(item.message||'')){const link=document.createElement('button');link.className='btn secondary';link.textContent=ltext('Buy ammunition');link.onclick=()=>{dialog.close();dialog.remove();document.querySelector('[data-tab="'+(/family ammunition|familie.*munitie/i.test(item.message)?'family-armory':'armory')+'"]')?.click()};dialog.append(link)}
  const close=async()=>{button.disabled=true;try{if(item.action)await item.action();if(item.persistent)await api('notifications/ack',{id:item.id});dialog.close();dialog.remove();window.scrollTo(position.x,position.y);await refresh();pump()}catch(e){dialog.querySelector('.outcome-error').textContent=e.message;button.disabled=false}};
  const later=()=>{dialog.close();dialog.remove();if(item.id)seen.delete(item.id);item.onLater?.();window.scrollTo(position.x,position.y)};button.onclick=close;const laterButton=dialog.querySelector('[data-later]');if(laterButton)laterButton.onclick=later;dialog.oncancel=e=>{e.preventDefault();if(item.action)later();else void close()};
 }
 function result(route,body,r,context={}){
  if(r.bribe){police.offer(r.bribe);if(r.bribe.notificationId)seen.add(r.bribe.notificationId);return;}
  if(r.vehicle){enqueue({title:r.bigScore?'BIG SCORE!':'Succes!',vehicle:r.vehicle,image:r.vehicle.image,message:t('Recovered {name} in {city}. Current sale value: ${value} · {xp} XP. Sell immediately or place it in your vehicle warehouse.',{name:r.vehicle.name,city:r.vehicle.city,value:r.vehicle.saleValue.toLocaleString(gameLocale),xp:r.xp||0})});return;}
  if(route==='art/heist'&&r.object){const o=r.object;enqueue({title:'Succes!',image:o.image,message:t('Recovered {name}. Unverified market estimate: ${value}. Condition: {condition}%. Appraisal is required to confirm authenticity and value.',{name:t(o.name),value:o.marketEstimate.toLocaleString(gameLocale),condition:o.condition})+' · +'+r.xp+' XP'});return;}
  const purchase=/assets\/buy|family\/buy|family\/map\/buy|armory\/buy|security\/|protection$/.test(route),parts=[];
  for(const [key,label] of [['reward','Earned'],['personalReward','Personal payout'],['familyReward','Family payout'],['paid','Paid'],['payout','Returned'],['cost','Cost'],['anonymousFee','Anonymity fee'],['bountyReward','Bounty paid'],['bountyPending','Bounty credit saved'],['fine','Fine']])if(typeof r[key]==='number')parts.push(t(label)+': $'+r[key].toLocaleString(gameLocale));
  for(const [key,label] of [['xp','XP'],['careerXp','Career XP'],['healthLost','Health lost'],['ammoUsed','Rounds used'],['backfireRounds','Target backfire rounds'],['energy','Energy']])if(r[key])parts.push(t(label)+': '+r[key]);
  if(body?.amount)parts.push((route==='transfers'&&body.kind==='energy'?t('Energy transferred')+': ':t('Amount')+': $')+Number(body.amount).toLocaleString(gameLocale));
  if(body?.recipient)parts.push(t('Recipient')+': '+body.recipient);
  const image=outcomeImage({route,image:r.image,contextImage:context.image,error:r.success===false||(r.round?.status==='finished'&&r.round.payout<r.round.stake)});
  if(r.round){enqueue({title:r.round.status==='active'?'Your move':r.round.payout>=r.round.stake?'Succes!':'Failed!',message:r.message+' · Stake $'+r.round.stake.toLocaleString(gameLocale)+(r.round.status==='finished'?' · Return $'+r.round.payout.toLocaleString(gameLocale):''),image});return;}
  enqueue({title:r.bigScore?'BIG SCORE!':r.success===false?'Failed!':purchase?'Congratulations':r.declined?'Offer declined':'Succes!',message:[r.message||context.title||route.replaceAll('/',' · '),...parts].join('\n'),image,error:r.success===false});
 }
 setInterval(()=>{police.pump();pump()},350);setInterval(()=>void poll(),10000);
 return {enqueue,result,poll,clear(){police.clear();queue.length=0;seen.clear();document.querySelector('#outcome-dialog')?.remove()}};
}
