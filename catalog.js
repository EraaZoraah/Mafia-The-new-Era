import {collectorCars} from './collector-cars.js';
import {storageAssets} from './vehicle-catalog.js';
// Prices and earnings are fictional game values, not real-world quotations.
export {ranks} from './progression.js';
export const crimes = [
  ['crime','Street crime',10,30,.77,500,25,0],
  ['car','Car theft',10,60,.55,1400,60,0],
  ['smuggle','Smuggling operation',10,90,.45,2500,100,0],
  ['shop','Shop robbery',12,45,.75,1100,40,0],
  ['mugging','Back-alley mugging',10,40,.80,700,30,0],
  ['courier','Discreet courier',8,35,.95,400,20,0],
  ['vip','VIP protection contract',15,90,.90,2500,80,100],
  ['chop','Chop shop delivery',18,120,.70,4200,120,250],
  ['jewelry','Jewelry store heist',25,180,.60,8500,200,500],
  ['cargo','Harbor cargo job',25,180,.65,10000,220,1000],
  ['hostage','Hostage contract',30,240,.50,16000,300,2000],
  ['hit','Liquidation contract',35,300,.45,24000,400,4000],
  ['vault','Casino vault heist',40,360,.40,38000,500,8000],
].map(([id,name,energy,seconds,chance,reward,xp,requiredXp])=>({id,name,energy,cooldown:seconds*1000,chance,reward,xp,requiredXp}));

export const businesses = [
  ['coffee','Neighborhood coffeeshop',12000,120],['laundry','Laundromat',35000,360],
  ['bar','Cocktail bar',80000,840],['garage','Auto workshop',150000,1620],
  ['restaurant','Fine dining restaurant',300000,3300],['club','Nightclub',650000,7200],
  ['logistics','Logistics company',1400000,15600],['hotel','Boutique hotel',3000000,33600],
  ['resort','Five-star resort',8000000,90000],['casino','Grand casino',20000000,228000],
  ['palace','Palace casino resort',75000000,864000],
].map(([id,name,price,income])=>({id,name,price,income,category:'business'}));

export const cars = [
  ['fiat500','Fiat 500',18000,'City'],['yaris','Toyota Yaris',24000,'City'],
  ['golf','Volkswagen Golf',32000,'Everyday'],['civic','Honda Civic',38000,'Everyday'],
  ['model3','Tesla Model 3',48000,'Electric'],['bmw330','BMW 330i',60000,'Executive'],
  ['audiS5','Audi S5',85000,'Performance'],['amg','Mercedes-AMG C 63',110000,'Performance'],
  ['m5','BMW M5',150000,'Performance'],['g63','Mercedes-AMG G 63',230000,'Luxury SUV'],
  ['911','Porsche 911 Turbo S',300000,'Supercar'],['continental','Bentley Continental GT',340000,'Grand touring'],
  ['ghost','Rolls-Royce Ghost',450000,'Ultra luxury'],['cullinan','Rolls-Royce Cullinan',550000,'Ultra luxury'],
  ['750s','McLaren 750S',650000,'Supercar'],['db12','Aston Martin DB12',750000,'Grand touring'],
  ['temerario','Lamborghini Temerario',900000,'2026 collection'],['revuelto','Lamborghini Revuelto',1200000,'2026 collection'],
  ['12cilindri','Ferrari 12Cilindri',1600000,'Supercar'],['nevera','Rimac Nevera',2800000,'Electric hypercar'],
  ['jesko','Koenigsegg Jesko',4000000,'Hypercar'],['utopia','Pagani Utopia',5500000,'Hypercar'],
  ['f80','Ferrari F80',7500000,'2026 collection'],['tourbillon','Bugatti Tourbillon',10000000,'2026 collection'],
].map(([id,name,price,tier])=>({id,name,price,tier,category:'car'}));

export const homes = [
  ['studio','Downtown studio',40000,'Your first private address.'],
  ['apartment','City apartment',125000,'A modern apartment above the city streets.'],
  ['loft','Warehouse loft',350000,'Open-plan luxury in the arts district.'],
  ['townhouse','Historic townhouse',800000,'Four floors and a private courtyard.'],
  ['familyhome','Suburban family home',1500000,'Space, privacy and a landscaped garden.'],
  ['penthouse','Skyline penthouse',4000000,'Private lift and panoramic rooftop terrace.'],
  ['beach','Oceanfront villa',10000000,'Infinity pool and a private stretch of beach.'],
  ['estate','Lakefront estate',25000000,'A boathouse, guest residences and parkland.'],
  ['chateau','Royal chateau',60000000,'A restored palace surrounded by vineyards.'],
  ['island','Private island residence',150000000,'A secluded island, marina and airstrip.'],
  ['sky','Billionaire sky palace',350000000,'Five penthouse floors, a sky garden and indoor waterfall.'],
  ['elysium','Elysium Sovereign Villa',1000000000,'An entire private archipelago: marble palace, underwater suites, observatory, superyacht harbor and a hypercar gallery.'],
].map(([id,name,price,description])=>({id,name,price,description,category:'home'}));
export const helicopters = [
  ['sparrow','Sparrow Executive',1800000,'A discreet four-seat helicopter for city transfers.'],
  ['meridian','Meridian Twin',4200000,'A twin-engine executive helicopter with a leather cabin.'],
  ['sovereign','Sovereign VIP',8500000,'A spacious luxury helicopter for your private security detail.'],
  ['monarch','Monarch Grand',15000000,'Long-range helicopter with a whisper-quiet private cabin.'],
  ['obsidian','Obsidian One',28000000,'A bespoke black-and-gold flying flagship.'],
].map(([id,name,price,description])=>({id,name,price,description,category:'helicopter'}));
export const jets = [
  ['swift','Swift Citation',6500000,'A light private jet for discreet regional visits.'],
  ['altitude','Altitude Executive',18000000,'A midsize jet with a private work lounge.'],
  ['horizon','Horizon Intercontinental',42000000,'A long-range jet connecting your international interests.'],
  ['regent','Regent Global',85000000,'An ultra-long-range flagship with private bedroom and dining suite.'],
  ['imperium','Imperium Air Palace',200000000,'A bespoke wide-body flying palace with a grand salon and guest suites.'],
].map(([id,name,price,description])=>({id,name,price,description,category:'jet'}));
export const garages=[{id:'collector',name:'Private collector garage',price:500000,category:'garage',description:'A secure vehicle storage and detailing operation.',perks:{cooldownBps:100}}];
export const yachts=[
 ['harbor','Harbor motor cruiser',150000,'An approachable private motor cruiser.'],
 ['riviera','Riviera yacht',2000000,'A refined yacht for coastal escapes.'],
 ['sovereign','Sovereign superyacht',18000000,'A contemporary 45-metre flagship.'],
 ['imperial','Imperial megayacht',75000000,'An 85-metre floating estate with private terraces.'],
 ['elysium','Elysium ocean palace',350000000,'A fictional 150-metre ocean palace with cascading decks and pools.'],
].map(([id,name,price,description],index)=>({id,name,price,description,category:'yacht',perks:{rewardBps:100+index*75}}));
export const catalog = [...businesses,...cars,...homes,...helicopters,...jets,...garages,...yachts];
crimes.push(
  {id:'maritime',name:'Private maritime commission',energy:25,cooldown:180000,chance:.75,reward:15000,xp:240,requiredXp:1500,requires:'yacht'},
  {id:'getaway',name:'Midnight getaway',energy:18,cooldown:120000,chance:.8,reward:4500,xp:130,requiredXp:250,requires:'car'},
  {id:'syndicate',name:'Private syndicate deal',energy:20,cooldown:150000,chance:.8,reward:6500,xp:170,requiredXp:500,requires:'business'},
  {id:'airlift',name:'Skyline extraction',energy:25,cooldown:180000,chance:.75,reward:12000,xp:260,requiredXp:1000,requires:'helicopter'},
  {id:'overseas',name:'Overseas commission',energy:30,cooldown:240000,chance:.7,reward:22000,xp:360,requiredXp:2500,requires:'jet'},
  {id:'summit',name:'Private estate summit',energy:20,cooldown:150000,chance:.85,reward:5500,xp:150,requiredXp:500,requires:'home'},
);
// Economy expansion: x10 purchase prices, income and NPC rewards. Existing wallets are unchanged.
for(const item of catalog){item.price*=10;if(item.income)item.income*=10;item.image=`/images/${item.category}-${item.id}.jpg`.toLowerCase();}
for(const crime of crimes){crime.reward*=10;crime.image=`/images/crime-${crime.id}.jpg`;}
export const ASSET_LIMIT=10;
export const ENERGY_LIMIT=1000;
export const assetLimit=item=>['vehicle-warehouse','production-warehouse'].includes(item.id||item.item_id)?5:item.category==='business'?10:1;
const carEnergy=[0,0,0,0,0,0,0,0,0,0,5,5,8,10,12,15,18,22,26,30,35,40,45,50];
for(const [index,item] of cars.entries())item.perks={rewardBps:20+index*2,energyCapacity:carEnergy[index]};
const homeEnergy=[0,0,0,5,10,20,30,45,60,80,100,150];
for(const [index,item] of homes.entries())item.perks={energyCapacity:homeEnergy[index],energySpeed:index<3?0:(index-2)*200,healthSpeed:index<3?0:(index-2)*400};
// Explicit escalating difficulty: higher payouts have no better baseline odds.
crimes.push({id:'assault',name:'Enforcer assault',energy:15,cooldown:75000,chance:.83,reward:18000,xp:70,requiredXp:100,image:'/images/crime-assault.png'});
const crimeOrder=['courier','crime','mugging','shop','car','assault','vip','smuggle','chop','getaway','summit','syndicate','jewelry','cargo','airlift','maritime','hostage','overseas','hit','vault'];
const chances=[.95,.90,.88,.86,.84,.83,.82,.80,.78,.76,.74,.72,.70,.68,.66,.64,.62,.60,.50,.40];
const energies=[8,10,10,12,14,15,15,16,18,18,20,20,25,25,25,28,30,32,35,40];
const seconds=[30,35,40,45,60,75,90,100,120,120,150,150,180,180,200,220,240,260,300,360];
crimes.find(c=>c.id==='vip').reward=20000;
crimes.sort((a,b)=>crimeOrder.indexOf(a.id)-crimeOrder.indexOf(b.id));
for(const [i,c] of crimes.entries()){c.severity=i+1;c.chance=chances[i];c.energy=energies[i];c.cooldown=seconds[i]*1000;c.risk=i<5?'Low':i<11?'Moderate':i<17?'High':'Extreme';}
crimes.find(c=>c.id==='smuggle').requiredXp=100;
for(const [index,item] of helicopters.entries())item.perks={cooldownBps:200+index*50};
for(const [index,item] of jets.entries())item.perks={rewardBps:150+index*50};
for(const item of businesses)item.perks={};
for(const item of catalog){
  item.title=({business:'Proprietor',car:'Collector',home:'Resident',helicopter:'Sky Patron',jet:'Jetsetter',garage:'Garage Mogul',yacht:'Ocean Sovereign'}[item.category])+` · ${item.name}`;
  item.unlock=({business:'Private syndicate deal',car:'Midnight getaway',home:'Private estate summit',helicopter:'Skyline extraction',jet:'Overseas commission',garage:'Midnight getaway',yacht:'Private maritime commission'}[item.category]);
}
// Rental and charter operations make additional copies productive even at perk caps.
for(const item of catalog)if(!item.income)item.income=Math.max(1,Math.floor(item.price/({car:1000,home:1500,helicopter:600,jet:900,garage:600,yacht:1000}[item.category])));
// Slower economy: 10% of former crime payouts and passive hourly income.
for(const crime of crimes)crime.reward=Math.floor(crime.reward/10);
for(const item of catalog){item.income=Math.max(1,Math.floor(item.income/10));item.limit=assetLimit(item);}
export function purchasePrice(item,quantity){return Math.min(1000000000000,Math.ceil(item.price*Math.pow(1.10,quantity)));}
export function ownershipBenefits(possessions){
  const items=catalog.filter(item=>possessions.some(a=>a.category===item.category&&a.item_id===item.id));
  const quantity=item=>Math.min(assetLimit(item),possessions.find(a=>a.category===item.category&&a.item_id===item.id)?.quantity||1);
  const sum=key=>items.reduce((total,item)=>total+(item.perks[key]||0)*quantity(item),0);
  return {privateGarage:items.some(x=>x.category==='garage'&&!x.storageKind),energyMax:Math.min(ENERGY_LIMIT,100+sum('energyCapacity')),energyInterval:Math.max(5000,30000-sum('energySpeed')),healthInterval:Math.max(10000,60000-sum('healthSpeed')),rewardBps:Math.min(20000,sum('rewardBps')),cooldownBps:Math.min(6000,sum('cooldownBps')),income:items.reduce((n,x)=>n+(x.income||0)*quantity(x),0),categories:[...new Set(items.map(x=>x.category))],titles:items.map(x=>({id:x.category+':'+x.id,name:x.title})),value:items.reduce((n,x)=>n+x.price*quantity(x),0)};
}
export const pvpActions = [
  {id:'attack',name:'Attack player',energy:20,chance:.70,damage:25,share:0,cap:0,cooldown:120000},
  {id:'rob',name:'Rob player',energy:25,chance:.55,damage:10,share:1,cap:1000000000000000,cooldown:300000,successCooldown:1800000},
  {id:'liquidate',name:'Liquidation attempt',energy:40,chance:.35,damage:100,share:0,cap:0,cooldown:1800000,successCooldown:86400000},
  {id:'hostage',name:'Hostage operation',energy:35,chance:.40,damage:15,share:0,cap:10000000,cooldown:300000},
];



catalog.find(item=>item.category==='helicopter'&&item.id==='obsidian').image='/images/helicopter-obsidian-v2.jpg';

// October progression tuning: uniform crime XP and active cash scaling.
for(const c of crimes){c.xp*=4;c.reward=Math.floor(c.reward*4);}

// Larger commercial holdings require progressively more capital; starter prices stay accessible.
const businessCapitalFactors=[1,1,1.1,1.2,1.3,1.5,1.7,2,2.2,2.5,3];
for(const [i,item] of businesses.entries())item.price=Math.round(item.price*businessCapitalFactors[i]);

// Private luxuries grant utility and status, rather than automatic rental income.
for(const item of catalog){item.limit=assetLimit(item);if(item.category!=='business')item.income=0;}

// Starter residences provide a modest convenience perk without energy or rent.
for(const [i,item] of homes.slice(0,3).entries())item.perks.cooldownBps=(i+1)*10;

// Reserve the largest private luxuries for a mature empire; starter purchases stay accessible.
for(const item of catalog)if(item.category!=='business'&&item.price>=100000000)item.price=Math.round(item.price*2.8);

// Reviewed illustrations: distinct activity imagery and accurate starter properties.
for(const [category,id,image] of [['business','laundry','business-laundry-v2.png'],['home','studio','home-studio-v2.png']])catalog.find(a=>a.category===category&&a.id===id).image='/images/'+image;
for(const [id,image] of [['airlift','crime-airlift-v2.png'],['shop','crime-shop-v2.png']])crimes.find(c=>c.id===id).image='/images/'+image;

// Warehouses use the existing garage possession ledger but have dedicated storage roles.
catalog.push(...storageAssets);
for(const [id,name,price] of [['rs7','Audi RS7 Sportback',1800000],['rsq8','Audi RS Q8 · Obsidian Black',2400000]]){
 const item={id,name,category:'car',price,income:0,limit:1,tier:'Performance',image:'/images/vehicle-'+id+'.png',perks:{rewardBps:45,energyCapacity:0},title:'Performance Collector · '+name,unlock:'Midnight getaway',description:'Six-bay private garage required. Resale returns 80% of the paid purchase price.'};cars.push(item);catalog.push(item);
}

for(const [id,name,price] of [['executive','Executive Gallery Garage',7500000],['skyline','Skyline Motor Gallery',15000000],['vault','Obsidian Motor Vault',40000000],['sovereign','Sovereign Automobile Pavilion',100000000]]){
 const item={id,name,category:'garage',price,income:0,limit:1,parkingCapacity:6,perks:{},title:'Motor Curator · '+name,unlock:'Six purchased-car bays',description:'Six secured bays for purchased cars. Stolen vehicles use separate vehicle warehouses.',image:'/images/garage-'+id+'.png'};garages.push(item);catalog.push(item);
}

for(const car of collectorCars)car.perks.energyCapacity=Math.max(0,...cars.filter(c=>c.price<=car.price).map(c=>c.perks.energyCapacity||0));
cars.push(...collectorCars);catalog.push(...collectorCars);

// Ten individually owned six-bay garages: exactly sixty purchased-car places.
for(const [id,name,price] of [
 ['atelier','Imperial Motor Atelier',250000000],['black-label','Black Label Car Sanctuary',500000000],
 ['onyx-gallery','Onyx Hypercar Gallery',1000000000],['crown-vault','Crown Automobile Vault',2000000000],
 ['diamond-pavilion','Diamond Sovereign Motor Pavilion',4000000000]
]){const item={id,name,category:'garage',price,income:0,limit:1,parkingCapacity:6,perks:{},title:'Motor Curator · '+name,unlock:'Six purchased-car bays',description:'A luxury six-bay garage for purchased cars. Ten unique garages provide sixty collection places.',image:'/images/garage-'+id+'.png'};garages.push(item);catalog.push(item);}
for(const [i,[id,name,price]] of [
 ['amg-one','Mercedes-AMG ONE',350000000],['t50','Gordon Murray T.50',1000000000],
 ['solus-gt','McLaren Solus GT',1500000000],['valkyrie','Aston Martin Valkyrie',2000000000],
 ['cc850','Koenigsegg CC850',3000000000],['aspark-owl','Aspark Owl',4000000000],
 ['venom-f5','Hennessey Venom F5 Revolution Roadster',5000000000],['czinger-21c','Czinger 21C',7500000000],
 ['boat-tail','Bugatti La Voiture Noire',12500000000]
].entries()){
 const exclusive=i>0,item={id,name,price,category:'car',tier:exclusive?'Exclusive collection':'Hypercar',exclusive,income:0,limit:1,image:id==='boat-tail'?'/images/car-la-voiture-noire.png':'/images/car-'+id+'.png',perks:exclusive?{energyCapacity:30+i*5,cooldownBps:20+i*10}:{energyCapacity:20},title:(exclusive?'Exclusive Collector':'Collector')+' · '+name,unlock:'Midnight getaway',description:exclusive?'Exclusive modern collection car. Adds energy capacity and shorter crime cooldowns, alongside its price-scaled crime-income perk. Requires one free garage bay.':'Modern hypercar with price-scaled crime income. Requires one free garage bay.'};cars.push(item);catalog.push(item);
}
// Basis points are additive and bounded by the existing ownership bonus cap.
for(const car of cars)car.perks.rewardBps=Math.round(40+45*Math.log10(1+car.price/1000000));

// Fictional collection prices: performance, luxury and rarity have distinct scales.
const vehiclePrices={fiat500:180000,yaris:320000,golf:600000,civic:800000,model3:1200000,bmw330:2000000,audiS5:4000000,amg:6000000,m5:10000000,g63:18000000,'911':35000000,continental:40000000,ghost:55000000,cullinan:75000000,'750s':85000000,db12:95000000,temerario:110000000,revuelto:140000000,'12cilindri':175000000,nevera:220000000,jesko:260000000,utopia:300000000,f80:350000000,tourbillon:450000000,rs7:12000000,rsq8:18000000,'audi-a7':8500000,'bmw-m440':10000000,'mercedes-cle':12500000,'lexus-ls':15000000,'genesis-g90':17000000,'porsche-panamera':24000000,'maserati-granturismo':30000000,'bentley-flying-spur':45000000,'rolls-dawn':70000000,'mercedes-pagoda':9000000,'bmw-507':22000000,'mercedes-300sl-roadster':35000000,'aston-db5':45000000,'lamborghini-miura':75000000,'alfa-8c-classic':110000000,'ferrari-250-california':180000000,'bugatti-57sc':250000000,'ferrari-250-gto':450000000,escalade:16000000,'maybach-s680':38000000,'phantom-extended':65000000,'phantom-limousine':100000000,'jaguar-xk120':18000000,urus:24000000,chiron:240000000,'amg-one':550000000};
for(const car of cars){if(vehiclePrices[car.id])car.price=vehiclePrices[car.id];car.perks.rewardBps=Math.round(40+45*Math.log10(1+car.price/1000000));}
for(const [i,item] of helicopters.entries()){item.price=[35000000,120000000,380000000,850000000,2500000000][i];item.perks={cooldownBps:180+i*100,rewardBps:Math.round(40+40*Math.log10(1+item.price/1000000))};}
for(const [i,item] of jets.entries()){item.price=[120000000,450000000,1200000000,3200000000,10000000000][i];item.perks={rewardBps:Math.round(90+70*Math.log10(1+item.price/1000000)),energyCapacity:20+i*10};}
for(const [i,item] of yachts.entries()){item.price=[12000000,180000000,1200000000,4000000000,15000000000][i];item.perks={rewardBps:Math.round(80+80*Math.log10(1+item.price/1000000)),cooldownBps:100+i*40,energyCapacity:i*20};}

// Energy convenience never falls when moving up the reviewed collection price ladder.
let previousCarEnergy=0;for(const car of [...cars].sort((a,b)=>a.price-b.price)){car.perks.energyCapacity=Math.max(previousCarEnergy,car.perks.energyCapacity||0);previousCarEnergy=car.perks.energyCapacity;}
