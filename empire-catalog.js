// Fictional game content: these are abstract operations, not real-world instructions.
// Four dedicated runs per career per day target roughly three months to The Connect.
const thresholds=[0];for(let i=0;i<14;i++)thresholds.push(thresholds.at(-1)+Math.round(3000*1.18**i/100)*100);
const names={
  drugs:['Corner Boy','Street Runner','Block Dealer','Crew Supplier','District Dealer','Local Distributor','City Supplier','Regional Broker','Route Manager','Wholesale Operator','Import Partner','Syndicate Supplier','Cartel Envoy','International Broker','The Connect'],
  guns:['Corner Runner','Package Courier','Street Supplier','Crew Quartermaster','District Supplier','Local Broker','City Quartermaster','Regional Shipper','Route Coordinator','Wholesale Broker','Import Specialist','Arsenal Director','Syndicate Shipper','International Supplier','The Connect'],
};
export const careerRanks=Object.fromEntries(Object.entries(names).map(([kind,titles])=>[kind,titles.map((name,index)=>({name,level:index+1,xp:thresholds[index],multiplier:1.15**index,chanceBonus:index*.012}))]));
export function career(kind,xp=0){
  const ranks=careerRanks[kind],rank=ranks.findLast(r=>xp>=r.xp)||ranks[0],next=ranks[rank.level];
  return {...rank,currentXp:xp,nextXp:next?.xp??null,nextName:next?.name??null};
}
export const familyAssets=[
  ['safehouse-starter','Backstreet safehouse','Safehouses',250000,3,3,0,0,'A discreet first address.'],
  ['safehouse-modern','Modern city safehouse','Safehouses',2500000,3,6,1,0,'A contemporary 2026 townhouse for your crew.'],
  ['safehouse-penthouse','Skyline sanctuary','Safehouses',25000000,3,10,2,0,'A private skyline refuge with secure access.'],
  ['compound-yard','Founders’ courtyard','Compounds',1500000,1,8,1,0,'Your first shared headquarters, built from an old industrial yard.'],
  ['compound-estate','Sovereign estate','Compounds',35000000,1,15,3,0,'A modern estate with guest wings and a private motor court.'],
  ['compound-palace','Imperium coastal compound','Compounds',5000000000,1,25,5,0,'An ultra deluxe 2026 family palace, marina and private residences.'],
  ['suv-utility','Crew utility SUV','Family fleet',400000,5,2,1,0,'Reliable transport for the family.'],
  ['suv-executive','Executive family SUV','Family fleet',4000000,5,4,2,0,'A contemporary executive vehicle for your shared fleet.'],
  ['suv-armored','Armored sovereign SUV','Family fleet',30000000,5,7,3,0,'A flagship armored SUV with a bespoke luxury interior.'],
  ['upgrade-guards','Security detail','Security upgrades',750000,5,5,0,0,'Permanent family guards. Each purchase adds a detail.'],
  ['upgrade-surveillance','Surveillance suite','Security upgrades',1500000,5,5,0,0,'Expand your monitoring team and estate coverage.'],
  ['upgrade-vault','Treasury vault','Security upgrades',3000000,5,2,0,8,'Protects a larger share of funds from successful raids.'],
  ['upgrade-perimeter','Reinforced perimeter','Security upgrades',5000000,5,7,0,0,'Additional secure gates and estate perimeter improvements.'],
].map(([id,name,category,price,limit,defense,runBonus,lossReduction,description])=>({id,name,category,price,limit:Math.min(4,limit),defense,runBonus,lossReduction,description,image:'/images/family-'+id+'.jpg'}));
familyAssets.push(...[
 {id:'territory-block',name:'Street block',price:25000000,defense:2,runBonus:1,blocks:1,image:'/images/territory-block.jpg'},
 {id:'territory-industry',name:'Industrial district',price:150000000,defense:5,runBonus:2,blocks:4,image:'/images/territory-industry.png'},
 {id:'territory-finance',name:'Financial district',price:150000000,defense:5,runBonus:2,blocks:4,image:'/images/territory-finance.png'},
 {id:'territory-harbor',name:'Harbor territory',price:1000000000,defense:10,runBonus:4,blocks:12,image:'/images/territory-harbor.jpg'},
].map(x=>({...x,category:'Territory',limit:525,lossReduction:0,description:'Control '+x.blocks+(x.blocks===1?' city block.':' city blocks.')+' Adds family Power, defense and shipment success. Can be captured during a declared war.'})));
export const musclePackages=[
  {id:'street',name:'Street escort',price:5000,minutes:15,uses:3,bonus:.05},
  {id:'professional',name:'Professional muscle',price:25000,minutes:30,uses:5,bonus:.10},
  {id:'elite',name:'Elite convoy detail',price:100000,minutes:60,uses:8,bonus:.15},
];
export const shipmentTiers=[
  {id:'local',name:'Local consignment',level:1,energy:20,cost:2500,min:6500,max:9500,chance:.72,xp:200,cooldown:180000},
  {id:'regional',name:'Regional shipment',level:5,energy:30,cost:20000,min:50000,max:75000,chance:.66,xp:550,cooldown:420000},
  {id:'international',name:'International shipment',level:10,energy:40,cost:150000,min:400000,max:600000,chance:.60,xp:1250,cooldown:900000},
];
export const mysteryJobs=[
  {id:'attack',name:'A favor in the shadows',description:'A mysterious contact offers a place on an NPC crew confronting a rival enforcer. The crew handles the preparations.'},
  {id:'hostage',name:'The missing courier',description:'Join an NPC team in a fictional hostage-rescue operation. Your contact promises a generous fee for your part.'},
  {id:'liquidation',name:'The final contract',description:'An anonymous caller offers an abstract underworld contract against an NPC rival. Accept the assignment or walk away.'},
  {id:'bank',name:'The midnight bank job',description:'An NPC team has a place for you in a cinematic bank heist. The crew is ready; your participation is entirely optional.'},
];
export {MAX_CASH} from './money.js';
export const personalProtectionMax=10;
export const protectionPrice=level=>100000*Math.pow(2,level);
export const familyPrice=(item,quantity)=>{const scale=100n**BigInt(quantity),numerator=BigInt(item.price)*(item.category==='Territory'?110n:135n)**BigInt(quantity);return Number((numerator+scale-1n)/scale)};

familyAssets.push(
 {id:'safehouse-sanctuary',name:'Obsidian Sanctuary',category:'Safehouses',price:250000000,limit:1,defense:12,runBonus:3,lossReduction:2,description:'A discreet fortified private residence for family operations.',image:'/images/family-safehouse-sanctuary.png'},
 {id:'compound-castle',name:'Aurelius Royal Dominion',category:'Compounds',price:50000000000,limit:1,defense:35,runBonus:7,lossReduction:5,description:'A vast contemporary castle estate with landscaped grounds, guest residences and a private command center.',image:'/images/family-compound-castle.png'},
 {id:'car-sedan',name:'Executive Command Sedan',category:'Family cars',price:250000000,limit:10,defense:8,runBonus:3,lossReduction:0,description:'A discreet executive transport and coordination vehicle.',image:'/images/family-car-sedan.png'},
 {id:'car-limousine',name:'Sovereign Armored Limousine',category:'Family cars',price:500000000,limit:10,defense:10,runBonus:4,lossReduction:1,description:'A ceremonial flagship with serious crew protection.',image:'/images/family-car-limousine.png'}
);
for(const a of familyAssets){
 if(a.category==='Family fleet')a.category='Family cars';
 if(a.category==='Family cars')a.limit=10;
 if(a.category==='Safehouses'||a.category==='Compounds')a.limit=1;
 if(a.category==='Territory'){a.price*=8;a.income=Math.round(a.price/1000);a.description+=' Earns shared territory income for the family treasury.';}else a.income=0;
}

familyAssets.push({id:'warehouse-production-family',name:'Family Production Warehouse',category:'Safehouses',price:15000000,income:0,limit:5,defense:0,runBonus:0,lossReduction:0,description:'One thousand crates of shared family production storage. Five warehouses maximum.',image:'/images/warehouse-production.png'});

for(const [i,item] of familyAssets.filter(a=>a.category==='Family cars').entries()){item.price=[125000000,250000000,450000000,750000000,1200000000,1800000000][i]||2000000000;item.runBonus=Math.min(8,2+i);}

for(const a of familyAssets.filter(a=>a.category==='Territory'))a.description+=' '+({'territory-block':'Local drug sale margin +0.75% per plot, capped at 9% in this city.','territory-industry':'Drug production time -2.5% per plot, capped at 25% in this city.','territory-finance':'Crypto spreads and auction commission -2.5% per plot, capped at 25% in this city. Investments have no fee.','territory-harbor':'Boat cargo time -3% per plot at this endpoint, capped at 15%; both endpoints combine to 30%.'}[a.id]);
