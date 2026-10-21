import {activeLocale as gameLocale} from './i18n.js';
import {html as lhtml,text as ltext} from './localization.js';
export function staffTotals(staff){
 if(!staff)return '';
 const number=n=>BigInt(n).toLocaleString(gameLocale);
 return lhtml`<section class="panel staff-totals"><h3>Staff balances · excluded from world totals</h3><div class="tablewrap"><table><thead><tr><th>Role</th><th>Player</th><th>Cash</th><th>Bank</th><th>XP</th></tr></thead><tbody>${['owner','admin','combined'].map(role=>{const r=staff[role];return lhtml`<tr><th>${role==='combined'?ltext('Staff total'):role==='owner'?ltext('Owner'):ltext('Admin')}</th><td>${(r.accounts||[]).map(p=>lhtml`<a class="player-link" href="#profile/${Number(p.id)}">${String(p.username).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</a>`).join(' · ')||'—'}</td><td>$${number(r.cash)}</td><td>$${number(r.bank)}</td><td>${number(r.xp)}</td></tr>`}).join('')}</tbody></table></div></section>`;
}
