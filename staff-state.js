import {createHash} from 'node:crypto';
import {MAX_CASH} from './money.js';
import {employees,coins} from './city-expansion.js';
import {artCatalog} from './art-market.js';
import {stolenVehicles} from './vehicle-catalog.js';
import {compoundUpgrades} from './crew-operations.js';
import {familyAssets} from './empire-catalog.js';
import {cityDrugMarkets} from './drug-markets.js';

// Staff-only editors: fixed tables and columns, scoped row ownership, optimistic locking.
export function installStaffState(db,{transaction,clock,settleRaw,log}){
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
 const num=(max=MAX_CASH,min=0)=>({type:'number',min,max});
 const options=xs=>({type:'select',options:xs.map(x=>typeof x==='string'?{id:x,name:x}:x)});
 const definitions={
  employees:{table:'employees',key:'item_id',fields:{item_id:options(employees),quantity:num(1000000000,1)}},
  crypto:{table:'crypto_wallet',key:'coin',fields:{coin:options(coins),quantity:num(100000000),basis:num(100000000)}},
  art:{table:'art_objects',key:'id',auto:true,where:" AND state='collection'",fields:{spec_id:options(artCatalog),authentic:num(1),condition:num(100,1),appraised:num(1)}},
  vehicles:{table:'vehicle_loot',key:'id',auto:true,where:" AND state IN ('stored','pending','transit')",fields:{vehicle_id:options(stolenVehicles),condition_stars:num(5,1),city:options(Object.keys(cityDrugMarkets))}},
  racing:{table:'race_profiles',key:'user_id',single:true,fields:{xp:num(1000000000),next_at:num(8640000000000000)}},
  income:{table:'income_cycles',key:'user_id',single:true,fields:{active_ms:num(86400000),pending_income:num()}},
  extensions:{table:'compound_upgrades',column:'family_id',key:'upgrade_id',fields:{upgrade_id:options(compoundUpgrades)}},
  territories:{table:'city_territories',column:'owner_id',key:'id',fields:{id:options([]),captured:num(1)}}
 };
 const column=d=>d.column||'user_id';
 function rows(section,id){const d=definitions[section];if(section==='income'){const u=q('SELECT pending_income FROM users WHERE id=?',id);return [{...(q('SELECT * FROM income_cycles WHERE user_id=?',id)||{user_id:id,active_ms:0}),...u}]}
  return all(`SELECT * FROM ${d.table} WHERE ${column(d)}=?${d.where||''} ORDER BY ${d.key}`,id);
 }
 const revision=(section,id)=>createHash('sha256').update(JSON.stringify(rows(section,id))).digest('hex');
 function locked(section,id,row){
  if(section==='art'&&q("SELECT 1 FROM art_auctions WHERE object_id=? AND state='open'",row.id))fail('This item is locked in an auction.',409);
  if(section==='vehicles'){
   if(row.state==='transit')fail('Wait until this shipment arrives before editing it.',409);
   if(q("SELECT 1 FROM vehicle_auctions WHERE vehicle_id=? AND state='open'",row.id)||q("SELECT 1 FROM race_entries WHERE user_id=? AND car_key=? AND state='pending'",id,'s:'+row.id))fail('This item is locked in an auction or race.',409);
  }
 }
 function territoryTotals(id){
  run("DELETE FROM family_assets WHERE family_id=? AND item_id IN (SELECT DISTINCT item_id FROM city_territories)",id);
  for(const r of all('SELECT item_id,COUNT(*) quantity FROM city_territories WHERE owner_id=? GROUP BY item_id',id))run('INSERT INTO family_assets VALUES(?,?,?)',id,r.item_id,r.quantity);
 }
 function save(section,id,b){
  const d=definitions[section],before=rows(section,id),old=before.find(r=>String(r[d.key])===String(b.rowId));
  if(b.operation==='delete'){
   if(d.single||!old)fail('Choose an existing item.');locked(section,id,old);
   if(section==='territories'){run('UPDATE city_territories SET owner_id=NULL,acquired_at=0,captured=0 WHERE id=? AND owner_id=?',old.id,id);territoryTotals(id)}
   else if(section==='art')run("UPDATE art_objects SET state='removed' WHERE id=? AND user_id=?",old.id,id);
   else if(section==='vehicles')run("UPDATE vehicle_loot SET state='sold' WHERE id=? AND user_id=?",old.id,id);
   else run(`DELETE FROM ${d.table} WHERE ${column(d)}=? AND ${d.key}=?`,id,old[d.key]);
   return;
  }
  if(b.operation!=='save'||!b.values||typeof b.values!=='object'||Array.isArray(b.values))fail('Invalid administrative edit.');
  const v=b.values;
  if(Object.keys(v).some(k=>!Object.hasOwn(d.fields,k))||Object.keys(d.fields).some(k=>!Object.hasOwn(v,k)))fail('Invalid administrative fields.');
  for(const [k,f] of Object.entries(d.fields)){
   if(f.type==='number'&&(!Number.isSafeInteger(v[k])||v[k]<f.min||v[k]>f.max))fail('Invalid administrative value.');
   if(f.type==='select'&&section!=='territories'&&!f.options.some(o=>o.id===v[k]))fail('Unknown catalog item.');
  }
  if(b.rowId!==undefined&&!old)fail('Item not found in this account.',404);
  if(old)locked(section,id,old);
  if(section==='employees'){
   if(v.quantity>employees.find(e=>e.id===v.item_id).limit)fail('Employee limit exceeded.');
   if(old&&old.item_id!==v.item_id)fail('The item type cannot be changed.');
   run('INSERT INTO employees(user_id,item_id,quantity,income_at) VALUES(?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET quantity=excluded.quantity,income_at=excluded.income_at',id,v.item_id,v.quantity,clock());
  }
  if(section==='crypto'){
   if(old&&old.coin!==v.coin)fail('The item type cannot be changed.');
   if(!v.quantity&&v.basis)fail('An empty holding must have zero cost basis.');
   run('INSERT INTO crypto_wallet VALUES(?,?,?,?) ON CONFLICT(user_id,coin) DO UPDATE SET quantity=excluded.quantity,basis=excluded.basis',id,v.coin,v.quantity,v.basis);
  }
  if(section==='art'){
   if(!old&&q("SELECT COUNT(*) n FROM art_objects WHERE user_id=? AND state IN ('collection','auction')",id).n+q("SELECT COUNT(*) n FROM art_auctions WHERE bidder_id=? AND state='open'",id).n>=100)fail('Art collection capacity exceeded.');
   if(old&&old.spec_id!==v.spec_id)fail('The item type cannot be changed.');
   const value=Math.floor(artCatalog.find(a=>a.id===v.spec_id).value*v.condition/100*(v.authentic?1:.08));
   if(old)run('UPDATE art_objects SET authentic=?,condition=?,estimated_value=?,appraised=? WHERE id=? AND user_id=?',v.authentic,v.condition,value,v.appraised,old.id,id);
   else run('INSERT INTO art_objects(user_id,spec_id,authentic,condition,estimated_value,appraised,created_at) VALUES(?,?,?,?,?,?,?)',id,v.spec_id,v.authentic,v.condition,value,v.appraised,clock());
  }
  if(section==='vehicles'){
   if(old&&old.vehicle_id!==v.vehicle_id)fail('The item type cannot be changed.');
   if(!old){const capacity=(q("SELECT quantity FROM possessions WHERE user_id=? AND item_id='vehicle-warehouse'",id)?.quantity||0)*20;
    const stored=q("SELECT COUNT(*) n FROM vehicle_loot WHERE user_id=? AND state IN ('stored','transit')",id).n;
    const reserved=q("SELECT COUNT(*) n FROM vehicle_auctions WHERE bidder_id=? AND state='open'",id).n;
    if(stored+reserved>=capacity)fail('Vehicle warehouse capacity exceeded.');
    run("INSERT INTO vehicle_loot(user_id,vehicle_id,city,state,created_at,condition_stars) VALUES(?,?,?,'stored',?,?)",id,v.vehicle_id,v.city,clock(),v.condition_stars);
   }else run('UPDATE vehicle_loot SET condition_stars=?,city=? WHERE id=? AND user_id=?',v.condition_stars,v.city,old.id,id);
  }
  if(section==='racing')run('INSERT INTO race_profiles VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET xp=excluded.xp,next_at=excluded.next_at',id,v.xp,v.next_at);
  if(section==='income'){
   run('INSERT INTO income_cycles VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET started_at=excluded.started_at,last_at=excluded.last_at,active_ms=excluded.active_ms',id,clock()-v.active_ms,clock(),v.active_ms);
   run('UPDATE users SET pending_income=?,income_claim_at=? WHERE id=?',v.pending_income,clock()-v.active_ms,id);
  }
  if(section==='extensions'){
   if(!all('SELECT item_id FROM family_assets WHERE family_id=?',id).some(a=>familyAssets.find(s=>s.id===a.item_id)?.category==='Compounds'))fail('A master compound is required.');
   if(old&&old.upgrade_id!==v.upgrade_id)fail('The item type cannot be changed.');
   run('INSERT OR IGNORE INTO compound_upgrades VALUES(?,?,?)',id,v.upgrade_id,clock());
  }
  if(section==='territories'){
   const plot=q('SELECT * FROM city_territories WHERE id=?',Number(v.id));
   if(!plot)fail('Territory not found.',404);
   if(plot.owner_id&&plot.owner_id!==id)fail('Release this territory from its current family first.',409);
   if(old&&old.id!==plot.id)fail('The item type cannot be changed.');
   const counts=q('SELECT COUNT(*) total,SUM(captured) captured,SUM(city=?) city,SUM(city=? AND captured=0) purchased,SUM(item_id=?) kind FROM city_territories WHERE owner_id=? AND id<>?',plot.city,plot.city,plot.item_id,id,plot.id);
   if(counts.city>=30||(!v.captured&&counts.purchased>=20)||(v.captured&&counts.captured>=10)||counts.kind>=(familyAssets.find(a=>a.id===plot.item_id)?.limit||25))fail('Territory ownership limit exceeded.');
   run('UPDATE city_territories SET owner_id=?,captured=?,acquired_at=? WHERE id=?',id,v.captured,clock(),plot.id);territoryTotals(id);
  }
 }
 function route(req,path,b,user){
  if(path!=='/api/admin/state')return null;
  if(!['owner','admin'].includes(user.role))fail('Staff access required.',403);
  const p=new URL(req.url,'http://localhost').searchParams,scope=req.method==='GET'?p.get('scope'):b.scope,id=Number(req.method==='GET'?p.get('id'):b.targetId);
  if(!['personal','family'].includes(scope)||!Number.isSafeInteger(id)||id<1)fail('Invalid account.');
  const target=q(`SELECT * FROM ${scope==='personal'?'users':'families'} WHERE id=?`,id);
  if(!target||target.deleted_at)fail('Account not found.',404);
  if(scope==='personal'&&user.role==='admin'&&target.role==='owner')fail('Owner accounts are protected.',403);
  const sections=scope==='personal'?['employees','crypto','art','vehicles','racing','income']:['extensions','territories'];
  if(req.method==='GET')return {sections:sections.map(section=>{const d=definitions[section],fields=structuredClone(d.fields);if(section==='territories')fields.id=options(all('SELECT id,city,slot,owner_id FROM city_territories ORDER BY city,slot').filter(r=>!r.owner_id||r.owner_id===id).map(r=>({id:r.id,name:r.city+' · #'+(r.slot+1)})));return {section,key:d.key,single:!!d.single,auto:!!d.auto,fields,rows:rows(section,id),revision:revision(section,id)}})};
  if(req.method!=='POST')fail('Unsupported request.',405);
  if(!sections.includes(b.section)||typeof b.reason!=='string'||b.reason.trim().length<3||b.reason.length>500)fail('Choose a section and enter a reason.');
  return transaction(()=>{
   if(b.revision!==revision(b.section,id))fail('This account changed. Reload before saving.',409);
   const before=rows(b.section,id);
   if(scope==='personal')settleRaw(id,clock(),false);
   save(b.section,id,b);
   const details=JSON.stringify({section:b.section,reason:b.reason.trim(),before,after:rows(b.section,id),note:'Administrative edit. No funds moved.'});
   run(`INSERT INTO ${scope==='personal'?'owner_audit':'family_audit'}(actor_id,${scope==='personal'?'target_id':'family_id'},details,created_at) VALUES(?,?,?,?)`,user.id,id,details,clock());
   log(user.id,'Staff updated '+scope+' #'+id+' · '+b.section+'.');return {ok:true};
  });
 }
 return {route};
}
