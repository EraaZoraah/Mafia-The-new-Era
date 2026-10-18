import {territoryCaptureChance} from './public/territory-rules.js';
import {allied} from './diplomacy.js';
import {cityGeography} from './public/city-geography.js';
import {cities} from './logistics.js';
import {familyAssets,familyPrice} from './empire-catalog.js';

export const cityMaps=cities.map((name,i)=>({name,index:i,territoryCount:cityGeography[name].count,layout:['river','coast','coast','river','river','canals','river','river','strait','desert','islands','islands','bay','bay','river'][i],accent:['#bba075','#4bbdaf','#da9276','#839cc7','#a89acb','#daaf64','#b894ba','#c4aa7b','#78b9bf','#d9b779','#73b99b','#be8b91','#9caddd','#69b5cb','#9db47e'][i],subtitle:['Harbor boroughs','Coastal avenues','Pacific crossroads','Lakeside wards','Riverside boroughs','Canal districts','Riverbank quarters','Historic wards','Two shores','Desert metropolis','Island trade routes','Harbor islands','Bay wards','Coastal coves','Urban river districts'][i]}));
const types=['territory-block','territory-block','territory-block','territory-district','territory-district','territory-harbor'];
const prefixes=['North','South','East','West','Central','Old','Upper','Lower','Grand','Royal'];
export function installTerritoryMap(db,{clock,transaction,familyMember,settleRaw,available,familyDebit,familyLog,fail}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS city_territories(id INTEGER PRIMARY KEY,city TEXT NOT NULL,slot INTEGER NOT NULL,item_id TEXT NOT NULL,name TEXT NOT NULL,owner_id INTEGER REFERENCES families(id),acquired_at INTEGER NOT NULL DEFAULT 0,UNIQUE(city,slot));CREATE INDEX IF NOT EXISTS city_territory_owner ON city_territories(owner_id,city);`);
 if(!all('PRAGMA table_info(city_territories)').some(x=>x.name==='captured'))db.exec('ALTER TABLE city_territories ADD COLUMN captured INTEGER NOT NULL DEFAULT 0');
 db.exec('CREATE TABLE IF NOT EXISTS family_capture_state(family_id INTEGER PRIMARY KEY REFERENCES families(id),attempt_until INTEGER NOT NULL DEFAULT 0,success_until INTEGER NOT NULL DEFAULT 0,shield_until INTEGER NOT NULL DEFAULT 0)');
 transaction(()=>{for(const c of cityMaps){for(const old of all('SELECT * FROM city_territories WHERE city=? AND slot>=? AND owner_id IS NOT NULL',c.name,c.territoryCount)){const vacancy=q('SELECT * FROM city_territories WHERE city=? AND slot<? AND owner_id IS NULL ORDER BY (item_id=?) DESC,slot LIMIT 1',c.name,c.territoryCount,old.item_id);if(vacancy){run('DELETE FROM city_territories WHERE id=?',vacancy.id);run('UPDATE city_territories SET slot=? WHERE id=?',vacancy.slot,old.id)}}run('DELETE FROM city_territories WHERE city=? AND slot>=? AND owner_id IS NULL',c.name,c.territoryCount)}for(const c of cityMaps)for(let slot=0;slot<c.territoryCount;slot++){
  const type=types[(slot+c.index*7)%6],suffix=type==='territory-block'?'Block':type==='territory-district'?'Exchange':'Docks';
  run('INSERT OR IGNORE INTO city_territories(city,slot,item_id,name) VALUES(?,?,?,?)',c.name,slot,type,prefixes[(slot+c.index)%10]+' '+suffix+' '+(Math.floor(slot/10)+1));
 }});
 const spec=id=>familyAssets.find(x=>x.id===id&&x.category==='Territory');
 const count=(familyId,city)=>q('SELECT COUNT(*) n FROM city_territories WHERE owner_id=? AND city=?',familyId,city).n;
 // Aggregate family holdings remain the source of existing economy/Power calculations.
 // Reconcile only legacy/admin changes; normal map purchases and captures update both atomically.
 function sync(familyId){
  const ids=familyId?[familyId]:all('SELECT id FROM families').map(f=>f.id);
  const counts=new Map(all('SELECT owner_id,city,COUNT(*) n FROM city_territories WHERE owner_id IS NOT NULL GROUP BY owner_id,city').map(p=>[p.owner_id+'|'+p.city,p.n]));
  const owned=(id,city)=>counts.get(id+'|'+city)||0;
  for(const id of ids)for(const item of familyAssets.filter(x=>x.category==='Territory')){
   const wanted=q('SELECT quantity FROM family_assets WHERE family_id=? AND item_id=?',id,item.id)?.quantity||0;
   const mapped=all('SELECT id FROM city_territories WHERE owner_id=? AND item_id=? ORDER BY id',id,item.id);
   for(const p of mapped.slice(wanted)){const city=q('SELECT city FROM city_territories WHERE id=?',p.id).city;run('UPDATE city_territories SET owner_id=NULL,acquired_at=0,captured=0 WHERE id=?',p.id);counts.set(id+'|'+city,owned(id,city)-1);}
   for(let n=mapped.length;n<wanted;n++){
    const plot=all('SELECT * FROM city_territories WHERE item_id=? AND owner_id IS NULL ORDER BY id',item.id).filter(p=>owned(id,p.city)<30).sort((a,b)=>owned(id,a.city)-owned(id,b.city)||a.id-b.id)[0];
    if(!plot)fail('Not enough unclaimed map territory to place these holdings. No assets were changed.',409);
    run('UPDATE city_territories SET owner_id=?,acquired_at=0,captured=0 WHERE id=?',id,plot.id);counts.set(id+'|'+plot.city,owned(id,plot.city)+1);
   }
  }
 }
 transaction(()=>sync());
 function holdings(id){return all('SELECT * FROM city_territories WHERE owner_id=? ORDER BY city,slot',id)}
 function factor(plot,attacker){
  const geo=cityGeography[plot.city],cell=geo.cells[plot.slot%geo.count],central=Math.hypot(cell.x-450,cell.y-325)<120;
  const own=all('SELECT slot FROM city_territories WHERE city=? AND owner_id=?',plot.city,attacker);
  const adjacent=own.some(p=>{const c=geo.cells[p.slot%geo.count];return Math.hypot(c.x-cell.x,c.y-cell.y)<110});
  return (central?.70:1)*(adjacent?1.15:own.length?1:.65);
 }
 function captureTarget(attacker,target,body){
  sync(attacker);sync(target);const a=captureState(attacker),d=captureState(target);if(a.attemptUntil>clock())fail('Territory capture attempts have a one-hour cooldown.',429);if(a.successUntil>clock())fail('Only one successful territory capture per 24 hours.',409);if(a.captured>=10)fail('Your family already holds ten conquered territories worldwide.',409);if(d.shieldUntil>clock())fail('This family has a 24-hour territory recovery shield.',409);
  let plot;if(body.plotId!==undefined){if(!Number.isSafeInteger(body.plotId)||body.plotId<1)fail('Choose a map territory.');plot=q('SELECT * FROM city_territories WHERE id=?',body.plotId)}
  else plot=all('SELECT * FROM city_territories WHERE owner_id=? AND item_id=? ORDER BY id',target,body.itemId).find(p=>count(attacker,p.city)<30&&p.acquired_at+3600000<=clock());
  if(!plot||plot.owner_id!==target)fail('The rival no longer owns this territory.',409);
  if(count(attacker,plot.city)>=30)fail('Your family controls the maximum of thirty territories in this city.',409);
  if(plot.acquired_at+3600000>clock())fail('Newly acquired territory has one hour of protection.',409);
  const item=spec(plot.item_id),owned=q('SELECT quantity FROM family_assets WHERE family_id=? AND item_id=?',attacker,item.id)?.quantity||0;
  if(owned>=item.limit)fail('Your family has reached the worldwide limit for this territory type.',409);
  return {...item,plot,factor:factor(plot,attacker),captureCost:2500000};
 }
 function transfer(plot,attacker,target){
  if(!run('UPDATE city_territories SET owner_id=?,acquired_at=?,captured=1 WHERE id=? AND owner_id=?',attacker,clock(),plot.id,target).changes)fail('Territory ownership changed. Refresh the map.',409);
  run('INSERT INTO family_capture_state(family_id,success_until) VALUES(?,?) ON CONFLICT(family_id) DO UPDATE SET success_until=excluded.success_until',attacker,clock()+86400000);run('INSERT INTO family_capture_state(family_id,shield_until) VALUES(?,?) ON CONFLICT(family_id) DO UPDATE SET shield_until=excluded.shield_until',target,clock()+86400000);
  const old=q('SELECT quantity FROM family_assets WHERE family_id=? AND item_id=?',target,plot.item_id);
  if(old.quantity===1)run('DELETE FROM family_assets WHERE family_id=? AND item_id=?',target,plot.item_id);else run('UPDATE family_assets SET quantity=quantity-1 WHERE family_id=? AND item_id=?',target,plot.item_id);
  run('INSERT INTO family_assets VALUES(?,?,1) ON CONFLICT(family_id,item_id) DO UPDATE SET quantity=quantity+1',attacker,plot.item_id);
 }
 function buy(id,body){
  const u=settleRaw(id);available(u);const m=familyMember(id,true);sync(m.family_id);
  const city=body.city||cities.find(c=>c===u.city)||cities[0];if(!cities.includes(city))fail('Choose an airport city.');
  let ids=body.plotIds??(body.plotId!==undefined?[body.plotId]:null);
  if(!ids){const item=spec(body.id);if(!item)fail('Choose map territories.');const quantity=body.quantity==='max'?Math.max(0,20-count(m.family_id,city)):body.quantity??1;if(!Number.isSafeInteger(quantity)||quantity<1||quantity>25)fail('Invalid quantity.');ids=all('SELECT id FROM city_territories WHERE city=? AND item_id=? AND owner_id IS NULL ORDER BY id LIMIT ?',city,item.id,quantity).map(p=>p.id);if(body.quantity!=='max'&&ids.length!==quantity)fail('Not enough unclaimed territory in this city.',409)}
  if(!Array.isArray(ids)||!ids.length||ids.length>20||new Set(ids).size!==ids.length||ids.some(x=>!Number.isSafeInteger(x)||x<1))fail('Select one to twenty different territories.');
  if(count(m.family_id,city)+ids.length>20)fail('Only twenty territories per city may be bought. Capture to grow to thirty.',409);
  const plots=ids.map(id=>q('SELECT * FROM city_territories WHERE id=?',id));if(plots.some(p=>!p||p.city!==city||p.owner_id!==null))fail('A selected territory is unavailable. Refresh the map.',409);
  let cost=0;const quantities={};for(const p of plots){const item=spec(p.item_id),owned=quantities[item.id]??q('SELECT quantity FROM family_assets WHERE family_id=? AND item_id=?',m.family_id,item.id)?.quantity??0;if(owned>=item.limit)fail('Worldwide territory-type limit reached.',409);cost+=familyPrice(item,owned);quantities[item.id]=owned+1}
  familyDebit(m.family_id,cost);for(const p of plots){run('UPDATE city_territories SET owner_id=?,acquired_at=?,captured=0 WHERE id=? AND owner_id IS NULL',m.family_id,clock(),p.id);run('INSERT INTO family_assets VALUES(?,?,1) ON CONFLICT(family_id,item_id) DO UPDATE SET quantity=quantity+1',m.family_id,p.item_id)}
  familyLog(m.family_id,u.username+' acquired '+plots.map(p=>p.name).join(', ')+' in '+city+' for $'+cost+'.');return {ok:true,cost,quantity:plots.length,message:'Territory acquired in '+city+'. Ownership is visible on the city map.',image:spec(plots[0].item_id).image};
 }
 function captureState(id){const s=q('SELECT * FROM family_capture_state WHERE family_id=?',id);return {captured:q('SELECT COUNT(*) n FROM city_territories WHERE owner_id=? AND captured=1',id).n,limit:10,attemptUntil:s?.attempt_until||0,successUntil:s?.success_until||0,shieldUntil:s?.shield_until||0}}
 function recordAttempt(id){run('INSERT INTO family_capture_state(family_id,attempt_until) VALUES(?,?) ON CONFLICT(family_id) DO UPDATE SET attempt_until=excluded.attempt_until',id,clock()+3600000)}
 function captureChance(quote,p){return territoryCaptureChance(quote.attackPower,quote.defenderPower,quote.defense.reduction,factor(p,quote.familyId));}
 function view(id,city){
  if(!cities.includes(city))fail('Choose an airport city.');sync();const m=q('SELECT m.*,f.leader_id FROM family_members m JOIN families f ON f.id=m.family_id WHERE user_id=?',id),owned=m?holdings(m.family_id):[];
  return {serverTime:clock(),cities:cityMaps,city:cityMaps.find(c=>c.name===city),familyId:m?.family_id||null,capture:m?captureState(m.family_id):null,canManage:!!m&&(m.leader_id===id||m.family_role==='capo'),ownedInCity:owned.filter(p=>p.city===city).length,treasury:m?q('SELECT treasury FROM families WHERE id=?',m.family_id).treasury:0,holdings:owned,worldLimit:25,purchaseLimit:20,controlLimit:30,
   plots:all('SELECT p.*,f.name owner_name FROM city_territories p LEFT JOIN families f ON f.id=p.owner_id WHERE p.city=? ORDER BY slot',city).map(p=>({...p,relation:p.owner_id===null?'free':p.owner_id===m?.family_id?'own':m&&allied(db,m.family_id,p.owner_id)?'ally':'rival',recoveryUntil:p.owner_id?captureState(p.owner_id).shieldUntil:0,...{type:spec(p.item_id).name,image:spec(p.item_id).image,blocks:spec(p.item_id).blocks,defense:spec(p.item_id).defense,runBonus:spec(p.item_id).runBonus},price:familyPrice(spec(p.item_id),m?q('SELECT quantity FROM family_assets WHERE family_id=? AND item_id=?',m.family_id,p.item_id)?.quantity||0:0),captureFactor:m?factor(p,m.family_id):1,protectedUntil:p.acquired_at+3600000}))};
 }
 return {sync,holdings,factor,captureTarget,transfer,buy,view,captureState,recordAttempt,captureChance};
}
