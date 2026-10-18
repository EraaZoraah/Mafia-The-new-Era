import {assertHostile,installDiplomacy,succeedDon} from './diplomacy.js';
import {cities} from './logistics.js';

export function installFamilyCommand(db,{clock,transaction,familyMember,fail,wars,familyArt=()=>({})}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS family_chat(id INTEGER PRIMARY KEY,family_id INTEGER NOT NULL REFERENCES families(id),user_id INTEGER NOT NULL REFERENCES users(id),body TEXT NOT NULL,request_key TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(user_id,request_key));
 CREATE INDEX IF NOT EXISTS family_chat_feed ON family_chat(family_id,id);
 CREATE TABLE IF NOT EXISTS family_plans(id INTEGER PRIMARY KEY,family_id INTEGER NOT NULL REFERENCES families(id),target_id INTEGER NOT NULL REFERENCES families(id),created_by INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,city TEXT NOT NULL,plot_id INTEGER REFERENCES city_territories(id),scheduled_at INTEGER NOT NULL,notes TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'planned',created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS family_plan_members(plan_id INTEGER NOT NULL REFERENCES family_plans(id),user_id INTEGER NOT NULL REFERENCES users(id),PRIMARY KEY(plan_id,user_id));`);
 const number=n=>Number.isSafeInteger(n)&&n>0;
 const kinds=['raid','sabotage','capture','joint assault'];
 function planData(body,familyId){
  assertHostile(db,familyId,Number(body.targetId)||0);
  if(!number(body.targetId)||body.targetId===familyId||!q('SELECT id FROM families WHERE id=?',body.targetId))fail('Choose another family.');
  if(!kinds.includes(body.kind)||!cities.includes(body.city))fail('Choose an operation and airport city.');
  if(!number(body.scheduledAt)||body.scheduledAt<clock()||body.scheduledAt>clock()+7*86400000)fail('Schedule the attack within the next seven days.');
  if(typeof body.notes!=='string'||body.notes.length>1000)fail('Plan notes may contain up to 1,000 characters.');
  const plot=body.plotId===null||body.plotId===undefined?null:body.plotId;
  if(body.kind==='capture'&&plot===null)fail('Choose the territory to capture.');
  if(plot!==null&&(!number(plot)||!q('SELECT id FROM city_territories WHERE id=? AND city=? AND owner_id=?',plot,body.city,body.targetId)))fail('The selected territory does not belong to this rival in this city.');
  return [body.targetId,body.kind,body.city,plot,body.scheduledAt,body.notes.trim()];
 }
 function route(method,path,body,user,url){
  if(!['/api/family/chat','/api/family/chat/send','/api/family/plans','/api/family/plans/save','/api/family/plans/status','/api/family/plans/join','/api/family/plans/leave'].includes(path))return null;
  return transaction(()=>{
   const m=familyMember(user.id),fid=m.family_id,manager=m.leader_id===user.id||m.family_role==='capo';
   if(method==='GET'&&path==='/api/family/chat'){
    const params=new URL(url,'http://localhost').searchParams,after=Number(params.get('after')||0),before=Number(params.get('before')||0);
    if(!Number.isSafeInteger(after)||after<0||!Number.isSafeInteger(before)||before<0)fail('Invalid message cursor.');
    const messages=after?all('SELECT c.*,u.username FROM family_chat c JOIN users u ON u.id=c.user_id WHERE c.family_id=? AND c.id>? ORDER BY c.id LIMIT 100',fid,after):all('SELECT c.*,u.username FROM family_chat c JOIN users u ON u.id=c.user_id WHERE c.family_id=? AND (?=0 OR c.id<?) ORDER BY c.id DESC LIMIT 100',fid,before,before).reverse();
    return {familyId:fid,messages,serverTime:clock()};
   }
   if(method==='GET'&&path==='/api/family/plans')return {serverTime:clock(),canManage:manager,cities,kinds,rivals:all('SELECT id,name FROM families WHERE id<>? ORDER BY name',fid),plans:all('SELECT p.*,f.name target_name,u.username commander FROM family_plans p JOIN families f ON f.id=p.target_id JOIN users u ON u.id=p.created_by WHERE p.family_id=? ORDER BY CASE WHEN p.status=\'planned\' THEN 0 ELSE 1 END,p.scheduled_at LIMIT 60',fid).map(p=>({...p,...familyArt(p.target_id,p.plot_id),members:all('SELECT u.id,u.username FROM family_plan_members pm JOIN users u ON u.id=pm.user_id JOIN family_members fm ON fm.user_id=u.id WHERE pm.plan_id=? AND fm.family_id=?',p.id,fid)}))};
   if(method!=='POST')fail('Method not allowed.',405);
   if(path==='/api/family/chat/send'){
    if(typeof body.text!=='string'||!body.text.trim()||body.text.length>1000)fail('Write a message of 1–1,000 characters.');
    if(typeof body.key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.key))fail('Invalid message request.');
    const old=q('SELECT * FROM family_chat WHERE user_id=? AND request_key=?',user.id,body.key);
    if(old){if(old.family_id!==fid||old.body!==body.text.trim())fail('Message request was already used.',409);return {ok:true,id:old.id}}
    const last=q('SELECT MAX(created_at) at FROM family_chat WHERE user_id=?',user.id)?.at;if(last&&last>clock()-3000)fail('Wait three seconds between messages.',429);
    const r=run('INSERT INTO family_chat(family_id,user_id,body,request_key,created_at) VALUES(?,?,?,?,?)',fid,user.id,body.text.trim(),body.key,clock());return {ok:true,id:Number(r.lastInsertRowid)};
   }
   if(path==='/api/family/plans/save'){
    familyMember(user.id,true);const data=planData(body,fid);
    if(body.id!==undefined){if(!number(body.id)||!q("SELECT id FROM family_plans WHERE id=? AND family_id=? AND status='planned'",body.id,fid))fail('This plan is unavailable.',404);run('UPDATE family_plans SET target_id=?,kind=?,city=?,plot_id=?,scheduled_at=?,notes=? WHERE id=?',...data,body.id);run('DELETE FROM family_plan_members WHERE plan_id=?',body.id);return {ok:true,message:'Plan updated. Members must volunteer again for the revised operation.'}}
    if(q("SELECT COUNT(*) n FROM family_plans WHERE family_id=? AND status='planned'",fid).n>=10)fail('Finish or cancel an existing plan before creating another.',409);
    const r=run('INSERT INTO family_plans(family_id,target_id,kind,city,plot_id,scheduled_at,notes,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)',fid,...data,user.id,clock());
    wars.inform(fid,'New attack plan',user.username+' planned '+body.kind+' against '+q('SELECT name FROM families WHERE id=?',body.targetId).name+'. Open Attack planning to volunteer.');return {ok:true,id:Number(r.lastInsertRowid),message:'Attack planned. This does not automatically declare war, spend resources or launch an attack.'};
   }
   if(!number(body.id))fail('Choose a plan.');const p=q('SELECT * FROM family_plans WHERE id=? AND family_id=?',body.id,fid);if(!p)fail('Plan not found.',404);
   if(p.status!=='planned')fail('This plan is closed.',409);
   if(path.endsWith('/join')){if(p.scheduled_at<clock())fail('The scheduled time has passed. Ask a commander to reschedule.',409);run('INSERT OR IGNORE INTO family_plan_members VALUES(?,?)',p.id,user.id);return {ok:true,message:'You volunteered. Join the live assault team separately before launch.'}}
   if(path.endsWith('/leave')){run('DELETE FROM family_plan_members WHERE plan_id=? AND user_id=?',p.id,user.id);return {ok:true,message:'You left this plan.'}}
   if(path.endsWith('/status')){familyMember(user.id,true);if(!['completed','cancelled'].includes(body.status))fail('Choose completed or cancelled.');run('UPDATE family_plans SET status=? WHERE id=?',body.status,p.id);return {ok:true,message:'Plan marked '+body.status+'. This is a planning status, not a battle result.'}}
   fail('Unknown command.',404);
  });
 }
 return {route};
}
