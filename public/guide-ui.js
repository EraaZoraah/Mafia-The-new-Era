import {html as lhtml,text as ltext} from './localization.js';
import {t,activeLanguage} from './i18n.js';
export function createGuideUI({api,getMe,esc,navigate}) {
 let owner=null,request=0;
 function mount(){
  const user=getMe()?.user,old=document.getElementById('personal-guide');
  if(!user){old?.remove();owner=null;request++;return}
  if(old&&owner===user.id)return;
  old?.remove();owner=user.id;request++;
  const widget=document.createElement('section');widget.id='personal-guide';
  widget.innerHTML=lhtml`<button class="guide-toggle" aria-expanded="false" aria-controls="guide-window"><img src="/icons/personal-assistant.svg" alt="" width="22" height="22"> ${t('Personal Assistant')}</button><section id="guide-window" class="guide-window" hidden aria-label="Luca Moretti, Personal Assistant"><header><div><strong>Luca Moretti</strong><small>${t('Personal Assistant · Local game guide')}</small></div><button class="btn secondary small" aria-label="${t('Close assistant')}">×</button></header><div class="guide-feed" aria-live="polite"></div><form><label for="guide-question">${t('Ask Luca about the game')}</label><input id="guide-question" maxlength="500" placeholder="${t('Where can I buy a business?')}" autocomplete="off"><button class="btn small">${t('Ask Luca')}</button></form><p class="guide-disclaimer">${t('Free local guide. No external AI service. Tips do not perform actions for you.')}</p></section>`;
  document.body.append(widget);
  const toggle=widget.querySelector('.guide-toggle'),win=widget.querySelector('#guide-window'),feed=widget.querySelector('.guide-feed'),input=widget.querySelector('input');
  const setOpen=value=>{win.hidden=!value;toggle.setAttribute('aria-expanded',String(value));if(value){input.focus();void ask('')}else toggle.focus()};
  toggle.onclick=()=>setOpen(win.hidden);widget.querySelector('header button').onclick=()=>setOpen(false);
  win.onkeydown=e=>{if(e.key==='Escape')setOpen(false)};
  async function ask(question){
   const generation=++request;feed.textContent=t('Checking your next move…');
   try{const d=await api('guide?q='+encodeURIComponent(question)+'&lang='+activeLanguage);if(generation!==request||!widget.isConnected)return;
    const card=x=>lhtml`<article class="guide-tip"><strong>${esc(x.label)}</strong>${x.text?lhtml`<p>${esc(x.text)}</p>`:''}<div><button class="btn small secondary" data-guide-show="${esc(x.tab)}">${t('Show me')}</button> <button class="btn small" data-guide-open="${esc(x.tab)}">${t('Open page')}</button></div></article>`;
    feed.innerHTML=lhtml`<p>${esc(d.answer)}</p>${d.links.map(card).join('')}<h3>${t('Your next moves')}</h3>${d.suggestions.map(card).join('')}`;
    feed.querySelectorAll('[data-guide-show]').forEach(button=>button.onclick=()=>{
     const target=[...document.querySelectorAll('.nav [data-tab]')].find(el=>el.dataset.tab===button.dataset.guideShow);
     if(!target)return;document.querySelectorAll('.guide-highlight').forEach(el=>el.classList.remove('guide-highlight'));
     const group=target.closest('details');if(group)group.open=true;target.classList.add('guide-highlight');target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true});setTimeout(()=>target.classList.remove('guide-highlight'),12000);
     win.hidden=true;toggle.setAttribute('aria-expanded','false');
    });
    feed.querySelectorAll('[data-guide-open]').forEach(button=>button.onclick=()=>{navigate(button.dataset.guideOpen);setOpen(false)});
   }catch(error){if(generation===request&&widget.isConnected)feed.textContent=error.message}
  }
  widget.querySelector('form').onsubmit=e=>{e.preventDefault();void ask(input.value.trim())};
 }
 return {mount};
}
