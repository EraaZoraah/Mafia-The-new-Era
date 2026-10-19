const success='/images/outcome-success.png',failed='/images/outcome-failed.png',notice='/images/outcome-notice.png';
const generic=new Set(['/images/scene-families.jpg','/images/scene-leaderboard.jpg','/images/scene-operations.jpg','/images/hero.jpg','/images/banner-rivals-v3.png','/images/banner-underworld-v3.png','/images/banner-missions-v3.png']);
export function outcomeImage({route='',image,contextImage,error=false,persistent=false,title=''}={}){
 if(error||title==='Failed!'||title==='Action unavailable')return failed;
 // Only activity/purchase cards can supply contextual imagery; a profile/banner cannot.
 const contextual=/^(art\/|vehicles\/|action$|pvp$|shipments\/|assets\/buy|family\/buy|family\/map\/buy|armory\/buy|casino|crew\/|production\/|employees\/hire)/.test(route);
 const candidate=contextual?(image||contextImage):(!route?image:null);
 if(candidate&&!generic.has(candidate))return candidate;
 if(persistent&&!/success|congratulations|rank up|promotion|big score/i.test(title))return notice;
 return success;
}
