import {menu} from './navigation.js';
import {t} from './i18n.js';
import {html as lhtml} from './localization.js';
export function renderNavigation({user,tab,openGroups=new Set()}){
 const link=([id,label])=>lhtml`<button type="button" data-tab="${id}" class="${tab===id?'active':''} ${['admin','tickets'].includes(id)?'staff-nav-link':''}" ${id==='tickets'?'data-ticket-badge':''} ${tab===id?'aria-current="page"':''}><img class="menu-icon" src="/icons/menu-${id}.svg" alt="">${t(id==='admin'&&user.role==='admin'?'Admin Panel':label.replace(/^[^A-Za-z]+/,''))}</button>`;
 return menu.filter(x=>!Array.isArray(x)||!['admin','tickets'].includes(x[0])||['owner','admin'].includes(user.role)).map(x=>Array.isArray(x)?link(x):lhtml`<details class="nav-group ${x.items.some(([id])=>id===tab)?'has-active':''}" data-menu-group="${x.id}" ${openGroups.has(x.id)?'open':''}><summary><img class="menu-icon" src="/icons/menu-${x.id}.svg" alt="">${t(x.label.replace(/^[^A-Za-z]+/,''))}<span class="nav-chevron" aria-hidden="true">⌄</span></summary><div class="nav-children">${x.items.map(link).join('')}</div></details>`).join('');
}
export function bindNavigation(root,openGroups){
 root.querySelectorAll('[data-menu-group]').forEach(group=>group.ontoggle=()=>{
  if(group.open){openGroups.add(group.dataset.menuGroup);root.querySelectorAll('[data-menu-group]').forEach(other=>{if(other!==group){other.open=false;openGroups.delete(other.dataset.menuGroup)}});}
  else openGroups.delete(group.dataset.menuGroup);
 });
}
