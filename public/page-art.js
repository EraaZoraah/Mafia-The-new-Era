import {t} from './i18n.js';
export const cityImage=city=>'/images/city-'+city.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll(' ','-')+'.png';
export const pageArt={activity:'banner-activity.png',referrals:'banner-referrals-v3.png','family-directory':'banner-family-directory-v3.png',circuit:'midnight-circuit-overview.png','auction-house':'banner-auction-house-v3.png','art-market':'art-collection-overview-v2.png',
 warehouses:'page-warehouses.png',dashboard:'banner-dashboard-v3.png',login:'page-login.png',register:'page-register.png',
 'crypto':'banner-crypto-v3.png',
 'airport':'banner-airport-v3.png',
 bulletins:'banner-bulletins-v3.png',achievements:'achievements-trophy-gallery-v3.png',directory:'banner-directory-v3.png',seasons:'banner-seasons-v3.png',ranks:'banner-ranks-v3.png',inventory:'banner-inventory-v3.png',respect:'banner-respect-v3.png',
 bank:'banner-bank-v3.png',transfers:'banner-transfers-v3.png',production:'banner-production-v3.png',combat:'banner-combat-v3.png',bounties:'banner-bounties-v3.png',
 'family-chat':'banner-family-chat-v3.png','family-plans':'banner-family-plans-v3.png','family-assets':'banner-family-assets-v3.png','family-armory':'banner-family-armory-v3.png','family-safehouses':'banner-family-safehouses-v3.png','family-compounds':'banner-family-compounds-v3.png','family-fleet':'banner-family-fleet-v3.png','family-upgrades':'banner-family-upgrades-v3.png',
 employees:'banner-employees-v3.png',shipments:'banner-shipments-v3.png',daily:'banner-daily-v3.png',support:'banner-support-v3.png',tickets:'banner-tickets-v3.png',policy:'banner-policy-v3.png',rules:'banner-rules-v3.png',faq:'banner-faq-v3.png',
 casino:'banner-casino-v3.png',marriage:'marriage-banner.png',boutique:'premium-shop-v4.png',prison:'banner-prison-v3.png',hospital:'banner-hospital-v3.png',
 missions:'banner-missions-v3.png',underworld:'banner-underworld-v3.png',messages:'banner-messages-v3.png',rivals:'banner-rivals-v3.png',
 armory:'banner-family-armory-v3.png',business:'page-businesses.png',home:'banner-home-v3.png',car:'banner-car-v3.png',jet:'banner-jet-v3.png',helicopter:'banner-helicopter-v3.png',yacht:'banner-yacht-v3.png',garage:'banner-garage-v3.png',security:'page-protection.png',
 'team-missions':'banner-team-missions-v3.png',investments:'banner-investments-v3.png'
};
Object.assign(pageArt,{"referrals": "banner-referrals-v3.png", "family-directory": "banner-family-directory-v3.png", "auction-house": "banner-auction-house-v3.png", "dashboard": "banner-dashboard-v3.png", "crypto": "banner-crypto-v3.png", "airport": "banner-airport-v3.png", "bulletins": "banner-bulletins-v3.png", "directory": "banner-directory-v3.png", "seasons": "banner-seasons-v3.png", "ranks": "banner-ranks-v3.png", "inventory": "banner-inventory-v3.png", "respect": "banner-respect-v3.png", "bank": "banner-bank-v3.png", "transfers": "banner-transfers-v3.png", "production": "banner-production-v3.png", "combat": "banner-combat-v3.png", "bounties": "banner-bounties-v3.png", "family-chat": "banner-family-chat-v3.png", "family-plans": "banner-family-plans-v3.png", "family-assets": "banner-family-assets-v3.png", "family-armory": "banner-family-armory-v3.png", "family-safehouses": "banner-family-safehouses-v3.png", "family-compounds": "banner-family-compounds-v3.png", "family-fleet": "banner-family-fleet-v3.png", "family-upgrades": "banner-family-upgrades-v3.png", "employees": "banner-employees-v3.png", "shipments": "banner-shipments-v3.png", "daily": "banner-daily-v3.png", "support": "banner-support-v3.png", "tickets": "banner-tickets-v3.png", "policy": "banner-policy-v3.png", "rules": "banner-rules-v3.png", "faq": "banner-faq-v3.png", "casino": "banner-casino-v3.png", "prison": "banner-prison-v3.png", "missions": "banner-missions-v3.png", "underworld": "banner-underworld-v3.png", "messages": "banner-messages-v3.png", "rivals": "banner-rivals-v3.png", "home": "banner-home-v3.png", "car": "banner-car-v3.png", "jet": "banner-jet-v3.png", "helicopter": "banner-helicopter-v3.png", "yacht": "banner-yacht-v3.png", "garage": "banner-garage-v3.png", "team-missions": "banner-team-missions-v3.png", "investments": "banner-investments-v3.png", "hospital": "banner-hospital-v3.png", "armory": "banner-family-armory-v3.png"});
export function applyPageArt(el,tab,user){
 if(tab==='profile'||tab==='dashboard'||tab==='families'||tab==='family-territory')return;
 const name=tab==='admin'?(user.role==='owner'?'banner-owner-v3.png':'banner-admin-v3.png'):pageArt[tab];if(!name)return;
 const existing=el.querySelector(':scope > img.section-art,:scope > img.premium-shop-banner,:scope > img.marriage-banner,:scope > section.family-hero > img');
 const img=existing&&existing.getAttribute('src')==='/images/'+name?existing:document.createElement('img');if(existing&&['airport','rivals'].includes(tab)&&existing.parentElement.matches('section.family-hero')){const hero=existing.parentElement;hero.before(existing);hero.classList.remove('family-hero');hero.classList.add('page-intro-panel');}if(existing&&img!==existing)existing.replaceWith(img);img.src='/images/'+name;img.alt=t('Page overview');img.className='section-art page-header-art';img.width=2172;img.height=724;img.loading='eager';img.fetchPriority='high';img.dataset.bannerFocus=['referrals','achievements','employees','team-missions','family-chat','family-plans','combat','messages'].includes(tab)?'top':['armory','family-armory','business','home','car','garage','jet','helicopter','yacht','casino','art-market','auction-house'].includes(tab)?'center':'upper';if(!existing)el.prepend(img);
}

export function pageArtSource(tab,user={}){
 const name=tab==='admin'?(user.role==='owner'?'banner-owner-v3.png':'banner-admin-v3.png'):pageArt[tab];
 return name?'/images/'+name:null;
}
const readyArt=new Map();
export function warmPageArt(tab,user){
 const src=pageArtSource(tab,user);if(!src||typeof Image==='undefined')return Promise.resolve();
 if(!readyArt.has(src))readyArt.set(src,new Promise(resolve=>{
  const image=new Image();image.fetchPriority='high';image.loading='eager';
  const timer=setTimeout(resolve,1500);
  const done=()=>{clearTimeout(timer);resolve();};
  image.onerror=done;image.onload=()=>{if(image.decode)image.decode().catch(()=>{}).then(done);else done();};image.src=src;
 }));
 return readyArt.get(src);
}

export function prioritizeVisibleImages(el){
 for(const image of el.querySelectorAll('img')){
  if(image.closest('.brand,.profile-hero,.family-home-hero,.empire-hero')||image.matches('.page-header-art,.section-art')||image.getBoundingClientRect().top<window.innerHeight*2){
   image.loading='eager';image.fetchPriority=image.matches('.page-header-art,.section-art')?'high':'auto';
  }
 }
}
