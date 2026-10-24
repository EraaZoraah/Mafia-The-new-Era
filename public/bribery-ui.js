import {html as lhtml,text as ltext} from './localization.js';
import {t,activeLocale} from './i18n.js';
export function createBriberyUI({api,getMe,esc,refresh}){
 let pending=null,dialog=null,timer=null;const seen=new Set();
 const cash=n=>'$'+n.toLocaleString(activeLocale);
 function offer(value){if(!value||seen.has(value.id))return;pending=value;}
 function pump(){
  if(!getMe()||!pending||document.querySelector('dialog[open]'))return;
  const value=pending;pending=null;seen.add(value.id);let working=false;
  const deadline=Date.now()+Math.max(0,value.expires_at-value.serverTime);
  dialog=document.createElement('dialog');dialog.id='police-bribe-dialog';dialog.className='promotion-dialog outcome-dialog police-bribe-dialog';
  dialog.innerHTML=lhtml`<img class="mystery-image" src="${value.image}" alt="${t('A discreet offer from a corrupt officer')}"><div class="eyebrow">${t('EVERY OFFICER HAS A PRICE')}</div><h2>${t('An offer from the police')}</h2><p>${t('Your job failed. A corrupt officer offers to look the other way. Pay now to end this prison sentence, or serve your time.')}</p><div class="bribe-quote"><span>${t('Bribe')}</span><strong>${cash(value.cost)}</strong><small>${t('Offer expires in')} <b data-bribe-time></b></small></div><p class="outcome-error" role="alert"></p><div class="formrow"><button class="btn" data-pay-bribe autofocus>${t('Bribe the officer')} · ${cash(value.cost)}</button><button class="btn secondary" data-decline-bribe>${t('Serve the sentence')}</button></div><p class="muted">${t('Closing this offer does not cancel your arrest. Cash only; no extra XP or rewards.')}</p>`;
  const current=dialog,pay=current.querySelector('[data-pay-bribe]'),decline=current.querySelector('[data-decline-bribe]');
  const update=()=>{if(!current.isConnected){clearInterval(timer);return;}const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));current.querySelector('[data-bribe-time]').textContent=seconds+'s';pay.disabled=working||!seconds||getMe().user.cash<value.cost;pay.title=getMe().user.cash<value.cost?t('Not enough cash'):'';};
  const finish=async choice=>{if(working)return;working=true;pay.disabled=decline.disabled=true;try{if(choice==='pay'||Date.now()<deadline)await api('bribery/'+choice,{id:value.id,maxCost:value.cost});clearInterval(timer);current.close();current.remove();dialog=null;document.dispatchEvent(new CustomEvent('game:custody-resolved'));await refresh();}catch(e){if(e.status===409&&choice==='decline'){clearInterval(timer);current.close();current.remove();dialog=null;document.dispatchEvent(new CustomEvent('game:custody-resolved'));await refresh();return;}current.querySelector('.outcome-error').textContent=e.message;working=false;decline.disabled=false;update();}};
  pay.onclick=()=>finish('pay');decline.onclick=()=>finish('decline');current.oncancel=e=>{e.preventDefault();void finish('decline')};document.body.append(current);current.showModal();update();timer=setInterval(update,1000);
  if(value.notificationId)void api('notifications/ack',{id:value.notificationId}).catch(()=>{});
 }
 return {offer,pump,clear(){pending=null;seen.clear();clearInterval(timer);dialog?.remove();dialog=null;}};
}
