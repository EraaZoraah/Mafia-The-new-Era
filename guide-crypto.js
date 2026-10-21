import {coins} from './city-expansion.js';
import {dutch,spanish,french,german} from './public/i18n.js';
const dictionaries={nl:dutch,es:spanish,fr:french,de:german};
const normalize=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
export const isCryptoAnalysisQuestion=q=>{
 const s=normalize(q);
 return (/crypto|coin|munt|moneda|monnaie|krypto/.test(s)||coins.some(c=>new RegExp('\\b'+c.id+'\\b').test(s)))&&/buy|koop|kopen|interess|best|bottom|low|diep|stijg|rise|rising|trend|analy|compr|mejor|minim|subir|ache|meille|bas\b|hausse|kauf|tief|steig|empfehl|g[uü]nstig/.test(s);
};

export function analyzeCrypto(snapshot,user,time){
 const end=snapshot.nextUpdate-300000;
 return snapshot.coins.map(c=>{
  const history=snapshot.history.filter(h=>h.coin===c.id&&h.epoch*300000>=end-14400000&&h.epoch*300000<=end).sort((a,b)=>a.epoch-b.epoch);
  const values=history.map(h=>h.price),low=values.length?Math.min(...values):c.price,high=values.length?Math.max(...values):c.price;
  const momentum=history.length>=7?(c.price/history.at(-7).price-1)*100:0;
  const moves=values.slice(1).map((v,i)=>(v/values[i]-1)*100),volatility=moves.length?Math.sqrt(moves.reduce((n,v)=>n+v*v,0)/moves.length):0;
  const rangePosition=high>low?Math.max(0,Math.min(100,(c.price-low)/(high-low)*100)):50;
  const wallet=snapshot.wallet.find(w=>w.coin===c.id)||{quantity:0,basis:0};
  const maximum=Math.max(0,Math.min(100000000,Math.floor(user.cash/c.buy),Math.floor((snapshot.limit-wallet.basis)/c.buy)));
  const detained=Math.max(user.prison_until||0,user.hospital_until||0)>time;
  const sufficient=history.length>=7&&history.at(-1)?.epoch*300000===end&&history.slice(-7).every((h,i,a)=>!i||h.epoch===a[i-1].epoch+1);
  // A transparent watchlist score, never a forecast or probability of profit.
  const score=(100-rangePosition)*.4+Math.max(-10,Math.min(10,momentum))*2-volatility*3;
  return {...c,low,high,momentum,volatility,rangePosition,observations:history.length,maximum,held:wallet.quantity,basis:wallet.basis,breakEvenRise:(Math.ceil(c.buy/.99)/c.price-1)*100,score,sufficient,eligible:maximum>0&&!detained&&user.health>0&&sufficient&&snapshot.nextUpdate>time};
 });
}

export function cryptoGuide(question,user,time,context){
 if(!isCryptoAnalysisQuestion(question)||!context.cryptoMarket)return null;
 const dictionary=dictionaries[context.language]||{},t=(s,values=[])=>String(dictionary[s]||s).replace(/\{v(\d+)\}/g,(_,i)=>String(values[i]??'')),money=n=>'$'+Math.round(n).toLocaleString('en-US'),pct=n=>(n>=0?'+':'')+n.toFixed(2)+'%';
 const rows=analyzeCrypto(context.cryptoMarket,user,time),eligible=rows.filter(r=>r.eligible),query=normalize(question),named=rows.find(r=>new RegExp('\\b'+r.id+'\\b').test(query));
 const ranked=eligible.toSorted((a,b)=>b.score-a.score||a.id.localeCompare(b.id)),lowest=eligible.toSorted((a,b)=>a.rangePosition-b.rangePosition||a.id.localeCompare(b.id))[0];
 const selected=named?[named]:/bottom|low|diep|minim|bas\b|tief/.test(query)?[lowest,...ranked.filter(r=>r!==lowest)].filter(Boolean).slice(0,3):ranked.slice(0,3);
 const answer=[t('Live crypto watchlist, not a price prediction. The score favors a lower position in the recorded range, positive 30-minute momentum and lower volatility. A cheap coin or a recent fall does not make it likely to rise.')];
 if(!eligible.length)answer.push(t('No eligible purchase candidate now. Check available cash, the per-coin purchase limit, custody, health and quote history. At least seven consecutive five-minute quotes are required.'));
 for(const r of selected){
  answer.push(t('{v0}: buy {v1}; current sell {v2}; recorded 4-hour low/high {v3} / {v4}; position in range {v5}%; 30-minute move {v6}; volatility {v7}%.',[r.name,money(r.buy),money(r.sell),money(r.low),money(r.high),r.rangePosition.toFixed(1),pct(r.momentum),r.volatility.toFixed(2)]));
  answer.push(t('Your holding: {v0} coins, purchase basis {v1}. You can currently buy at most {v2} coins. The market must rise about {v3}% to cover both trading fees before bonuses.',[r.held.toLocaleString('en-US'),money(r.basis),(r.eligible?r.maximum:0).toLocaleString('en-US'),r.breakEvenRise.toFixed(2)]));
  if(r.momentum<0)answer.push(t('Still falling over the last 30 minutes: a low quote is not a confirmed bottom. Waiting is a valid choice.'));
  if(!r.sufficient||r.observations<49)answer.push(t('Less than a full four hours of usable history is available. Missing quotes are not estimated.'));
 }
 if(selected[0]?.eligible)answer.push(t('{v0} is the first coin to review under these criteria, not an instruction to buy. Future prices are randomized; no reversal or profit is guaranteed.',[selected[0].name]));
 answer.push(t('Quotes expire at {v0}. Recheck the exchange before trading.',[new Date(context.cryptoMarket.nextUpdate).toISOString()]));
 return {name:'Luca Moretti',mode:'local',answer:answer.join('\n\n'),links:[{tab:'crypto',label:t('Crypto exchange')}],suggestions:[],cryptoAnalysis:{asOf:time,expiresAt:context.cryptoMarket.nextUpdate,candidates:selected,eligibleCount:eligible.length}};
}
