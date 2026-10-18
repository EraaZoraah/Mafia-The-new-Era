// Fictional game markets. Each product has independent production and demand factors.
export const cityDrugMarkets={
 'New York':[[.82,1],[.95,1.06],[1.04,1.1],[1.12,1.2],[1.08,1.12]],
 'Miami':[[.9,1.06],[.86,1.02],[.96,1.12],[.82,1.08],[1.05,1.17]],
 'Los Angeles':[[.85,1.08],[1,1.13],[.9,1.16],[1.04,1.23],[.91,1.1]],
 'Chicago':[[.95,1.08],[.96,1.12],[1.02,1.1],[1.05,1.15],[.84,1.05]],
 'London':[[1.08,1.24],[1,1.22],[.98,1.18],[1.12,1.28],[1.05,1.2]],
 'Amsterdam':[[.72,.94],[.76,.97],[.74,1.02],[.96,1.13],[.91,1.09]],
 'Paris':[[1.02,1.18],[.94,1.16],[1.01,1.2],[1.08,1.24],[1.02,1.18]],
 'Rome':[[.98,1.12],[.88,1.13],[1,1.17],[1.04,1.2],[1.03,1.16]],
 'Istanbul':[[.87,1.07],[.73,1],[.89,1.08],[.97,1.15],[.92,1.1]],
 'Dubai':[[1.22,1.65],[1.25,1.58],[1.2,1.72],[1.28,1.8],[1.24,1.68]],
 'Singapore':[[1.18,1.43],[1.15,1.39],[1.18,1.45],[1.2,1.5],[1.16,1.44]],
 'Hong Kong':[[1.08,1.28],[1.06,1.25],[.96,1.27],[1.15,1.37],[.86,1.24]],
 'Tokyo':[[1.16,1.4],[1.2,1.38],[1.08,1.42],[1.18,1.48],[.98,1.35]],
 'Sydney':[[1.05,1.28],[1.12,1.3],[1.04,1.32],[1.17,1.45],[1,1.31]],
 'São Paulo':[[.78,1.01],[.91,1.05],[.96,1.09],[.7,.98],[.94,1.1]]
};
export const transportModes=[
 {id:'boat',name:'Cargo boat',hours:8,risk:.16,costBps:450},
 {id:'plane',name:'Cargo plane',hours:2,risk:.26,costBps:850},
 {id:'truck',name:'Freight truck',hours:4,risk:.1,costBps:300}
];
const regions=[['New York','Miami','Los Angeles','Chicago'],['London','Amsterdam','Paris','Rome','Istanbul'],['Dubai'],['Singapore','Hong Kong','Tokyo'],['Sydney'],['São Paulo']];
export const truckRoute=(from,to)=>from!==to&&regions.some(r=>r.includes(from)&&r.includes(to));
export function cityFactors(city,productIndex){const [production,sale]=(cityDrugMarkets[city]||cityDrugMarkets['New York'])[productIndex];return {production,sale};}
export function freightQuote(from,to,mode,cost,units){
 if(from===to||!cityDrugMarkets[from]||!cityDrugMarkets[to]||mode.id==='truck'&&!truckRoute(from,to))return null;
 const distance=truckRoute(from,to)?1:2,inspection=to==='Dubai'?.05:to==='Singapore'||to==='Tokyo'?.03:0;
 return {mode:mode.id,name:mode.name,cost:Math.ceil(cost*mode.costBps/10000)+units*2500*distance,hours:mode.hours*distance,risk:Math.min(.6,mode.risk+inspection+(units>=500?.04:0))};
}
