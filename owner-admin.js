import {MAX_XP} from './money.js';
import {isStaff} from './staff.js';
import {familyCapacity} from './community.js';
import {familyAssets,careerRanks,MAX_CASH} from './empire-catalog.js';
import {career} from './empire-catalog.js';

export function installOwnerAdmin(db,{transaction,log,syncTerritory=()=>{}}){
 const q=(sql,...args)=>db.prepare(sql).get(...args),all=(sql,...args)=>db.prepare(sql).all(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
 const integer=(v,max=MAX_CASH)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 db.exec('CREATE TABLE IF NOT EXISTS family_audit(id INTEGER PRIMARY KEY,actor_id INTEGER NOT NULL REFERENCES users(id),family_id INTEGER NOT NULL REFERENCES families(id),details TEXT NOT NULL,created_at INTEGER NOT NULL)');
 const positions=(scope,id)=>all('SELECT * FROM investments WHERE '+(scope==='personal'?'user_id':'family_id')+'=? ORDER BY id DESC LIMIT 100',id);
 function familySnapshot(id){
  const family=q('SELECT * FROM families WHERE id=?',id);if(!family)fail('Family not found.',404);
  return {family,don:q('SELECT username FROM users WHERE id=?',family.leader_id).username,
   members:all("SELECT u.id,u.username,m.family_role,COALESCE(c.total,'0') donated FROM family_members m JOIN users u ON u.id=m.user_id LEFT JOIN family_contributions c ON c.user_id=m.user_id AND c.family_id=m.family_id WHERE m.family_id=? ORDER BY u.username",id),
   assets:all('SELECT item_id,quantity FROM family_assets WHERE family_id=?',id)};
 }
 function saveFamily(actor,body){
  if(!integer(body.id)||body.id<1||!body.changes||typeof body.changes!=='object'||Array.isArray(body.changes))fail('Invalid family edit.');
  const c=body.changes,numeric={treasury:MAX_CASH,drugs_xp:MAX_XP,guns_xp:MAX_XP,created_at:8640000000000000,shield_until:8640000000000000,guard_until:8640000000000000,raid_until:8640000000000000};
  for(const key of Object.keys(c))if(![...Object.keys(numeric),'name','don','members','assets'].includes(key))fail('Unknown family field: '+key);
  return transaction(()=>{
   const before=familySnapshot(body.id);
   for(const [field,value] of Object.entries(c)){
    if(field in numeric){if(!integer(value,numeric[field]))fail('Invalid '+field);run('UPDATE families SET '+field+'=? WHERE id=?',value,body.id)}
    if(field==='name'){if(typeof value!=='string'||! /^[a-zA-Z0-9 _-]{3,30}$/.test(value))fail('Invalid family name.');run('UPDATE families SET name=? WHERE id=?',value,body.id)}
   }
   const donName=c.don??before.don;if(typeof donName!=='string')fail('Enter the Don’s username.');const don=q('SELECT id FROM users WHERE deleted_at=0 AND username=?',donName);if(!don)fail('The Don must be an existing player.');
   const members=c.members??before.members.map(m=>({username:m.username,role:m.family_role,donated:m.donated}));
   if(!Array.isArray(members)||members.length<1||members.length>50)fail('Use 1–50 family members.');
   const ids=new Set(),validated=[];
   for(const m of members){
    if(!m||typeof m.username!=='string'||!['member','soldier','enforcer','consigliere','underboss','capo'].includes(m.role)||typeof m.donated!=='string'||!/^\d{1,60}$/.test(m.donated))fail('Each member needs a username, member/capo role and non-negative donation total.');
    const u=q('SELECT id FROM users WHERE deleted_at=0 AND username=?',m.username);if(!u||ids.has(u.id))fail('Unknown or duplicate family member.');
    if(q('SELECT 1 FROM families WHERE leader_id=? AND id<>?',u.id,body.id))fail(m.username+' leads another family. Change that family’s Don first.');
    ids.add(u.id);validated.push({...m,id:u.id});
   }
   if(!ids.has(don.id))fail('Include the Don in the member list.');
   run('UPDATE families SET leader_id=? WHERE id=?',don.id,body.id);
   run('DELETE FROM family_members WHERE family_id=?',body.id);
   for(const m of validated){run('INSERT INTO family_members(user_id,family_id,family_role) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET family_id=excluded.family_id,family_role=excluded.family_role',m.id,body.id,m.id===don.id?'member':m.role);run('INSERT INTO family_contributions(user_id,family_id,total) VALUES(?,?,?) ON CONFLICT(user_id,family_id) DO UPDATE SET total=excluded.total',m.id,body.id,BigInt(m.donated).toString());}
   if('assets' in c){
    if(!Array.isArray(c.assets)||c.assets.length>familyAssets.length)fail('Invalid assets.');const seen=new Set();
    for(const a of c.assets){const spec=familyAssets.find(x=>x.id===a?.item_id);if(!spec||!integer(a.quantity,spec.limit)||a.quantity<1||seen.has(a.item_id))fail('Invalid or duplicate family asset.');seen.add(a.item_id)}
    if(c.assets.filter(a=>familyAssets.find(x=>x.id===a.item_id)?.category==='Compounds').length>1)fail('A family may own only one master compound.');run('DELETE FROM family_assets WHERE family_id=?',body.id);for(const a of c.assets)run('INSERT INTO family_assets VALUES(?,?,?)',body.id,a.item_id,a.quantity);
   }
   if(validated.length>familyCapacity(db,body.id))fail('Member count exceeds this family’s rank and compound capacity.',409);
   syncTerritory(body.id);const after=familySnapshot(body.id);run('INSERT INTO family_audit(actor_id,family_id,details,created_at) VALUES(?,?,?,?)',actor,body.id,JSON.stringify({before,after}),Date.now());run('INSERT INTO family_events(family_id,message,created_at) VALUES(?,?,?)',body.id,'Owner updated family settings, membership or holdings.',Date.now());log(actor,'Owner updated family '+after.family.name+'.');return {ok:true};
  });
 }
 function saveInvestment(actor,body){
  if(!['personal','family'].includes(body.scope)||!integer(body.targetId)||body.targetId<1)fail('Choose an investment account.');
  const column=body.scope==='personal'?'user_id':'family_id';if(!q('SELECT id FROM '+(body.scope==='personal'?'users':'families')+' WHERE id=?',body.targetId))fail('Account not found.',404);
  return transaction(()=>{
   const before=body.id?q('SELECT * FROM investments WHERE id=? AND '+column+'=?',body.id,body.targetId):null;
   if(body.id&&!before)fail('Investment not found.',404);
   let after=null;
   if(body.operation==='delete'){
    if(!before)fail('Choose an existing investment.');run('DELETE FROM investments WHERE id=?',before.id);
   }else{
    if(body.operation!=='save')fail('Unknown investment operation.');const c=body.changes;
    if(!c||!integer(c.principal,1000000000)||c.principal<1||!integer(c.rateBps,800)||!integer(c.openedAt,8640000000000000)||!integer(c.maturesAt,8640000000000000)||c.maturesAt<c.openedAt||c.maturesAt-c.openedAt>72*3600000||![0,1].includes(c.claimed))fail('Invalid investment: positive principal, rate 0–8%, term up to 72 hours and valid claim state required.');
    const active=q('SELECT COALESCE(SUM(principal),0) n FROM investments WHERE '+column+'=? AND claimed=0 AND id<>?',body.targetId,before?.id||0).n;if(!c.claimed&&active+c.principal>1000000000)fail('Active principal would exceed $1 billion.',409);
    let id=before?.id;
    if(id)run('UPDATE investments SET principal=?,rate_bps=?,opened_at=?,matures_at=?,claimed=? WHERE id=?',c.principal,c.rateBps,c.openedAt,c.maturesAt,c.claimed,id);
    else id=Number(run('INSERT INTO investments('+column+',principal,rate_bps,opened_at,matures_at,claimed) VALUES(?,?,?,?,?,?)',body.targetId,c.principal,c.rateBps,c.openedAt,c.maturesAt,c.claimed).lastInsertRowid);
    after=q('SELECT * FROM investments WHERE id=?',id);
   }
   const details=JSON.stringify({investment:{before,after},note:'Administrative edit. No funds moved.'});
   if(body.scope==='family')run('INSERT INTO family_audit(actor_id,family_id,details,created_at) VALUES(?,?,?,?)',actor,body.targetId,details,Date.now());
   else run('INSERT INTO owner_audit(actor_id,target_id,details,created_at) VALUES(?,?,?,?)',actor,body.targetId,details,Date.now());
   log(actor,'Owner edited an investment for '+body.scope+' #'+body.targetId+'. No funds moved.');return {ok:true};
  });
 }
 function route(req,path,body,user){
  const routes=['/api/admin/families','/api/admin/family','/api/admin/investments','/api/admin/investment'];if(!routes.includes(path))return null;
  if(!isStaff(user))fail('Staff access required',403);
  const url=new URL(req.url||path,'http://localhost');
  if(path==='/api/admin/families'&&req.method==='GET')return {families:all('SELECT f.*,u.username don,(SELECT COUNT(*) FROM family_members WHERE family_id=f.id) member_count FROM families f JOIN users u ON u.id=f.leader_id WHERE f.name LIKE ? ORDER BY f.id DESC','%'+(url.searchParams.get('search')||'')+'%').map(f=>({...f,drugs:career('drugs',f.drugs_xp),guns:career('guns',f.guns_xp)}))};
  if(path==='/api/admin/family'&&req.method==='GET'){
   const id=Number(url.searchParams.get('id'));if(!integer(id)||id<1)fail('Invalid family ID');return {...familySnapshot(id),catalog:familyAssets,careerRanks,investments:positions('family',id),audit:all('SELECT a.*,u.username actor FROM family_audit a JOIN users u ON u.id=a.actor_id WHERE family_id=? ORDER BY a.id DESC LIMIT 30',id)};
  }
  if(path==='/api/admin/family'&&req.method==='POST')return saveFamily(user.id,body);
  if(path==='/api/admin/investments'&&req.method==='GET'){
   const scope=url.searchParams.get('scope'),id=Number(url.searchParams.get('id'));if(!['personal','family'].includes(scope)||!integer(id)||id<1)fail('Invalid account');return {investments:positions(scope,id)};
  }
  if(path==='/api/admin/investment'&&req.method==='POST')return saveInvestment(user.id,body);
  fail('Unsupported Owner request.',405);
 }
 return {route};
}
