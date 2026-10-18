import {t} from './i18n.js';
export const cityImage=city=>'/images/city-'+city.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll(' ','-')+'.png';
export const pageArt={referrals:'page-referrals.png','family-directory':'page-family-directory.png',circuit:'midnight-circuit-overview.png','auction-house':'page-art-market.png','art-market':'art-collection-overview-v2.png',
 warehouses:'page-warehouses.png',dashboard:'page-dashboard.png',login:'page-login.png',register:'page-register.png',
 'crypto':'page-crypto.png',
 'airport':'page-airport.png',
 bulletins:'page-bulletins.png',achievements:'achievements-trophy-gallery-v3.png',directory:'page-directory.png',seasons:'page-seasons.png',ranks:'page-ranks.png',inventory:'page-inventory.png',respect:'page-respect.png',
 bank:'page-bank.png',transfers:'page-transfers.png',production:'page-production.png',combat:'page-player-operations.png',bounties:'page-bounties.png',
 'family-chat':'page-family-chat.png','family-plans':'page-family-plans.png','family-assets':'page-family-assets.png','family-armory':'page-family-armory.png','family-safehouses':'page-family-safehouses.png','family-compounds':'page-family-compounds.png','family-fleet':'page-family-cars.png','family-upgrades':'page-family-security.png',
 employees:'page-employees.png',shipments:'page-shipments.png',daily:'page-daily.png',support:'page-support.png',tickets:'page-tickets.png',policy:'page-community.png',rules:'page-rules.png',faq:'page-faq.png',
 casino:'casino-interior.png',marriage:'marriage-banner.png',boutique:'premium-shop-banner.png',prison:'scene-arrest.jpg',hospital:'scene-coma.jpg',
 missions:'scene-operations.jpg',underworld:'scene-leaderboard.jpg',messages:'scene-messages.jpg',rivals:'scene-families.jpg',
 armory:'page-family-armory.png',business:'page-businesses.png',home:'page-real-estate.png',car:'page-cars.png',jet:'page-jets.png',helicopter:'page-helicopters.png',yacht:'page-yachts.png',garage:'page-garages.png',security:'page-protection.png',
 'team-missions':'page-team-missions.png',investments:'page-investments.png'
};
export function applyPageArt(el,tab,user){
 if(tab==='profile'||tab==='dashboard'||tab==='families'||tab==='family-territory')return;
 const name=tab==='admin'?(user.role==='owner'?'page-owner.png':'page-admin.png'):pageArt[tab];if(!name)return;
 const existing=el.querySelector(':scope > img.section-art,:scope > img.premium-shop-banner,:scope > img.marriage-banner,:scope > section.family-hero > img');
 const img=existing||document.createElement('img');img.src='/images/'+name;img.alt=t('Page overview');img.className='section-art page-header-art';img.width=1600;img.height=900;img.dataset.bannerFocus=['referrals','achievements','employees','team-missions','family-chat','family-plans','combat','messages'].includes(tab)?'top':['armory','family-armory','business','home','car','garage','jet','helicopter','yacht','casino','art-market','auction-house'].includes(tab)?'center':'upper';if(!existing)el.prepend(img);
}
