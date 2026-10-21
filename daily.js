import {MAX_CASH} from './money.js';
import {isStaff} from './staff.js';
export const dailyJobs=[
 {id:'streets',name:'Work the streets',kind:'crime',target:5,cash:15000,xp:200,image:'/images/daily-streets.png',description:'Attempt five crimes. Successful and failed attempts count.'},
 {id:'shipment',name:'Keep the goods moving',kind:'shipment',target:1,cash:20000,xp:300,image:'/images/daily-shipment.png',description:'Complete one shipment attempt, personally or for your family.'},
 {id:'respect',name:'Make connections',kind:'respect',target:3,cash:10000,xp:100,image:'/images/daily-respect.png',description:'Give respect to three different players.'},
 {id:'professional',name:'A clean operation',kind:'crime',successOnly:true,target:3,cash:22500,xp:240,image:'/images/daily-professional.png',description:'Succeed at three crimes. Failed attempts do not count.'},
 {id:'supply-line',name:'Build a supply line',kind:'shipment',target:3,cash:35000,xp:400,image:'/images/daily-supply-line.png',description:'Attempt three shipments, personally or for your family. Also advances Keep the goods moving.'},
 {id:'contact',name:'Answer the call',kind:'contact mission',target:1,cash:30000,xp:320,image:'/images/daily-contact.png',description:'Accept and attempt one mysterious contact mission when an invitation arrives. Declining does not count.'}
];
export function installDaily(db,{marriageBonus=()=>1,transaction,clock,fail,settleRaw,available,promote,notify,log}){
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 db.exec(`CREATE TABLE IF NOT EXISTS daily_claims(user_id INTEGER REFERENCES users(id),day TEXT NOT NULL,job TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(user_id,day,job));
 CREATE INDEX IF NOT EXISTS daily_history ON operation_history(user_id,created_at,kind);
 CREATE TABLE IF NOT EXISTS bulletins(id INTEGER PRIMARY KEY AUTOINCREMENT,author_id INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL,starts_at INTEGER NOT NULL,ends_at INTEGER NOT NULL,popup INTEGER NOT NULL,revision INTEGER NOT NULL DEFAULT 1,updated_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS bulletin_deliveries(user_id INTEGER REFERENCES users(id),bulletin_id INTEGER REFERENCES bulletins(id),revision INTEGER NOT NULL,PRIMARY KEY(user_id,bulletin_id,revision));`);
 const day=()=>new Date(clock()).toISOString().slice(0,10);
 function board(id){const today=day(),start=Date.parse(today+'T00:00:00Z');return {day:today,resetsAt:start+86400000,jobs:dailyJobs.map(j=>({...j,cash:Math.floor(j.cash*marriageBonus(id)),xp:Math.floor(j.xp*marriageBonus(id)),progress:Math.min(j.target,j.kind==='respect'?q('SELECT COUNT(*) n FROM respect_gifts WHERE sender_id=? AND day=?',id,today).n:q('SELECT COUNT(*) n FROM operation_history WHERE user_id=? AND kind=? AND created_at>=? AND created_at<? AND (?=0 OR success=1)',id,j.kind,start,start+86400000,j.successOnly?1:0).n),claimed:!!q('SELECT 1 FROM daily_claims WHERE user_id=? AND day=? AND job=?',id,today,j.id)}))};}
 const live=()=>all("SELECT b.*,u.username author FROM bulletins b JOIN users u ON u.id=b.author_id WHERE b.status='published' AND b.starts_at<=? AND b.ends_at>? ORDER BY b.starts_at DESC,b.id DESC",clock(),clock()).map(b=>({...b,releaseId:b.revision===1&&q("SELECT 1 FROM sqlite_master WHERE name='release_announcements'")?q('SELECT release_id FROM release_announcements WHERE bulletin_id=?',b.id)?.release_id:null,systemKind:q("SELECT value FROM settings WHERE key='referral-beta-announcement'")?.value===String(b.id)?'beta':q("SELECT 1 FROM sqlite_master WHERE name='season_announcements'")&&q('SELECT 1 FROM season_announcements WHERE bulletin_id=?',b.id)?'season':q("SELECT value FROM care_meta WHERE key='beta-announcement-id'")?.value===String(b.id)&&b.revision===1?'beta':''}));
 function deliver(id){transaction(()=>{for(const b of live().filter(b=>b.popup)){if(q('SELECT 1 FROM bulletin_deliveries WHERE user_id=? AND bulletin_id=? AND revision=?',id,b.id,b.revision))continue;run('INSERT INTO bulletin_deliveries VALUES(?,?,?)',id,b.id,b.revision);notify(id,(b.kind==='event'?'Event: ':'Announcement: ')+b.title,b.body,'/images/scene-messages.jpg',b.systemKind);}});}
 function save(user,b){return transaction(()=>{
  if(!isStaff(user))fail('Staff access required',403);
  if(b.id!==undefined&&(!Number.isSafeInteger(b.id)||b.id<1))fail('Invalid announcement ID');
  const old=b.id?q('SELECT * FROM bulletins WHERE id=?',b.id):null;if(b.id&&!old)fail('Announcement not found',404);
  if(old&&q("SELECT 1 FROM sqlite_master WHERE name='season_announcements'")&&q('SELECT 1 FROM season_announcements WHERE bulletin_id=?',old.id))fail('Automatic season events are managed by the season system.',403);
  if(old&&b.revision!==old.revision)fail('This announcement was edited elsewhere. Reload before saving.',409);
  if(!['announcement','event'].includes(b.kind)||!['draft','published','archived'].includes(b.status)||typeof b.title!=='string'||b.title.trim().length<3||b.title.length>100||typeof b.body!=='string'||!b.body.trim()||b.body.length>3000||typeof b.popup!=='boolean')fail('Provide a title (3–100 characters), message (1–3,000 characters), valid type and status.');
  if(!Number.isSafeInteger(b.startsAt)||!Number.isSafeInteger(b.endsAt)||b.startsAt<0||b.endsAt<=b.startsAt||b.endsAt>8640000000000000)fail('End time must be after the start time.');
  if(b.status==='published'&&b.endsAt<=clock())fail('A published message must end in the future.');
  const v=[b.kind,b.title.trim(),b.body.trim(),b.status,b.startsAt,b.endsAt,b.popup?1:0,clock()];let id=b.id;
  if(old)run('UPDATE bulletins SET kind=?,title=?,body=?,status=?,starts_at=?,ends_at=?,popup=?,updated_at=?,revision=revision+1 WHERE id=?',...v,id);
  else id=Number(run('INSERT INTO bulletins(kind,title,body,status,starts_at,ends_at,popup,updated_at,author_id) VALUES(?,?,?,?,?,?,?,?,?)',...v,user.id).lastInsertRowid);
  run('INSERT INTO owner_audit(actor_id,target_id,details,created_at) VALUES(?,?,?,?)',user.id,user.id,JSON.stringify({bulletin:id,before:old,after:q('SELECT * FROM bulletins WHERE id=?',id)}),clock());
  return {ok:true,id,message:'Announcement saved. Scheduled messages become visible automatically during their publication period.'};
 });}
 function route(req,path,b,u){
  if(req.method==='GET'&&path==='/api/notifications')deliver(u.id);
  if(req.method==='GET'&&path==='/api/daily')return board(u.id);
  if(req.method==='POST'&&path==='/api/daily/claim')return transaction(()=>{const player=settleRaw(u.id);available(player);const data=board(u.id);if(b.day!==data.day)fail('A new day has started. Refresh your daily objectives.',409);const job=data.jobs.find(j=>j.id===b.job);if(!job)fail('Unknown daily objective');if(job.claimed)fail('Reward already claimed.',409);if(job.progress<job.target)fail('Complete this objective first.',409);if(player.cash+job.cash>MAX_CASH||player.xp+job.xp>1e12)fail('Make room for the full reward before claiming.',409);run('INSERT INTO daily_claims VALUES(?,?,?,?)',u.id,data.day,job.id,clock());run('UPDATE users SET cash=cash+?,xp=xp+? WHERE id=?',job.cash,job.xp,u.id);promote(u.id,player.xp);log(u.id,'Daily objective completed: '+job.name+'.');return {success:true,reward:job.cash,xp:job.xp,image:job.image,message:'Daily reward claimed: '+job.name+'.'};});
  if(req.method==='GET'&&path==='/api/bulletins')return {entries:live(),serverTime:clock()};
  if(path==='/api/admin/bulletins'){if(!isStaff(u))fail('Staff access required',403);if(req.method==='GET')return {entries:all('SELECT b.*,u.username author,(SELECT season_id FROM season_announcements s WHERE s.bulletin_id=b.id) system_season FROM bulletins b JOIN users u ON u.id=b.author_id ORDER BY b.id DESC'),serverTime:clock()};if(req.method==='POST')return save(u,b);}
  return null;
 }
 return {route};
}
