import {html as lhtml,text as ltext} from './localization.js';
import {t,activeLanguage,languages} from './i18n.js';
// A translation is selectable only after complete player-facing coverage is ready.
// Rank names and player-authored content remain unchanged in every locale.
export function languageControl(){
 return lhtml`<details class="language-control"><summary aria-label="${t('Select language')}"><img src="/icons/flag-${activeLanguage}.svg" alt=""> ${activeLanguage.toUpperCase()}</summary><div class="language-options">${[['en','English'],['nl','Nederlands'],['fr','Français'],['de','Deutsch'],['es','Español']].map(([code,label])=>lhtml`<button type="button" data-language="${code}" ${languages[code].ready?'':`disabled title="${t('Coming soon')}"`} ${code===activeLanguage?'aria-current="true"':''}><img src="/icons/flag-${code}.svg" alt=""> ${code.toUpperCase()} · ${label}${code===activeLanguage?' ✓':languages[code].ready?'':' — '+t('Coming soon')}</button>`).join('')}</div></details>`;
}
