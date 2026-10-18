import {text as ltext,html as lhtml} from './localization.js';
const labels={business:'Businesses',home:'Real estate',car:'Cars',garage:'Private garages',helicopter:'Helicopters',jet:'Private jets',yacht:'Yachts',weapon:'Weapons & ammunition',vehicle:'Vehicle warehouses',production:'Production warehouses'};
export function groupedAssets(items,render){
 const groups=[...new Set(items.map(x=>x.storageKind||x.category))];
 return groups.map(category=>lhtml`<section class="asset-category"><h3>${ltext(labels[category]||category)}</h3><div class="profile-assets">${items.filter(x=>(x.storageKind||x.category)===category).sort((a,b)=>b.price-a.price).map(render).join('')}</div></section>`).join('');
}
export function sortCollection(items,order='value-desc'){
 const value=x=>x.resale??x.saleValue??x.price??0;
 return [...items].sort((a,b)=>order==='condition'?((b.condition_stars||4)-(a.condition_stars||4)||value(b)-value(a)):order==='name'?a.name.localeCompare(b.name,'en'):order==='value-asc'?value(a)-value(b):value(b)-value(a));
}
