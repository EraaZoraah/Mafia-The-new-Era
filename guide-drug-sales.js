import {dutch,spanish,french,german} from './public/i18n.js';
const dictionaries={nl:dutch,es:spanish,fr:french,de:german};
export function isDrugSalesQuestion(q){const s=String(q||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();return /drug|cannabis|hash|cocain|ecstasy|meth|drog|batch|krat|crate|carg/.test(s)&&/sell|sale|verkoop|verkopen|vervoer|verschee|best choice|highest profit|vend|vent|vendre|verkauf|transport/.test(s);}
export function drugSalesGuide(question,user,time,context){
 if(!isDrugSalesQuestion(question)||!context.drugSales)return null;
 const d=context.drugSales,dict=dictionaries[context.language]||{},t=(s,a=[])=>(dict[s]||s).replace(/\{v(\d+)\}/g,(_,i)=>String(a[i]??'')),cash=n=>'$'+Math.floor(n).toLocaleString('en-US');
 const answer=[t('Best choice and Highest profit compare sale destinations for each owned batch, including local sale. Best choice uses expected net after interception risk; Highest profit uses net if delivered. Only affordable routes qualify. Shipping starts transport; sell the batch after arrival. Quotes can change.')];
 const named=d.products.find(p=>String(question).toLowerCase().includes(p.id)||String(question).toLowerCase().includes(t(p.name).toLowerCase()));
 const batches=d.batches.filter(b=>!b.remaining&&b.arrives_at<=time&&(!named||b.drug_id===named.id));
 if(!batches.length)answer.push(t('No completed stock is ready for this sale comparison.'));
 for(const b of batches){const p=d.products.find(p=>p.id===b.drug_id);answer.push(t('Batch #{v0} · {v1} · {v2} crates · {v3}.',[b.batchNumber,t(p.name),b.units,t(d.scope==='family'?'Family':'Personal')]));
  for(const [label,r] of [['Best choice',b.saleChoices.best],['Highest profit',b.saleChoices.highest]])if(r)answer.push(t('{v0}: {v1} by {v2}, {v3}h; fee {v4}; net if delivered {v5}; expected net {v6}; interception {v7}%.',[t(label),r.city,t(r.name),r.hours,cash(r.cost),cash(r.netProfit),cash(r.expectedProfit),(r.risk*100).toFixed(1)]));
 }
 if(!d.canManage||Math.max(user.prison_until||0,user.hospital_until||0,user.captured_until||0)>time||user.health<10)answer.push(t('These are comparison quotes only. Your current role, custody or health prevents dispatch or sale.'));
 return {name:'Luca Moretti',mode:'local',answer:answer.join('\n\n'),links:[{tab:'production',label:t('Drug production')}],suggestions:[],drugSales:{scope:d.scope,batches,expiresAt:d.nextMarketUpdate}};
}
