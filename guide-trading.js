import {dutch,spanish,french,german} from './public/i18n.js';
const dictionaries={nl:dutch,es:spanish,fr:french,de:german};
export const isTradingQuestion=q=>{
 const s=String(q).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
 return /crypto|coin|munt|drug|cannabis|hash|cocain|ecstasy|meth|art|kunst|antiek|auction|veiling|vehicle|car\b|auto|voertuig|handels|trading|trade|invest|belegg|nettowinst|nettoverlies|profit|verlies|winst|loss|benefic|gananci|gewinn|verlust/.test(s)&&/realiz|record|total|result|netto(?:winst|verlies)|verdiend|ontvangen|invested|handelsergebnis|historical|history|trading loss|gewinn|verlust|benefic|gananci/.test(s)&&!/best|beste|gunstig|recommend/.test(s);
};
export function tradingGuide(question,context){
 if(!context.trading||!isTradingQuestion(question))return null;
 const language=context.language||'en',dictionary=dictionaries[language]||{},t=(key,values={})=>(dictionary[key]||key).replace(/\{v(\d+)\}/g,(_,i)=>String(values[i]??''));
 const money=n=>'$'+BigInt(n||0).toLocaleString('en-US'),query=String(question).toLowerCase();
 const rows=[['crypto','Crypto exchange',context.trading.crypto],['production','Drug production',context.trading.production],['investments','Investments',context.trading.investments],['art-market','Art & antiquities',context.art?.trade],['warehouses','Recovered vehicles',context.vehicles?.trade],['garage','Purchased cars',context.vehicles?.purchasedTrade]].filter(r=>r[2]);
 const selected=/investment|investering|belegg|inversion|placement|anlage/.test(query)?rows.filter(r=>r[0]==='investments'):/crypto|coin|munt/.test(query)?rows.filter(r=>r[0]==='crypto'):/drug|cannabis|hash|cocain|ecstasy|meth/.test(query)?rows.filter(r=>r[0]==='production'):/art|kunst|antiek|antiqu/.test(query)?rows.filter(r=>r[0]==='art-market'):/car|auto|vehicle|voertuig/.test(query)?rows.filter(r=>['garage','warehouses'].includes(r[0])):rows;
 const answer=[t('Your recorded personal trading results.'),t('Unsold quotes are not income. Net cash result includes spending on stock that has not been sold yet.')];
 for(const [,label,data] of selected){
  answer.push(t('{v0}: invested {v1}; received {v2}; net cash result {v3}.',{0:t(label),1:money(data.invested),2:money(data.received),3:money(data.net)}));
  if(data.profit!==null)answer.push(t('Realized profit / loss: {v0}.',{0:money(data.profit)}));
  for(const r of data.items.filter(r=>r.name&&query.includes(r.name.toLowerCase())))answer.push(t('{v0}: invested {v1}; received {v2}; net cash result {v3}.',{0:t(r.name),1:money(r.invested),2:money(r.received),3:money(r.net)}));
  if(data.missing)answer.push(t('Some older receipts are missing. Only verifiable amounts are included; unknown historical proceeds are not estimated.'));
 }
 return {name:'Luca Moretti',mode:'local',answer:answer.join('\n\n'),links:selected.map(([tab,label])=>({tab,label:t(label)})),suggestions:[],trading:context.trading};
}
