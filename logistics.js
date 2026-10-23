import {cityPerks,territoryFreight} from './territory-perks.js';
import {batchSaleChoices} from './public/drug-route-choice.js';
import {summarizeTrade} from './trade-summary.js';
import {vehicleStockStats} from './vehicle-catalog.js';
import {cityDrugMarkets,cityFactors,transportModes,freightQuote} from './drug-markets.js';
import {MAX_CASH} from './money.js';
import {sundayBonus} from './calendar-events.js';
import {compoundUpgrades} from './crew-operations.js';
import {order} from './purchases.js';
import {createHash,randomBytes} from 'node:crypto';
import {catalog,crimes} from './catalog.js';
import {familyAssets,career} from './empire-catalog.js';
import {progression} from './progression.js';

export const MAX=MAX_CASH,AMMO_MAX=1000000,WEAPON_MAX=10000,AMMO_PRICE=25;
export const weaponPrice=(w,count)=>Math.floor(w.price*(1+.01*count));
export const weapons=[
 ['street-sidearm','Street sidearm',1,5000,100],
 ['executive-pistol','Executive pistol',1,25000,220],
 ['crew-smg','Crew SMG',2,100000,450],
 ['security-carbine','Security carbine',2,300000,800],
 ['enforcer-rifle','Enforcer rifle',3,1000000,1400],
 ['sovereign-arsenal','Sovereign weapon system',3,3000000,2400]
].map(([id,name,tier,price,power])=>({id,name,tier,price,power,image:'/images/weapon-'+id+'.png'}));
export const ammoPacks=[{id:'small',rounds:100},{id:'medium',rounds:500},{id:'large',rounds:2000}].map(p=>({...p,price:p.rounds*AMMO_PRICE}));
export const cities=['New York','Miami','Los Angeles','Chicago','London','Amsterdam','Paris','Rome','Istanbul','Dubai','Singapore','Hong Kong','Tokyo','Sydney','São Paulo'];
const airportCoordinates=[[40.71,-74.01],[25.76,-80.19],[34.05,-118.24],[41.88,-87.63],[51.51,-.13],[52.37,4.90],[48.86,2.35],[41.90,12.50],[41.01,28.98],[25.20,55.27],[1.35,103.82],[22.32,114.17],[35.68,139.69],[-33.87,151.21],[-23.55,-46.63]];
export function flightQuote(origin,destination){
 const a=airportCoordinates[cities.indexOf(origin)],b=airportCoordinates[cities.indexOf(destination)];
 if(!a||!b)return {distanceKm:0,cost:1000000};
 const rad=n=>n*Math.PI/180,dLat=rad(b[0]-a[0]),dLon=rad(b[1]-a[1]);
 const h=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLon/2)**2;
 const distanceKm=Math.round(6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h))));
 return {distanceKm,cost:1000000+Math.round(distanceKm*500)};
}
export const products=[
 ['cannabis','Cannabis',50000,1,'/images/product-cannabis.png'],
 ['hashish','Hashish',125000,3,'/images/product-hashish.png'],
 ['ecstasy','Ecstasy',300000,5,'/images/product-ecstasy.png'],
 ['cocaine','Cocaine',750000,8,'/images/product-cocaine.png'],
 ['methamphetamine','Methamphetamine',1500000,11,'/images/product-methamphetamine.png']
].map(([id,name,cost,level,image])=>({id,name,cost,level,image}));
export function operationSupply(kind,spec){
 if(kind==='crime'){const n=crimes.findIndex(c=>c.id===spec.id)+1;return {ammo:Math.max(1,Math.ceil(n*n/4)),tier:n<=7?1:n<=14?2:3};}
 if(kind==='shipment')return {ammo:spec.level>=10?180:spec.level>=5?80:25,tier:spec.level>=10?3:spec.level>=5?2:1};
 if(kind==='pvp')return {ammo:{attack:15,rob:10,hostage:25,liquidate:60}[spec.id]||15,tier:spec.id==='liquidate'?3:spec.id==='hostage'?2:1};
 return kind==='raid'?{ammo:50,tier:1}:kind==='breakout'?{ammo:25,tier:2}:{ammo:50,tier:1};
}

export function installLogistics(db,{employeePower=()=>0,marriageBonus=()=>1,transaction,settleRaw,available,clock,fail,log,blockedMillis}){
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 db.exec(`CREATE TABLE IF NOT EXISTS armory_accounts(scope TEXT NOT NULL CHECK(scope IN ('personal','family')),owner_id INTEGER NOT NULL,ammo INTEGER NOT NULL DEFAULT 0 CHECK(ammo BETWEEN 0 AND 1000000),PRIMARY KEY(scope,owner_id));
 CREATE TABLE IF NOT EXISTS armory_weapons(scope TEXT NOT NULL,owner_id INTEGER NOT NULL,weapon_id TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 4),PRIMARY KEY(scope,owner_id,weapon_id),FOREIGN KEY(scope,owner_id) REFERENCES armory_accounts(scope,owner_id));
 CREATE TABLE IF NOT EXISTS city_heat(user_id INTEGER NOT NULL REFERENCES users(id),city TEXT NOT NULL,heat INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(user_id,city));
 CREATE TABLE IF NOT EXISTS production_batches(id INTEGER PRIMARY KEY AUTOINCREMENT,scope TEXT NOT NULL,owner_id INTEGER NOT NULL,drug_id TEXT NOT NULL,hours INTEGER NOT NULL,units INTEGER NOT NULL,cost INTEGER NOT NULL,base_value INTEGER NOT NULL,remaining_ms INTEGER NOT NULL,updated_at INTEGER NOT NULL,created_at INTEGER NOT NULL,sold_at INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS production_owner ON production_batches(scope,owner_id,sold_at);
 CREATE TABLE IF NOT EXISTS logistics_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS logistics_requests(actor_id INTEGER NOT NULL,request_key TEXT NOT NULL,payload TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(actor_id,request_key));`);
 if(!q("SELECT sql FROM sqlite_master WHERE name='armory_weapons'").sql.includes('10000'))transaction(()=>db.exec(`CREATE TABLE armory_weapons_new(scope TEXT NOT NULL,owner_id INTEGER NOT NULL,weapon_id TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10000),PRIMARY KEY(scope,owner_id,weapon_id),FOREIGN KEY(scope,owner_id) REFERENCES armory_accounts(scope,owner_id));INSERT INTO armory_weapons_new SELECT * FROM armory_weapons;DROP TABLE armory_weapons;ALTER TABLE armory_weapons_new RENAME TO armory_weapons;`));
 if(!q("SELECT sql FROM sqlite_master WHERE name='armory_accounts'").sql.includes('1000000'))transaction(()=>{
 const weapons=all('SELECT * FROM armory_weapons');
 db.exec(`CREATE TABLE armory_accounts_v2(scope TEXT NOT NULL CHECK(scope IN ('personal','family')),owner_id INTEGER NOT NULL,ammo INTEGER NOT NULL DEFAULT 0 CHECK(ammo BETWEEN 0 AND 1000000),PRIMARY KEY(scope,owner_id));INSERT INTO armory_accounts_v2 SELECT * FROM armory_accounts;DROP TABLE armory_weapons;DROP TABLE armory_accounts;ALTER TABLE armory_accounts_v2 RENAME TO armory_accounts;CREATE TABLE armory_weapons(scope TEXT NOT NULL,owner_id INTEGER NOT NULL,weapon_id TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10000),PRIMARY KEY(scope,owner_id,weapon_id),FOREIGN KEY(scope,owner_id) REFERENCES armory_accounts(scope,owner_id));`);
 for(const w of weapons)run('INSERT INTO armory_weapons VALUES(?,?,?,?)',w.scope,w.owner_id,w.weapon_id,w.quantity);
 });
 db.exec("CREATE TABLE IF NOT EXISTS production_routes(id INTEGER PRIMARY KEY,batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,origin TEXT NOT NULL,destination TEXT NOT NULL,mode TEXT NOT NULL,cost INTEGER NOT NULL,departed_at INTEGER NOT NULL,arrives_at INTEGER NOT NULL)");
 for(const [name,type] of [['batch_number','INTEGER NOT NULL DEFAULT 0'],['sale_value','INTEGER']])if(!all('PRAGMA table_info(production_batches)').some(c=>c.name===name))db.exec('ALTER TABLE production_batches ADD COLUMN '+name+' '+type);
 function numberBatchGaps(){for(const b of all('SELECT id,scope,owner_id,drug_id FROM production_batches WHERE batch_number=0 ORDER BY id')){const n=q('SELECT COALESCE(MAX(batch_number),0)+1 n FROM production_batches WHERE scope=? AND owner_id=? AND drug_id=?',b.scope,b.owner_id,b.drug_id).n;run('UPDATE production_batches SET batch_number=? WHERE id=?',n,b.id);}}
 transaction(numberBatchGaps);
 db.exec("CREATE UNIQUE INDEX IF NOT EXISTS production_sequence ON production_batches(scope,owner_id,drug_id,batch_number) WHERE batch_number>0");
 for(const [name,type] of [['origin_city',"TEXT NOT NULL DEFAULT 'New York'"],['stock_city',"TEXT NOT NULL DEFAULT 'New York'"],['transit_to',"TEXT NOT NULL DEFAULT ''"],['arrives_at','INTEGER NOT NULL DEFAULT 0'],['intercepted','INTEGER NOT NULL DEFAULT 0'],['freight_cost','INTEGER NOT NULL DEFAULT 0']])if(!all('PRAGMA table_info(production_batches)').some(c=>c.name===name))db.exec('ALTER TABLE production_batches ADD COLUMN '+name+' '+type);
 run('INSERT OR IGNORE INTO logistics_meta VALUES(?,?)','market_seed',randomBytes(32).toString('hex'));
 const marketSeed=q('SELECT value FROM logistics_meta WHERE key=?','market_seed').value;
 db.exec(`CREATE TABLE IF NOT EXISTS armory_purchase_history(scope TEXT NOT NULL,owner_id INTEGER NOT NULL,reference TEXT NOT NULL,weapon_id TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),cost INTEGER NOT NULL CHECK(cost>=0),PRIMARY KEY(scope,owner_id,reference));`);
 // Recover exact personal receipts only. Old family receipts do not identify the
 // family that paid, so assigning them from today's membership would be unsafe.
 if(!q("SELECT 1 FROM logistics_meta WHERE key='armory-paid-history-v1'"))transaction(()=>{
  const used=new Map();
  for(const row of all('SELECT rowid,* FROM logistics_requests ORDER BY rowid DESC')){
   let b,r;try{b=JSON.parse(row.payload);r=JSON.parse(row.result)}catch{continue}
   if(b.path!=='/api/armory/buy'||b.kind!=='weapon'||b.scope==='family'||!Number.isSafeInteger(r.cost)||r.cost<0||!Number.isSafeInteger(r.quantity)||r.quantity<1)continue;
   const held=q("SELECT quantity FROM armory_weapons WHERE scope='personal' AND owner_id=? AND weapon_id=?",row.actor_id,b.item)?.quantity||0,key=row.actor_id+':'+b.item,n=used.get(key)||0;
   if(n+r.quantity>held)continue;
   run("INSERT OR IGNORE INTO armory_purchase_history VALUES('personal',?,?,?,?,?)",row.actor_id,row.actor_id+':'+row.request_key,b.item,r.quantity,r.cost);used.set(key,n+r.quantity);
  }
  run("INSERT INTO logistics_meta VALUES('armory-paid-history-v1','1')");
 });
 function paidWeapons(scope,id,items){let paid=0,unpriced=0;
  for(const w of items.filter(w=>w.quantity)){const h=q('SELECT COALESCE(SUM(cost),0) cost,COALESCE(SUM(quantity),0) quantity FROM armory_purchase_history WHERE scope=? AND owner_id=? AND weapon_id=?',scope,id,w.id),free=scope==='personal'&&w.id==='street-sidearm'?1:0;
   if(h.quantity<=w.quantity){paid+=h.cost;unpriced+=Math.max(0,w.quantity-h.quantity-free)}else unpriced+=Math.max(0,w.quantity-free);
  }return {weaponPaidValue:paid,weaponUnpricedCount:unpriced};
 }
 function ensure(scope,id){
  const inserted=run('INSERT OR IGNORE INTO armory_accounts(scope,owner_id,ammo) VALUES(?,?,?)',scope,id,scope==='personal'?100:0).changes;
  if(inserted&&scope==='personal')run('INSERT INTO armory_weapons VALUES(?,?,?,?)',scope,id,'street-sidearm',1);
 }
 // A one-time starter kit lets existing and new players continue with low-level jobs.
 for(const u of all('SELECT id FROM users'))ensure('personal',u.id);
 function account(id,scope,manage=false){
  if(!['personal','family'].includes(scope))fail('Choose personal or family funds.');
  if(scope==='personal')return {scope,ownerId:id,canManage:true};
  const m=q('SELECT m.*,f.leader_id FROM family_members m JOIN families f ON f.id=m.family_id WHERE m.user_id=?',id);
  if(!m)fail('Join a family first.',403);const canManage=m.leader_id===id||m.family_role==='capo';
  if(manage&&!canManage)fail('Only the Don and Capos may buy or manage family supplies.',403);
  return {scope,ownerId:m.family_id,canManage};
 }
 function inventory(scope,id){
  const a=q('SELECT ammo FROM armory_accounts WHERE scope=? AND owner_id=?',scope,id);
  const rows=all('SELECT weapon_id,quantity FROM armory_weapons WHERE scope=? AND owner_id=?',scope,id);
  const items=weapons.map(w=>({...w,quantity:rows.find(r=>r.weapon_id===w.id)?.quantity||0}));
  const recovered=scope==='personal'?vehicleStockStats(db,id,clock()):{value:0,count:0};
  const art=scope==='personal'&&q("SELECT 1 FROM sqlite_master WHERE name='art_objects'")?q("SELECT COALESCE(SUM(CASE WHEN appraised=1 THEN estimated_value ELSE 0 END),0) value FROM art_objects WHERE user_id=? AND state IN ('collection','auction')",id).value:0;
  const paid=paidWeapons(scope,id,items);
  return {artValue:art,vehicleValue:recovered.value,vehicleCount:recovered.count,productionValue:q('SELECT COALESCE(SUM(cost),0) n FROM production_batches WHERE scope=? AND owner_id=? AND sold_at=0',scope,id).n,ammo:a?.ammo||0,weapons:items,tier:Math.max(0,...items.filter(w=>w.quantity).map(w=>w.tier)),weaponPower:items.reduce((n,w)=>n+w.power*w.quantity,0),...paid,weaponValue:paid.weaponPaidValue,weaponCatalogValue:items.reduce((n,w)=>n+w.price*w.quantity,0),weaponCount:items.reduce((n,w)=>n+w.quantity,0)};
 }
 function personalPower(id){const u=q('SELECT personal_protection,protected_until,muscle_until,muscle_uses FROM users WHERE id=?',id),a=inventory('personal',id);const protection=(u?.personal_protection||0)*250,vip=u?.protected_until>clock()?500:0,escort=u?.muscle_until>clock()&&u.muscle_uses>0?250:0;return {total:a.weaponPower+protection+vip+escort+employeePower(id),employees:employeePower(id),weapons:a.weaponPower,protection,vip,escort};}
 function familyPower(id){
  const members=all('SELECT user_id FROM family_members WHERE family_id=?',id).reduce((n,m)=>n+personalPower(m.user_id).total,0),a=inventory('family',id);
  const assets=all('SELECT item_id,quantity FROM family_assets WHERE family_id=?',id).reduce((n,x)=>{const item=familyAssets.find(i=>i.id===x.item_id);return n+(item?item.defense*100+item.runBonus*75+item.lossReduction*100+Math.round(Math.sqrt(item.price/1000)):0)*x.quantity},0);
  const guards=q('SELECT guard_until FROM families WHERE id=?',id)?.guard_until>clock()?1500:0;
  const extensions=all('SELECT upgrade_id FROM compound_upgrades WHERE family_id=?',id).reduce((n,x)=>n+(compoundUpgrades.find(v=>v.id===x.upgrade_id)?.power||0),0);return {total:members+a.weaponPower+assets+guards+extensions,members,weapons:a.weaponPower,assets:assets+extensions,extensions,guards};
 }
 function consume(id,scope,need){
  const a=account(id,scope);ensure(scope,a.ownerId);const inv=inventory(scope,a.ownerId);
  if(inv.tier<need.tier)fail(`Requires a tier ${need.tier} weapon in the ${scope} armory.`,409);
  if(!run('UPDATE armory_accounts SET ammo=ammo-? WHERE scope=? AND owner_id=? AND ammo>=?',need.ammo,scope,a.ownerId,need.ammo).changes)fail(`Not enough ${scope} ammunition. This attempt needs ${need.ammo} rounds.`,409);
  return need.ammo;
 }
 function debit(a,amount){const table=a.scope==='family'?'families':'users',field=a.scope==='family'?'treasury':'cash';if(!run(`UPDATE ${table} SET ${field}=${field}-? WHERE id=? AND ${field}>=?`,amount,a.ownerId,amount).changes)fail('Insufficient '+(a.scope==='family'?'family treasury.':'cash.'));}
 function record(id,a,message){log(id,message);if(a.scope==='family')run('INSERT INTO family_events(family_id,message,created_at) VALUES(?,?,?)',a.ownerId,message,clock());}
 function once(id,path,body,fn){
  if(typeof body.requestKey!=='string'||!/^[a-zA-Z0-9_-]{12,100}$/.test(body.requestKey))fail('A valid request key is required.');
  const payload=JSON.stringify({path,...body});const previous=q('SELECT payload,result FROM logistics_requests WHERE actor_id=? AND request_key=?',id,body.requestKey);
  if(previous){if(previous.payload!==payload)fail('Request key already used for another action.',409);return JSON.parse(previous.result);}
  const result=fn();run('INSERT INTO logistics_requests VALUES(?,?,?,?)',id,body.requestKey,payload,JSON.stringify(result));return result;
 }
 function hourlyPercent(drug,city,kind){const hour=Math.floor(clock()/3600000),key=marketSeed+':'+drug+':'+city+':'+kind+':'+hour;return 90+parseInt(createHash('sha256').update(key).digest('hex').slice(0,8),16)%21;}
 function market(drug,city='New York'){const hour=Math.floor(clock()/3600000);return {percent:hourlyPercent(drug,city,'sale'),productionPercent:hourlyPercent(drug,city,'production'),transportPercent:hourlyPercent(drug,city,'freight'),epoch:hour,until:(hour+1)*3600000};}
 function remaining(batch){return Math.max(0,batch.remaining_ms-Math.max(0,clock()-batch.updated_at-(batch.scope==='personal'?blockedMillis(batch.owner_id,batch.updated_at,clock()):0)));}
 function baseQuote(b,city){return Math.floor(b.base_value*cityFactors(city,products.findIndex(p=>p.id===b.drug_id),Math.floor(clock()/3600000)).sale*market(b.drug_id,city).percent/100);}
 function saleQuote(b,city,scope,id,factor=scope==='personal'?marriageBonus(id):sundayBonus(clock())){const base=Math.floor(baseQuote(b,city)*(1+cityPerks(db,scope,id,city).saleBonus));return base+Math.floor(Math.max(0,base-b.cost-b.freight_cost)*(factor-1));}
 function cargoQuote(b,city,mode){const offer=territoryFreight(db,b,city,freightQuote(b.stock_city,city,mode,b.cost,b.units));if(!offer)return null;return {...offer,cost:Math.ceil(offer.cost*market(b.drug_id,b.stock_city).transportPercent*market(b.drug_id,city).transportPercent/10000)};}
 function finishFreight(scope,id){for(const b of all('SELECT * FROM production_batches WHERE scope=? AND owner_id=? AND sold_at=0 AND arrives_at>0 AND arrives_at<=?',scope,id,clock())){
  run("UPDATE production_batches SET stock_city=transit_to,transit_to='',arrives_at=0,sold_at=? WHERE id=?",b.intercepted?clock():0,b.id);
  const text=b.intercepted?'Drug cargo intercepted: '+b.units+' crates of '+products.find(p=>p.id===b.drug_id).name+' to '+b.transit_to+'. No additional cash charged.':'Drug cargo delivered: '+b.units+' crates of '+products.find(p=>p.id===b.drug_id).name+' to '+b.transit_to+'. Ready for sale.';
  if(scope==='personal')log(id,text);else for(const member of all('SELECT user_id FROM family_members WHERE family_id=?',id))log(member.user_id,'Family cargo: '+text);
 }}
 function productionTrade(scope,id){
  const rows=all('SELECT * FROM production_batches WHERE scope=? AND owner_id=?',scope,id),names=new Map(products.map(p=>[p.id,p.name]));
  return summarizeTrade(rows.map(b=>{const cost=b.cost+b.freight_cost,lost=!!b.sold_at&&!!b.intercepted,known=!!b.sold_at&&(lost||b.sale_value!==null);return {id:b.drug_id,name:names.get(b.drug_id),invested:cost,received:b.sale_value??0,closedCost:known?cost:0,closedReceived:known?(b.sale_value||0):0,losses:lost?cost:0};}),{realized:true,missing:rows.filter(b=>b.sold_at&&!b.intercepted&&b.sale_value===null).length,stock:products.map(p=>({id:p.id,name:p.name,cost:rows.filter(b=>b.drug_id===p.id&&!b.sold_at).reduce((n,b)=>n+b.cost+b.freight_cost,0)}))});
 }
 db.exec('CREATE INDEX IF NOT EXISTS production_trade_owner ON production_batches(scope,owner_id,sold_at)');
 db.exec('CREATE TABLE IF NOT EXISTS production_trade_meta(key TEXT PRIMARY KEY)');
 if(!q("SELECT 1 FROM production_trade_meta WHERE key='verified-sales-v1'"))transaction(()=>{
  for(const b of all('SELECT * FROM production_batches WHERE sold_at>0 AND sale_value IS NULL AND intercepted=0')){
   const table=b.scope==='family'?'family_events':'events',owner=b.scope==='family'?'family_id':'user_id';
   if(!all('PRAGMA table_info('+table+')').some(c=>c.name==='message'))continue;
   const matches=all('SELECT message FROM '+table+' WHERE '+owner+'=? AND created_at=?',b.owner_id,b.sold_at).map(r=>r.message.match(/^Sold production batch #(\d+) at \d+% for \$(\d+)\.$/)).filter(m=>m&&(Number(m[1])===b.id||Number(m[1])===b.batch_number)&&Number.isSafeInteger(Number(m[2])));
   if(matches.length===1)run('UPDATE production_batches SET sale_value=? WHERE id=?',Number(matches[0][2]),b.id);
  }
  run("INSERT INTO production_trade_meta VALUES('verified-sales-v1')");
 });
 function productionHistory(scope,id){return all('SELECT * FROM production_batches WHERE scope=? AND owner_id=? ORDER BY id DESC LIMIT 50',scope,id).map(b=>{const realized=b.intercepted&&b.sold_at?0:b.sale_value,investment=b.cost+b.freight_cost,netProfit=realized===null?null:realized-investment;return {...b,batchNumber:b.batch_number,saleValue:realized,netProfit,netMargin:netProfit===null?null:netProfit/Math.max(1,investment)*100,routes:all('SELECT * FROM production_routes WHERE batch_id=? ORDER BY id',b.id),intercepted:b.arrives_at>clock()?undefined:b.intercepted};});}
 function batchRows(scope,id){transaction(()=>{numberBatchGaps();finishFreight(scope,id)});return all('SELECT * FROM production_batches WHERE scope=? AND owner_id=? AND sold_at=0 ORDER BY id',scope,id).map(b=>{const saleValue=saleQuote(b,b.stock_city,scope,id);return {...b,batchNumber:b.batch_number,intercepted:undefined,remaining:remaining(b),market:market(b.drug_id,b.stock_city),saleValue,netProfit:saleValue-b.cost-b.freight_cost,netMargin:(saleValue-b.cost-b.freight_cost)/Math.max(1,b.cost+b.freight_cost)*100,destinations:cities.filter(c=>c!==b.stock_city).map(city=>({city,saleValue:saleQuote(b,city,scope,id),routes:transportModes.map(m=>cargoQuote(b,city,m)).filter(Boolean).map(r=>{const shipped={...b,freight_cost:b.freight_cost+r.cost},saleValue=saleQuote(shipped,city,scope,id),investment=b.cost+shipped.freight_cost,netProfit=saleValue-investment;return {...r,saleValue,netProfit,expectedProfit:saleValue*(1-r.risk)-investment,netMargin:netProfit/Math.max(1,investment)*100}})}))};});}


 function productionStorage(scope,id){const warehouses=scope==='personal'?q("SELECT COALESCE(SUM(quantity),0) n FROM possessions WHERE user_id=? AND item_id='production-warehouse'",id).n:q("SELECT COALESCE(SUM(quantity),0) n FROM family_assets WHERE family_id=? AND item_id='warehouse-production-family'",id).n;return {warehouses,capacity:warehouses*1000,used:q('SELECT COALESCE(SUM(units),0) n FROM production_batches WHERE scope=? AND owner_id=? AND sold_at=0 AND arrives_at=0',scope,id).n};}
 function productionCatalog(user,a){user={...user,city:cities.includes(user.city)?user.city:'New York'};const xp=a.scope==='family'?q('SELECT drugs_xp FROM families WHERE id=?',a.ownerId).drugs_xp:user.drugs_xp,level=career('drugs',xp).level,factor=1+(level-1)*.03;
  return products.map(p=>({...p,locked:level<p.level,market:market(p.id,user.city),city:user.city,cityFactors:cities.map(city=>({city,...cityFactors(city,products.indexOf(p),Math.floor(clock()/3600000)),market:market(p.id,city)})),terms:[6,12,24].map(hours=>({hours,activeHours:Math.round(hours*(1-cityPerks(db,a.scope,a.ownerId,user.city).productionReduction)*10000)/10000,cost:Math.ceil(p.cost*hours/6*cityFactors(user.city,products.indexOf(p),Math.floor(clock()/3600000)).production*market(p.id,user.city).productionPercent/100),baseValue:Math.floor(p.cost*hours/6*(1.3+hours/120)*factor)}))}));
 }
 function batches(scope,id){const funds=q('SELECT '+(scope==='family'?'treasury':'cash')+' funds FROM '+(scope==='family'?'families':'users')+' WHERE id=?',id).funds;return batchRows(scope,id).map(b=>({...b,saleChoices:batchSaleChoices(b,funds)}));}
 function rankedProduction(user,a){
  user={...user,city:cities.includes(user.city)?user.city:'New York'};
  const funds=a.scope==='family'?q('SELECT treasury FROM families WHERE id=?',a.ownerId).treasury:user.cash;
  const storage=productionStorage(a.scope,a.ownerId),hasSlot=batches(a.scope,a.ownerId).filter(b=>b.arrives_at<=clock()).length<5,saleFactor=a.scope==='personal'?marriageBonus(a.ownerId):sundayBonus(clock());
  const list=productionCatalog(user,a).map(p=>{
   const offers=p.terms.flatMap(t=>{
    const batch={scope:a.scope,owner_id:a.ownerId,drug_id:p.id,stock_city:p.city,base_value:t.baseValue,cost:t.cost,freight_cost:0,units:1};
    return cities.flatMap(city=>{
     const routes=city===p.city?[{mode:'local',name:'Local sale',cost:0,hours:0,risk:0}]:transportModes.map(mode=>cargoQuote(batch,city,mode)).filter(Boolean);
     return routes.map(r=>{const shipped={...batch,freight_cost:r.cost},saleValue=saleQuote(shipped,city,a.scope,a.ownerId,saleFactor),totalCost=t.cost+r.cost,expectedProfit=saleValue*(1-r.risk)-totalCost;
      return {hours:t.hours,destination:city,mode:r.mode,transport:r.name,transportHours:r.hours,risk:r.risk,cost:t.cost,transportCost:r.cost,saleValue,netProfit:saleValue-totalCost,expectedProfit,expectedPerHour:expectedProfit/(t.activeHours+r.hours),affordable:totalCost<=funds};});
    });
   }).sort((a,b)=>b.expectedPerHour-a.expectedPerHour);
   const recommendation=offers.find(o=>o.affordable)||offers[0],mostProfitableOffer=[...offers].filter(o=>o.affordable).sort((a,b)=>b.netProfit-a.netProfit)[0]||[...offers].sort((a,b)=>b.netProfit-a.netProfit)[0];
   const drugStock=q('SELECT COALESCE(SUM(units),0) n FROM production_batches WHERE scope=? AND owner_id=? AND drug_id=? AND sold_at=0 AND arrives_at=0',a.scope,a.ownerId,p.id).n;
   const canStart=drugStock<1000&&!p.locked&&a.canManage&&hasSlot&&storage.used<storage.capacity&&!(user.prison_until>clock()||user.hospital_until>clock()||user.captured_until>clock()||user.health<10)&&recommendation.affordable;
   return {...p,recommendation,mostProfitableOffer,canStart,terms:[...p.terms].sort((x,y)=>(y.hours===recommendation.hours)-(x.hours===recommendation.hours))};
  }).sort((x,y)=>x.level-y.level);
  return list; // Route awards belong to owned batches, never to a drug type.
 }
 function cityHeat(id,city){const row=q('SELECT * FROM city_heat WHERE user_id=? AND city=?',id,city);return row?Math.max(0,row.heat-Math.floor(Math.max(0,clock()-row.updated_at)/3600000)):0;}
 function airport(id){const u=q('SELECT * FROM users WHERE id=?',id),jets=all("SELECT item_id,quantity FROM possessions WHERE user_id=? AND category='jet'",id),cooldown=q('SELECT available_at FROM actions WHERE user_id=? AND kind=?',id,'flight')?.available_at||0;return {currentCity:u.city,heat:u.heat,hasJet:jets.length>0,cooldown,serverTime:clock(),destinations:cities.map(city=>({city,heat:city===u.city?u.heat:cityHeat(id,city),...flightQuote(u.city,city)}))};}
 function route(req,path,body,user){
  const paths=['/api/armory','/api/armory/buy','/api/airport','/api/airport/fly','/api/production','/api/production/start','/api/production/sell','/api/production/ship','/api/admin/logistics'];if(!paths.includes(path))return null;
  const params=new URL(req.url,'http://localhost').searchParams;
  if(path==='/api/admin/logistics'){
   // guardStaff applies before this route and protects Owner accounts/families.
   const scope=body.scope??params.get('scope'),id=Number(body.targetId??params.get('id'));
   if(!['personal','family'].includes(scope)||!Number.isSafeInteger(id)||id<1||!q('SELECT id FROM '+(scope==='family'?'families':'users')+' WHERE id=?',id))fail('Target not found.',404);
   if(req.method==='GET')return {scope,id,...inventory(scope,id),batches:batches(scope,id)};
   if(req.method!=='POST')fail('Method not allowed.',405);
   if(!Number.isSafeInteger(body.ammo)||body.ammo<0||body.ammo>AMMO_MAX||!Array.isArray(body.weapons)||body.weapons.length>weapons.length||new Set(body.weapons.map(w=>w?.id)).size!==body.weapons.length||body.weapons.some(w=>!weapons.some(x=>x.id===w?.id)||!Number.isSafeInteger(w.quantity)||w.quantity<0||w.quantity>WEAPON_MAX))fail('Invalid armory quantities.');
   return transaction(()=>{ensure(scope,id);const before={ammo:q('SELECT ammo FROM armory_accounts WHERE scope=? AND owner_id=?',scope,id).ammo,weapons:all('SELECT weapon_id,quantity FROM armory_weapons WHERE scope=? AND owner_id=? ORDER BY weapon_id',scope,id)};run('UPDATE armory_accounts SET ammo=? WHERE scope=? AND owner_id=?',body.ammo,scope,id);run('DELETE FROM armory_weapons WHERE scope=? AND owner_id=?',scope,id);for(const w of body.weapons)if(w.quantity)run('INSERT INTO armory_weapons VALUES(?,?,?,?)',scope,id,w.id,w.quantity);record(user.id,{scope,ownerId:id},'Staff updated '+scope+' armory #'+id+'.');run('INSERT INTO owner_audit(actor_id,target_id,details,created_at) VALUES(?,?,?,?)',user.id,scope==='personal'?id:user.id,JSON.stringify({scope,id,before,after:{ammo:body.ammo,weapons:all('SELECT weapon_id,quantity FROM armory_weapons WHERE scope=? AND owner_id=? ORDER BY weapon_id',scope,id)}}),clock());return {ok:true,message:'Armory updated.',image:'/images/armory-ammunition.png'};});
  }
  if(req.method==='GET'){
   if(path==='/api/airport')return airport(user.id);
   if(path!=='/api/armory'&&path!=='/api/production')fail('Method not allowed.',405);
   const a=account(user.id,params.get('scope')||'personal');
   if(path==='/api/armory')return {...a,...inventory(a.scope,a.ownerId),power:a.scope==='family'?familyPower(a.ownerId):personalPower(user.id),packs:ammoPacks,ammoMax:AMMO_MAX,ammoPrice:AMMO_PRICE,weaponMax:WEAPON_MAX,funds:a.scope==='family'?q('SELECT treasury FROM families WHERE id=?',a.ownerId).treasury:q('SELECT cash FROM users WHERE id=?',user.id).cash};
   return {...a,territoryPerks:cities.map(city=>cityPerks(db,a.scope,a.ownerId,city)),funds:a.scope==='family'?q('SELECT treasury FROM families WHERE id=?',a.ownerId).treasury:user.cash,products:rankedProduction(user,a),batches:batches(a.scope,a.ownerId),serverTime:clock(),currentCity:cities.includes(user.city)?user.city:'New York',cities,transportModes,trade:productionTrade(a.scope,a.ownerId),freightHistory:productionHistory(a.scope,a.ownerId),productionSummary:all('SELECT drug_id,COUNT(*) batches,SUM(units) crates,SUM(cost) productionCost,SUM(freight_cost) transportCost FROM production_batches WHERE scope=? AND owner_id=? GROUP BY drug_id',a.scope,a.ownerId),storage:productionStorage(a.scope,a.ownerId),slotLimit:5,quoteEpoch:Math.floor(clock()/3600000),nextMarketUpdate:(Math.floor(clock()/3600000)+1)*3600000};
  }
  if(req.method!=='POST')fail('Method not allowed.',405);
  return transaction(()=>once(user.id,path,body,()=>{
   const u=settleRaw(user.id);available(u);
   if(path==='/api/airport/fly'){
    const offer=airport(user.id),destination=offer.destinations.find(c=>c.city===body.city);
    if(!offer.hasJet)fail('Buy a private jet before using this airport.',403);if(!destination||destination.city===u.city)fail('Choose another destination.');if(offer.cooldown>clock())fail('Your jet is being prepared. Flights have a 15-minute cooldown.',429);
    debit({scope:'personal',ownerId:u.id},destination.cost);
    run('INSERT INTO city_heat VALUES(?,?,?,?) ON CONFLICT(user_id,city) DO UPDATE SET heat=excluded.heat,updated_at=excluded.updated_at',u.id,u.city,u.heat,clock());
    run('UPDATE users SET city=?,heat=? WHERE id=?',destination.city,destination.heat,u.id);
    run('INSERT INTO actions(user_id,kind,available_at) VALUES(?,?,?) ON CONFLICT(user_id,kind) DO UPDATE SET available_at=excluded.available_at',u.id,'flight',clock()+900000);
    log(u.id,'Flew from '+u.city+' to '+destination.city+' for $'+destination.cost+'. Local heat: '+destination.heat+'.');return {ok:true,cost:destination.cost,message:'Arrived in '+destination.city+'. Local heat: '+destination.heat+'/100. Heat in '+u.city+' remains on record.',image:'/images/jet-imperium.jpg'};
   }
   const a=account(u.id,body.scope,true);ensure(a.scope,a.ownerId);
   if(path==='/api/armory/buy'){
    const funds=a.scope==='family'?q('SELECT treasury FROM families WHERE id=?',a.ownerId).treasury:u.cash;
    if(body.kind==='ammo'){const pack=ammoPacks.find(p=>p.id===body.item);const {quantity,cost}=order(body.quantity??pack?.rounds,AMMO_MAX-inventory(a.scope,a.ownerId).ammo,funds,()=>AMMO_PRICE,fail);debit(a,cost);run('UPDATE armory_accounts SET ammo=ammo+? WHERE scope=? AND owner_id=?',quantity,a.scope,a.ownerId);record(u.id,a,'Purchased '+quantity+' rounds.');return {ok:true,cost,quantity,message:quantity+' rounds added to the '+a.scope+' armory.',image:'/images/armory-ammunition.png'};}
    if(body.kind!=='weapon')fail('Choose weapons or ammunition.');const w=weapons.find(x=>x.id===body.item);if(!w)fail('Unknown weapon.');const count=inventory(a.scope,a.ownerId).weapons.find(x=>x.id===w.id).quantity;const {quantity,cost}=order(body.quantity??1,WEAPON_MAX-count,funds,i=>weaponPrice(w,count+i),fail);debit(a,cost);run('INSERT INTO armory_purchase_history VALUES(?,?,?,?,?,?)',a.scope,a.ownerId,u.id+':'+body.requestKey,w.id,quantity,cost);run('INSERT INTO armory_weapons VALUES(?,?,?,?) ON CONFLICT(scope,owner_id,weapon_id) DO UPDATE SET quantity=quantity+excluded.quantity',a.scope,a.ownerId,w.id,quantity);record(u.id,a,'Purchased '+quantity+' × '+w.name+'.');return {ok:true,cost,quantity,armoryOwnerId:a.ownerId,message:quantity+' × '+w.name+' acquired. +'+w.power*quantity+' Power.',image:w.image};
   }
   if(path.startsWith('/api/production/')&&body.quoteEpoch!==undefined&&body.quoteEpoch!==Math.floor(clock()/3600000))fail('Hourly market quotes have changed. Refresh before committing.',409);
   if(path==='/api/production/start'){
    const p=productionCatalog(u,a).find(p=>p.id===body.product),term=p?.terms.find(t=>t.hours===body.hours);if(!p||!term||!Number.isSafeInteger(body.units)||body.units<1||body.units>1000)fail('Choose a product, 6/12/24 hours and 1–1,000 crates.');if(p.locked)fail('Reach drugs career level '+p.level+' first.',403);if(batches(a.scope,a.ownerId).filter(b=>b.arrives_at<=clock()).length>=5)fail('All five local production slots are occupied. Sell or dispatch a completed batch first.',409);if(batches(a.scope,a.ownerId).filter(x=>x.drug_id===p.id&&x.arrives_at<=clock()).reduce((n,x)=>n+x.units,0)+body.units>1000)fail('Maximum 1,000 unsold crates per drug type.',409);
    const storage=productionStorage(a.scope,a.ownerId);if(storage.used+body.units>storage.capacity)fail('Buy a production warehouse before starting. Each warehouse holds 1,000 unsold crates across all products.',409);
    const cost=term.cost*body.units,baseValue=term.baseValue*body.units;debit(a,cost);const sequence=q('SELECT COALESCE(MAX(batch_number),0)+1 n FROM production_batches WHERE scope=? AND owner_id=? AND drug_id=?',a.scope,a.ownerId,p.id).n;const r=run('INSERT INTO production_batches(scope,owner_id,drug_id,hours,units,cost,base_value,remaining_ms,updated_at,created_at,batch_number) VALUES(?,?,?,?,?,?,?,?,?,?,?)',a.scope,a.ownerId,p.id,term.hours,body.units,cost,baseValue,Math.round(term.hours*3600000*(1-cityPerks(db,a.scope,a.ownerId,u.city).productionReduction)),clock(),clock(),sequence);run('UPDATE production_batches SET origin_city=?,stock_city=? WHERE id=?',cities.includes(u.city)?u.city:'New York',cities.includes(u.city)?u.city:'New York',r.lastInsertRowid);record(u.id,a,'Started '+body.units+' crates of '+p.name+' ('+term.hours+' hours).');return {ok:true,id:Number(r.lastInsertRowid),cost,message:'Production started. '+body.units+(body.units===1?' crate of ':' crates of ')+p.name+' in '+term.activeHours+' active hours.',image:p.image};
   }
   if(path==='/api/production/ship'){
    finishFreight(a.scope,a.ownerId);
    if(!Number.isSafeInteger(body.id))fail('Choose a batch.');const b=q('SELECT * FROM production_batches WHERE id=? AND scope=? AND owner_id=? AND sold_at=0',body.id,a.scope,a.ownerId);
    if(!b||remaining(b)>0||b.arrives_at>clock())fail('Choose a completed batch that is not in transit.',409);
    const mode=transportModes.find(m=>m.id===body.mode),offer=mode&&cargoQuote(b,body.city,mode);if(!offer)fail('This route is unavailable. Trucks can only travel within the same connected region.');
    debit(a,offer.cost);const intercepted=parseInt(createHash('sha256').update(marketSeed+':freight:'+b.id+':'+clock()+':'+body.requestKey).digest('hex').slice(0,8),16)/4294967296<offer.risk;
    run('INSERT INTO production_routes(batch_id,origin,destination,mode,cost,departed_at,arrives_at) VALUES(?,?,?,?,?,?,?)',b.id,b.stock_city,body.city,body.mode,offer.cost,clock(),clock()+offer.hours*3600000);run('UPDATE production_batches SET transit_to=?,arrives_at=?,intercepted=?,freight_cost=freight_cost+? WHERE id=?',body.city,clock()+offer.hours*3600000,intercepted?1:0,offer.cost,b.id);
    record(u.id,a,'Dispatched batch #'+b.id+' from '+b.stock_city+' to '+body.city+' by '+mode.name+'.');return {ok:true,cost:offer.cost,message:'Cargo dispatched to '+body.city+'. Arrival in '+offer.hours+' hours. Interception risk '+Math.round(offer.risk*100)+'%.',image:'/images/banner-production-v3.png'};
   }
   if(path==='/api/production/sell'){
    finishFreight(a.scope,a.ownerId);
    if(!Number.isSafeInteger(body.id))fail('Choose a batch.');const b=q('SELECT * FROM production_batches WHERE id=? AND scope=? AND owner_id=? AND sold_at=0',body.id,a.scope,a.ownerId);if(!b)fail('Batch unavailable or already sold.',409);if(remaining(b)>0)fail('This batch is still in production.',409);if(b.arrives_at>clock())fail('This batch is still in transit.',409);
    const rate=market(b.drug_id,b.stock_city),basePayout=Math.floor(baseQuote(b,b.stock_city)*(1+cityPerks(db,a.scope,a.ownerId,b.stock_city).saleBonus)),payout=basePayout+(a.scope==='personal'?Math.floor(Math.max(0,basePayout-b.cost-b.freight_cost)*(marriageBonus(u.id)-1)):Math.floor(Math.max(0,basePayout-b.cost-b.freight_cost)*(sundayBonus(clock())-1))),table=a.scope==='family'?'families':'users',field=a.scope==='family'?'treasury':'cash';if(!run(`UPDATE ${table} SET ${field}=${field}+? WHERE id=? AND ${field}<=?`,payout,a.ownerId,MAX-payout).changes)fail('Not enough wallet capacity to sell this batch.');run('UPDATE production_batches SET sold_at=?,remaining_ms=0,sale_value=? WHERE id=?',clock(),payout,b.id);record(u.id,a,'Sold production batch #'+b.batch_number+' at '+rate.percent+'% for $'+payout+'.');return {ok:true,payout,message:'Batch sold at '+rate.percent+'% of its locked base value.',image:products.find(p=>p.id===b.drug_id).image};
   }
   fail('Unsupported operation.',405);
  }));
 }
 function marketAdvice(user){
  const current=cities.includes(user.city)?user.city:'New York',flightBoard=airport(user.id),hasJet=flightBoard.hasJet,canFly=flightBoard.cooldown<=clock(),offers=[],profitBonus=marriageBonus(user.id);
  const storage=productionStorage('personal',user.id),hasStorage=storage.used<storage.capacity,atCap=new Set(all("SELECT drug_id FROM production_batches WHERE scope='personal' AND owner_id=? AND sold_at=0 AND arrives_at=0 GROUP BY drug_id HAVING SUM(units)>=1000",user.id).map(r=>r.drug_id));
  for(const origin of cities){const a={scope:'personal',ownerId:user.id};for(const p of productionCatalog({...user,city:origin},a).filter(p=>!p.locked&&!atCap.has(p.id)))for(const term of p.terms){
   const b={scope:'personal',owner_id:user.id,drug_id:p.id,stock_city:origin,base_value:term.baseValue,cost:term.cost,freight_cost:0,units:1},flight=origin===current?0:flightBoard.destinations.find(c=>c.city===origin)?.cost||0;
   for(const destination of cities){const routes=destination===origin?[{name:'Local sale',mode:'local',cost:0,hours:0,risk:0}]:transportModes.map(m=>cargoQuote(b,destination,m)).filter(Boolean);
    for(const r of routes){const saleValue=saleQuote({...b,freight_cost:r.cost},destination,'personal',user.id,profitBonus),totalCost=term.cost+r.cost+flight,netProfit=saleValue-totalCost,expectedProfit=saleValue*(1-r.risk)-totalCost,hours=term.activeHours+r.hours;
     offers.push({product:p.id,name:p.name,origin,destination,mode:r.mode,transport:r.name,productionHours:term.activeHours,transportHours:r.hours,productionCost:term.cost,transportCost:r.cost,flightCost:flight,totalCost,saleValue,netProfit,netMargin:netProfit/totalCost*100,expectedProfit,expectedPerHour:expectedProfit/hours,risk:r.risk,requiresTravel:origin!==current,accessible:hasStorage&&(origin===current||hasJet&&canFly),affordable:totalCost<=user.cash});
    }
   }
  }}
  offers.sort((a,b)=>b.expectedPerHour-a.expectedPerHour);
  const stock=batches('personal',user.id).filter(b=>!b.remaining&&!b.arrives_at).flatMap(b=>[
   {batch:b.batch_number,name:products.find(p=>p.id===b.drug_id).name,destination:b.stock_city,transport:'Local sale',netProfit:b.netProfit,netMargin:b.netMargin,risk:0,expectedProfit:b.netProfit},
   ...b.destinations.flatMap(c=>c.routes.filter(r=>r.cost<=user.cash).map(r=>({batch:b.batch_number,name:products.find(p=>p.id===b.drug_id).name,destination:c.city,transport:r.name,netProfit:r.netProfit,netMargin:r.netMargin,risk:r.risk,expectedProfit:r.saleValue*(1-r.risk)-b.cost-b.freight_cost-r.cost})))
  ]).sort((a,b)=>b.expectedProfit-a.expectedProfit);
  return {storage,asOf:clock(),until:(Math.floor(clock()/3600000)+1)*3600000,currentCity:current,units:1,slotsUsed:batches('personal',user.id).filter(b=>b.arrives_at<=clock()).length,bestAvailable:offers.find(o=>o.accessible&&o.affordable)||null,bestMarket:offers[0]||null,bestStock:stock[0]||null,hasJet};
 }
 return {settleFreight:()=>transaction(()=>{for(const row of all('SELECT DISTINCT scope,owner_id FROM production_batches WHERE sold_at=0 AND arrives_at>0 AND arrives_at<=?',clock()))finishFreight(row.scope,row.owner_id)}),route,consume,personalPower,familyPower,inventory,ensure,marketAdvice};
}
