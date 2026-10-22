// Same authoritative quote comparison is used by the server, UI and Luca.
export function batchSaleChoices(batch,funds=Infinity){
 const local={city:batch.stock_city,mode:'local',name:'Local sale',hours:0,cost:0,risk:0,saleValue:batch.saleValue,netProfit:batch.netProfit,netMargin:batch.netMargin,expectedProfit:batch.netProfit};
 const routes=[local,...batch.destinations.flatMap(c=>c.routes.map(r=>({...r,city:c.city})))].map(r=>({...r,affordable:r.cost<=funds}));
 const eligible=routes.filter(r=>r.affordable),tie=(a,b)=>a.hours-b.hours||a.risk-b.risk||a.city.localeCompare(b.city)||a.mode.localeCompare(b.mode);
 const best=[...eligible].sort((a,b)=>b.expectedProfit-a.expectedProfit||tie(a,b))[0]||null;
 const highest=[...eligible].sort((a,b)=>b.netProfit-a.netProfit||tie(a,b))[0]||null;
 return {best,highest,routes};
}
