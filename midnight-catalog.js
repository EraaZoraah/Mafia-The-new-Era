import {createHash} from 'node:crypto';
export const raceRoutes=[
 {id:'technical',name:'Old Quarter Circuit',description:'Tight corners reward handling and a precise street setup.',weights:[.6,.2,.2],image:'/images/race-route-technical.png',stages:['The Chicane','The Hairpin','The Boulevard']},
 {id:'highway',name:'Skyline Sprint',description:'Long straights reward acceleration and a stable speed setup.',weights:[.2,.6,.2],image:'/images/race-route-highway.png',stages:['The Launch','The Overpass','The Flying Mile']},
 {id:'escape',name:'Harbor Escape',description:'A mixed harbor route rewards reliability and careful driving.',weights:[.25,.25,.5],image:'/images/race-route-escape.png',stages:['The Docks','The Bridge','The Back Streets']}
];
export const raceStrategies=[{id:'clean',name:'Clean',boost:0,risk:.04,heat:1},{id:'balanced',name:'Balanced',boost:2,risk:.10,heat:3},{id:'aggressive',name:'Aggressive',boost:5,risk:.23,heat:7}];
export const raceSetups=[{id:'street',name:'Street grip',stats:[4,-1,1]},{id:'speed',name:'Speed tires',stats:[-1,4,0]},{id:'endurance',name:'Endurance',stats:[0,-1,5]}];
const rankNames=['Rookie Driver','Night Driver','Street Apprentice','Corner Cutter','Asphalt Runner','City Racer','Circuit Regular','Precision Driver','Midnight Contender','Street Champion','Circuit Captain','Night Elite','Asphalt Legend','Midnight Master','Circuit Legend'];
const thresholds=[0,50,140,280,500,800,1200,1750,2450,3300,4400,5800,7500,9600,12000];
export const driverRanks=rankNames.map((name,i)=>({name,xp:thresholds[i],level:i+1,handlingBonus:Math.round(i*3/14*10)/10}));
export const raceClasses=[{id:'street',name:'Street',fee:2500,base:58,maxTune:2},{id:'gt',name:'GT',fee:10000,base:72,maxTune:3},{id:'exotic',name:'Exotic',fee:25000,base:86,maxTune:3}];
export const driverProgress=xp=>{const rank=driverRanks.findLast(r=>xp>=r.xp)||driverRanks[0];return {...rank,next:driverRanks[rank.level]||null};};
export function carPerformance(car){
 const id=car.id+' '+car.name,classic=/classic|1965|2cv|beetle|240 estate|325i e30|190 e|xjs|944|eldorado|azure|testarossa|countach|e-type|959|f40|280 sl|507|300 sl|db5|miura|2900|250 gt|57sc/i.test(id);
 const category=!classic&&/mclaren|ferrari|bugatti|lamborghini|rimac|koenigsegg|pagani|corvette|carrera gt|maserati mc20/i.test(id)?raceClasses[2]:/porsche|bmw m|amg|audi rs|gtr|gt-r|nsx|supra|maserati|bentley|aston|lexus lc|ferrari|lamborghini|300 sl|507|miura|250 gt|57sc|testarossa|countach|959|f40/i.test(id)?raceClasses[1]:raceClasses[0];
 const bytes=createHash('sha256').update(car.id).digest(),stats=[0,1,2].map(i=>category.base+bytes[i]%13-6);if(classic){stats[0]+=3;stats[1]-=5;}
 return {class:category.id,className:category.name,handling:stats[0],acceleration:stats[1],reliability:stats[2],rating:Math.round(stats.reduce((a,b)=>a+b,0)/3*10),fee:category.fee,maxTune:category.maxTune};
}
export const raceWeek=time=>{const d=new Date(time);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-((d.getUTCDay()+6)%7));};

export function raceProjection(car,route,strategy,setup,handlingBonus=0,mechanic=false){
 const penalty=[0,18,10,4,0,-1][car.stars],stats=[car.handling+handlingBonus,car.acceleration,car.reliability-penalty-car.wear*.15].map((v,i)=>v+setup.stats[i]+car.tune);
 const performance=stats.reduce((n,v,j)=>n+v*route.weights[j],0)+strategy.boost+(mechanic?1:0),risk=Math.max(.01,strategy.risk+penalty*.003+car.wear*.001-(mechanic?.035:0)-handlingBonus*.004);
 return {performance,risk,expectedStageMs:105000-performance*400+risk*12000};
}
