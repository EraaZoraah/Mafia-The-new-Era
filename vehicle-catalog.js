import {extraStolenCars} from './collector-cars.js';
import {createHash} from 'node:crypto';
import {cityDrugMarkets} from './drug-markets.js';
export const storageAssets=[
 {id:'vehicle-warehouse',name:'Grand Vehicle Warehouse',price:7500000,storageKind:'vehicle',capacity:20,description:'Twenty secured collection bays. Own up to five warehouses for one hundred stolen vehicles.',image:'/images/warehouse-vehicle.png'},
 {id:'production-warehouse',name:'Obsidian Production Warehouse',price:15000000,storageKind:'production',capacity:1000,description:'One thousand crates of production capacity shared across all unsold products. Own up to five warehouses.',image:'/images/warehouse-production.png'}
].map(x=>({...x,category:'garage',limit:5,income:0,perks:{},title:'Logistics Patron · '+x.name,unlock:'Secured logistics storage'}));
const rows=[
 ['dacia-sandero','Dacia Sandero',12000,150],['nissan-micra','Nissan Micra',14000,145],['opel-corsa','Opel Corsa',16000,140],
 ['ford-fiesta','Ford Fiesta',18000,135],['renault-clio','Renault Clio',20000,130],['skoda-fabia','Skoda Fabia',22000,125],
 ['kia-rio','Kia Rio',24000,115],['hyundai-i20','Hyundai i20',26000,110],['seat-ibiza','SEAT Ibiza',28000,105],
 ['suzuki-swift','Suzuki Swift',30000,100],['mazda2','Mazda 2',32000,90],['peugeot-208','Peugeot 208',35000,85],
 ['ford-focus','Ford Focus',45000,70],['skoda-octavia','Skoda Octavia',60000,60],['peugeot-508','Peugeot 508',80000,50],
 ['volvo-v60','Volvo V60',120000,40],['lexus-is','Lexus IS',180000,32],['audi-a6','Audi A6',250000,25],
 ['bmw-540i','BMW 540i',350000,20],['mercedes-eclass','Mercedes-Benz E-Class',500000,15],['nissan-gtr','Nissan GT-R',800000,10],
 ['lexus-lc','Lexus LC 500',1200000,8],['bmw-m8','BMW M8',1800000,6],['corvette-z06','Chevrolet Corvette Z06',2500000,5],
 ['maserati-mc20','Maserati MC20',4000000,4],['huracan-evo','Lamborghini Huracán EVO',6500000,3],['ferrari-296','Ferrari 296 GTB',9000000,2],
 ['carrera-gt','Porsche Carrera GT',14000000,1],['mclaren-p1','McLaren P1',22000000,1],['chiron','Bugatti Chiron',35000000,1]
];
export const stolenVehicles=rows.map(([id,name,value,weight])=>({id,name,value,weight,image:'/images/vehicle-'+id+'.png'})).concat(extraStolenCars);
export function chooseVehicle(draw){let n=draw(1,stolenVehicles.reduce((n,x)=>n+x.weight,0));for(const x of stolenVehicles){n-=x.weight;if(n<=0)return x;}return stolenVehicles.at(-1);}

export const vehicleConditions=[{stars:1,name:'Worn',weight:55,factor:.35},{stars:2,name:'Used',weight:25,factor:.55},{stars:3,name:'Good',weight:13,factor:.75},{stars:4,name:'Perfect',weight:6,factor:1},{stars:5,name:'Pristine',weight:1,factor:1.35}];
export function vehicleCondition(stars=4){return vehicleConditions.find(c=>c.stars===stars)||vehicleConditions[3];}
export function chooseVehicleCondition(draw){let n=draw(1,100);return vehicleConditions.find(c=>(n-=c.weight)<=0);}
export function vehicleSaleValue(spec,city,time,multiplier=1,stars=4){const hour=Math.floor(time/3600000),hash=createHash('sha256').update(spec.id+'|'+city+'|'+hour).digest().readUInt32BE(0),factor=1+Math.max(0,Object.keys(cityDrugMarkets).indexOf(city))*.025;return Math.floor(spec.value*multiplier*vehicleCondition(stars).factor*factor*(90+hash%21)/100);}
export function vehicleStockStats(db,id,time){
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='vehicle_loot'").get())return {value:0,count:0};
 return db.prepare("SELECT * FROM vehicle_loot WHERE user_id=? AND state IN ('pending','stored','transit')").all(id).reduce((total,row)=>{
  if(row.state==='transit'&&row.arrives_at<=time&&row.intercepted)return total;
  const car=stolenVehicles.find(v=>v.id===row.vehicle_id);if(!car)return total;const city=row.state==='transit'&&row.arrives_at<=time?row.destination:row.city;
  return {count:total.count+1,value:total.value+vehicleSaleValue(car,city,time,row.value_multiplier||1,row.condition_stars||4)};
 },{value:0,count:0});
}
