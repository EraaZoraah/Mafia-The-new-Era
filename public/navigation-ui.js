import {navigationSections} from './navigation.js';
import {t} from './i18n.js';
import {html as lhtml} from './localization.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>s.replace(/^[^A-Za-z]+/,'');
const normalize=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const labelFor=(id,label,user)=>id==='admin'&&user.role==='admin'?'Admin Panel':clean(label);
export function navigationMatches(label,query){return normalize(label+' '+t(label)).includes(normalize(query));}
export function renderNavigation({user,tab,openGroups=new Set(),query=''}){
 const link=([id,label])=>{const text=labelFor(id,label,user);return lhtml`<button type="button" data-tab="${id}" data-navigation-label="${esc(text)}" class="${tab===id?'active':''}" ${id==='tickets'?'data-ticket-badge':''} ${tab===id?'aria-current="page"':''}><img class="menu-icon" src="/icons/menu-${id}.svg" alt=""><span${id==='tickets'?' class="ticket-label"':''}>${t(text)}</span></button>`};
 const visible=item=>!Array.isArray(item)||!['admin','tickets'].includes(item[0])||['owner','admin'].includes(user.role);
 const sections=navigationSections.map(section=>lhtml`<section class="navigation-section" data-navigation-section="${section.id}" aria-label="${t(section.label)}"><h3 class="navigation-section-label">${t(section.label)}</h3>${section.items.filter(visible).map(item=>Array.isArray(item)?link(item):lhtml`<details class="nav-group ${item.items.some(([id])=>id===tab)?'has-active':''}" data-menu-group="${item.id}" data-navigation-label="${esc([item.label,t(item.label),...(item.aliases||[]).flatMap(label=>[label,t(label)])].join(' '))}" ${openGroups.has(item.id)?'open':''}><summary><img class="menu-icon" src="/icons/menu-${item.id}.svg" alt=""><span>${t(item.label)}</span><span class="nav-chevron" aria-hidden="true">›</span></summary><div class="nav-children">${item.items.map(link).join('')}</div></details>`).join('')}</section>`).join('');
 return lhtml`<div class="navigation-search"><label class="sr-only" for="navigation-search">${t('Find a page')}</label><img src="/icons/menu-search-pages.svg" alt=""><input id="navigation-search" type="search" maxlength="100" autocomplete="off" placeholder="${t('Find a page…')}" value="${esc(query)}"><button type="button" data-clear-navigation aria-label="${t('Clear page search')}" ${query?'':'hidden'}>×</button></div>${sections}<p class="navigation-empty" role="status" hidden>${t('No matching pages.')}</p>`;
}
export function bindNavigation(root,openGroups,{onSearch=()=>{}}={}){
 const groups=[...root.querySelectorAll('[data-menu-group]')],input=root.querySelector('#navigation-search');
 function filter(){
  const query=input?.value||'';onSearch(query);root.querySelector('[data-clear-navigation]')?.toggleAttribute('hidden',!query);
  for(const group of groups){
   const matchGroup=query&&navigationMatches(group.dataset.navigationLabel,query);let matches=0;
   group.querySelectorAll('[data-tab]').forEach(b=>{b.hidden=!!query&&!matchGroup&&!navigationMatches(b.dataset.navigationLabel,query);if(!b.hidden)matches++});
   group.hidden=!matches;
   group.open=query?matches>0:openGroups.has(group.dataset.menuGroup);
  }
  root.querySelectorAll('.navigation-section').forEach(section=>{
   [...section.children].filter(e=>e.matches('button[data-tab]')).forEach(b=>b.hidden=!!query&&!navigationMatches(b.dataset.navigationLabel,query));
   section.hidden=![...section.children].some(e=>(e.matches('button[data-tab]')||e.matches('[data-menu-group]'))&&!e.hidden);
  });
  const empty=root.querySelector('.navigation-empty');if(empty)empty.hidden=[...root.querySelectorAll('.navigation-section')].some(s=>!s.hidden);
 }
 groups.forEach(group=>{
  group.querySelector('summary').onclick=event=>{
   event.preventDefault();const next=!group.open;
   if(!input?.value){groups.forEach(other=>{if(other!==group)other.open=false});openGroups.clear();if(next)openGroups.add(group.dataset.menuGroup);}
   group.open=next;
  };
  // Delayed native toggle events must never close a destination Luca just revealed.
  group.ontoggle=()=>{if(input?.value)return;if(group.open)openGroups.add(group.dataset.menuGroup);else openGroups.delete(group.dataset.menuGroup)};
 });
 if(input){input.oninput=filter;input.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();input.value='';filter()}else if(e.key==='Enter'){e.preventDefault();const first=[...root.querySelectorAll('[data-tab]')].find(b=>!b.hidden&&!b.closest('[data-menu-group][hidden]')&&!b.closest('.navigation-section[hidden]'));first?.click()}};}
 const clear=root.querySelector('[data-clear-navigation]');if(clear)clear.onclick=()=>{input.value='';filter();input.focus()};
 filter();
}
export function revealNavigation(root,tab){
 const toggle=root.querySelector('#toggle-sidebar');if(toggle?.getAttribute('aria-expanded')==='false')toggle.click();
 const input=root.querySelector('#navigation-search');if(input?.value){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}))}
 const target=[...root.querySelectorAll('.nav [data-tab]')].find(b=>b.dataset.tab===tab);if(!target)return null;
 const group=target.closest('details');if(group){root.querySelectorAll('[data-menu-group]').forEach(other=>{if(other!==group)other.open=false});group.open=true;}return target;
}

// Receipts persist on the server; polling never marks a closed channel as read.
export function installUnreadBadges({api,getMe}){
 let busy=false;
 const paint=(node,count)=>{if(!node)return;node.querySelector(':scope > .unread-count')?.remove();node.classList.toggle('has-unread',count>0);if(count>0){const badge=document.createElement('span');badge.className='unread-count';badge.textContent=count.toLocaleString('en-US');node.append(badge)}const group=node.closest('details');if(group)group.classList.toggle('has-unread-group',!!group.querySelector('.has-unread'));};
 async function update(){if(busy||!getMe()||document.hidden)return;busy=true;try{const user=getMe().user.id,[d,n]=await Promise.all([api('unread'),api('news')]);if(getMe()?.user.id!==user)return;paint(document.querySelector('.nav [data-tab="messages"]'),d.messages);paint(document.querySelector('.nav [data-tab="family-chat"]'),d.family);paint(document.querySelector('.nav [data-tab="bulletins"]'),n.unreadCount);paint(document.querySelector('#world-chat-toggle'),d.world);}catch{}finally{busy=false}}
 document.addEventListener('game:channel-read',async e=>{const {channel,lastId}=e.detail||{};try{await api('chat/read',{channel,lastId});await update()}catch{}});
 document.addEventListener('game:unread-refresh',()=>void update());setInterval(()=>void update(),10000);return update;
}
