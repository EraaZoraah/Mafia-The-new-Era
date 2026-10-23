// One authoritative source for city-local family advantages.
export const territoryPerkRules={street:{perPlot:.0075,cap:.09},industry:{perPlot:.025,cap:.25},finance:{perPlot:.025,cap:.25},harbor:{perPlot:.03,cap:.15}};
export const financialRates=reduction=>({cryptoRate:.01*(1-reduction),artBps:Math.round(800*(1-reduction)),vehicleBps:Math.round(300*(1-reduction)),investmentBps:0});
export function cityPerks(db,scope,id,city){
 const family=!id?null:scope==='family'?id:db.prepare('SELECT family_id FROM family_members WHERE user_id=?').get(id)?.family_id;
 const counts={};if(family&&db.prepare("SELECT 1 FROM sqlite_master WHERE name='city_territories'").get())for(const r of db.prepare('SELECT item_id,COUNT(*) n FROM city_territories WHERE owner_id=? AND city=? GROUP BY item_id').all(family,city))counts[r.item_id]=r.n;
 const street=counts['territory-block']||0,industry=counts['territory-industry']||0,finance=counts['territory-finance']||0,harbor=counts['territory-harbor']||0;
 return {fees:financialRates(Math.min(.25,finance*.025)),city,familyId:family||null,street,industry,finance,harbor,saleBonus:Math.min(.09,street*.0075),productionReduction:Math.min(.25,industry*.025),feeReduction:Math.min(.25,finance*.025),boatReduction:Math.min(.15,harbor*.03)};
}
export function playerCityPerks(db,id){const city=db.prepare('SELECT city FROM users WHERE id=?').get(id)?.city||'New York';return cityPerks(db,'personal',id,city);}
export function territoryFreight(db,b,destination,quote){if(!quote)return null;const origin=cityPerks(db,b.scope||'personal',b.owner_id,b.stock_city),target=cityPerks(db,b.scope||'personal',b.owner_id,destination),reduction=quote.mode==='boat'?origin.boatReduction+target.boatReduction:0;return {...quote,hours:Math.round(quote.hours*(1-reduction)*10000)/10000,territoryReduction:reduction,originPerks:origin,destinationPerks:target};}
