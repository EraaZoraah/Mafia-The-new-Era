import fs from 'node:fs';
import {milestones} from '../legacy.js';
import {coins} from '../city-expansion.js';
fs.mkdirSync('public/icons',{recursive:true});
// Preserve reviewed custom artwork; this legacy generator only fills missing files.
const writeNew=(file,data)=>{if(!fs.existsSync(file))fs.writeFileSync(file,data)};
const motifs={
 crown:'<path d="M7 27 4 11l9 7 7-12 7 12 9-7-3 16zM8 33h24"/>',
 diamond:'<path d="m3 15 7-9h20l7 9-17 21zM3 15h34M10 6l10 30L30 6"/>',
 shield:'<path d="M20 3 5 9v12c0 8 15 16 15 16s15-8 15-16V9zM12 20l6 6 11-13"/>',
 tower:'<path d="M8 36V14h24v22M5 14l15-9 15 9M14 20v4m12-4v4M16 36V29h8v7"/>',
 briefcase:'<rect x="4" y="13" width="32" height="22" rx="3"/><path d="M14 13V7h12v6M4 23h32M17 21v5h6v-5"/>',
 people:'<circle cx="20" cy="11" r="6"/><path d="M9 35v-7a11 11 0 0 1 22 0v7M5 15a4 4 0 1 0 0 8m-3 12v-5m33-15a4 4 0 1 1 0 8m3 12v-5"/>',
 target:'<circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="8"/><path d="M20 1v10m0 18v10M1 20h10m18 0h10"/>',
 star:'<path d="m20 3 5 11 12 2-9 9 2 12-10-6-10 6 2-12-9-9 12-2z"/>',
 coin:'<circle cx="20" cy="20" r="16"/><path d="M26 12H17a5 5 0 0 0 0 10h6a5 5 0 0 1 0 10h-9M20 8v27"/>',
 trophy:'<path d="M10 5h20v11a10 10 0 0 1-20 0zM10 10H4v7c0 5 6 6 8 6m18-13h6v7c0 5-6 6-8 6M20 26v9m-8 1h16"/>',
 dice:'<rect x="5" y="5" width="30" height="30" rx="5"/><circle cx="12" cy="12" r="1"/><circle cx="28" cy="12" r="1"/><circle cx="20" cy="20" r="1"/><circle cx="12" cy="28" r="1"/><circle cx="28" cy="28" r="1"/>',
 chat:'<path d="M5 6h30v24H15L5 37zM11 13h18M11 20h13"/>',
 heart:'<path d="M20 35 5 21C-5 8 12-2 20 10 28-2 45 8 35 21z"/>',
 plane:'<path d="m20 3 4 14 13 8v4l-14-5v10l5 3H12l5-3V24L3 29v-4l13-8z"/>',
 anchor:'<circle cx="20" cy="8" r="4"/><path d="M20 12v25M12 19h16M4 25c0 16 32 16 32 0M2 28l2-5 5 3m22 0 5-3 2 5"/>',
 key:'<circle cx="12" cy="12" r="8"/><path d="m18 18 18 18m-9-9 5-5m-1 9 5-5"/>',
 book:'<path d="M20 9C13 4 7 4 3 6v28c7-2 12-1 17 3 5-4 10-5 17-3V6c-4-2-10-2-17 3v28"/>',
 bars:'<path d="M5 35V23h7v12m4 0V14h7v21m4 0V5h7v30M2 36h36"/>',
 lock:'<rect x="7" y="18" width="26" height="19" rx="3"/><path d="M12 18V11a8 8 0 0 1 16 0v7M20 25v6"/>',
 map:'<path d="m3 8 11-4 12 4 11-4v29l-11 4-12-4-11 4zM14 4v29M26 8v29"/>',
 envelope:'<rect x="3" y="7" width="34" height="26" rx="3"/><path d="m4 9 16 13L36 9M4 31l10-12m22 12L26 19"/>',
 car:'<path d="m8 13 4-8h16l4 8 4 5v15H4V18zM8 14h24M9 23h5m12 0h5M8 33v4m24-4v4"/>',
 sun:'<circle cx="20" cy="20" r="9"/><path d="M20 1v5m0 28v5M1 20h5m28 0h5M6 6l4 4m20 20 4 4M6 34l4-4M30 10l4-4"/>',
 cross:'<path d="M14 4h12v10h10v12H26v10H14V26H4V14h10z"/>',
 flag:'<path d="M7 37V4c10-7 15 8 27 0v19c-12 8-17-7-27 0"/>',
 weapon:'<path d="M3 11h33v10H22l-5 15H8l4-15H3zM5 7h9m13 0h6M24 21v7h-5"/>',
 compass:'<circle cx="20" cy="20" r="16"/><path d="m26 12-3 11-10 5 4-11z"/>'
};
const wrap=(body,size=40)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none" stroke="#dfc38c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
motifs.helicopter='<path d="M4 8h32M20 8v8m-8 0h13l8 8-3 6H13l-7-8H2m2 12h30M15 30v4m12-4v4M23 16v9h10"/>';
const menu={city:'map',bulletins:'flag',achievements:'trophy',dashboard:'bars',profile:'people',marriage:'heart',personal:'diamond',inventory:'briefcase',employees:'people',armory:'weapon',business:'tower',home:'tower',garage:'key',car:'car',helicopter:'helicopter',jet:'plane',yacht:'anchor',families:'crown','family-assets-menu':'shield','family-assets':'briefcase','family-territory':'map','family-armory':'weapon','family-safehouses':'lock','family-compounds':'tower','family-fleet':'car','family-upgrades':'shield','family-chat':'chat','family-plans':'target',operations:'target',daily:'book',missions:'briefcase','team-missions':'people',bounties:'target',shipments:'briefcase',combat:'target',security:'shield',production:'tower',airport:'plane',finances:'coin',bank:'coin',transfers:'envelope',casino:'dice',underworld:'crown',directory:'people',respect:'star',hospital:'cross',prison:'lock',ranks:'bars',seasons:'trophy',boutique:'diamond',messages:'envelope',admin:'key',tickets:'envelope',support:'chat',policy:'shield',rules:'book',faq:'compass',rivals:'flag'};
for(const [id,m]of Object.entries(menu))writeNew(`public/icons/menu-${id}.svg`,wrap(motifs[m]));
motifs.house='<path d="M3 19 20 4l17 15M7 16v21h26V16M16 37V25h8v12"/>';
const keyMotif={shipments:'flag',homes:'house',cars:'car',jets:'plane',yachts:'anchor',crimes:'target',businesses:'tower',family:'people',team:'shield',respect:'star',wealth:'coin',assets:'briefcase',bigScores:'diamond'};
const levels={};for(const m of milestones){const level=(levels[m.key]=(levels[m.key]||0)+1),roman=['I','II','III','IV','V','VI','VII','VIII','IX','X'][level-1]||String(level);const body=`<circle cx="40" cy="40" r="36" stroke="#af925f"/><circle cx="40" cy="40" r="31" stroke="#6d5b3d"/><g transform="translate(20 12)">${motifs[keyMotif[m.key]||'trophy']}</g><path d="M16 62h48"/><text x="40" y="73" text-anchor="middle" fill="#ead3a2" stroke="none" font-family="Georgia,serif" font-size="12">${roman}</text>`;writeNew(`public/icons/achievement-${m.id}.svg`,wrap(body,80));}
const cm=['shield','target','crown','star','sun','diamond','crown','briefcase','anchor','key','sun','compass','lock','coin','plane'];
// Coin artwork is generated separately; never recreate obsolete coin SVGs.
console.log(`Created ${Object.keys(menu).length} menu icons, ${milestones.length} achievement medals, ${coins.length} coin logos.`);

