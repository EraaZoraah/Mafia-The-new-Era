import {compoundUpgrades} from './crew-operations.js';
import {career,familyAssets} from './empire-catalog.js';
export const familyCrests=['lion','serpent','eagle','trident','bull','dragon','crown','wolf'];
export function familyCapacity(db,id){
 const f=db.prepare('SELECT * FROM families WHERE id=?').get(id);if(!f)return 0;
 const level=Math.floor((career('drugs',f.drugs_xp).level+career('guns',f.guns_xp).level)/2),base=15+Math.floor(15*(1.18**(level-1)-1)/(1.18**14-1)+1e-9),assets=db.prepare('SELECT item_id FROM family_assets WHERE family_id=?').all(id),bonus=assets.some(x=>x.item_id==='compound-castle')?35:assets.some(x=>x.item_id==='compound-palace')?20:assets.some(x=>x.item_id==='compound-estate')?7:assets.some(x=>x.item_id==='compound-yard')?2:0;
 return Math.min(50,base+bonus);
}
export function installCommunity(db,{settleWars,warStats,supply,transaction,clock,fail,notify,log}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a),integer=x=>Number.isSafeInteger(x)&&x>0;
 db.exec(`CREATE TABLE IF NOT EXISTS family_preferences(family_id INTEGER PRIMARY KEY REFERENCES families(id),mode TEXT NOT NULL DEFAULT 'open',theme TEXT NOT NULL DEFAULT 'gold',crest TEXT NOT NULL DEFAULT 'lion',motto TEXT NOT NULL DEFAULT '');
 CREATE TABLE IF NOT EXISTS family_recruitment(family_id INTEGER REFERENCES families(id),user_id INTEGER REFERENCES users(id),kind TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(family_id,user_id,kind));
 CREATE TABLE IF NOT EXISTS operation_history(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),kind TEXT NOT NULL,success INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS family_raid_history(id INTEGER PRIMARY KEY,attacker_family INTEGER,target_family INTEGER,success INTEGER NOT NULL,loot INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS chat_reads(user_id INTEGER NOT NULL REFERENCES users(id),channel TEXT NOT NULL,last_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,channel));
 CREATE TABLE IF NOT EXISTS message_reads(user_id INTEGER NOT NULL REFERENCES users(id),peer_id INTEGER NOT NULL REFERENCES users(id),last_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,peer_id));
`);
 if(!all('PRAGMA table_info(family_preferences)').some(c=>c.name==='banner'))db.exec("ALTER TABLE family_preferences ADD COLUMN banner TEXT NOT NULL DEFAULT ''");
 const covers=id=>[{id:'',name:'Automatic headquarters',image:''},{id:'city',name:'New York skyline',image:'/images/city-new-york.png'},...all('SELECT upgrade_id FROM compound_upgrades WHERE family_id=?',id).map(r=>compoundUpgrades.find(a=>a.id===r.upgrade_id)).filter(Boolean).map(a=>({id:'extension:'+a.id,name:a.name,image:a.image})),...all('SELECT item_id FROM family_assets WHERE family_id=?',id).map(r=>familyAssets.find(a=>a.id===r.item_id)).filter(Boolean).map(a=>({id:a.id,name:a.name,image:a.image}))];
 if(all('PRAGMA table_info(messages)').some(c=>c.name==='sender_id'))db.exec('CREATE INDEX IF NOT EXISTS messages_thread ON messages(sender_id,recipient_id,id); CREATE INDEX IF NOT EXISTS messages_unread_recipient ON messages(recipient_id,sender_id,id)');
 const pref=id=>q('SELECT mode,theme,crest,motto,banner FROM family_preferences WHERE family_id=?',id)||{mode:'open',theme:'gold',crest:'lion',motto:''};
 const member=id=>q('SELECT m.*,f.leader_id FROM family_members m JOIN families f ON f.id=m.family_id WHERE m.user_id=?',id);
 const manager=id=>{const m=member(id);if(!m||m.leader_id!==id&&m.family_role!=='capo')fail('Only the Don and Capos may manage the family.',403);return m;};
 function join(id,familyId){
  if(!integer(familyId)||!q('SELECT 1 FROM families WHERE id=?',familyId))fail('Family not found.',404);
  if(member(id))fail('This player already belongs to a family.',409);
  const u=q('SELECT * FROM users WHERE id=? AND banned=0',id);if(!u)fail('Player not found.',404);if(u.family_join_after>clock())fail('Wait for the rejoin cooldown.',429);
  if(q('SELECT COUNT(*) n FROM family_members WHERE family_id=?',familyId).n>=familyCapacity(db,familyId))fail('This family has reached its member capacity.',409);
  run("INSERT INTO family_members(user_id,family_id,family_role) VALUES(?,?,'member')",id,familyId);run('DELETE FROM family_recruitment WHERE user_id=?',id);
  run('INSERT INTO family_events(family_id,message,created_at) VALUES(?,?,?)',familyId,u.username+' joined the family.',clock());notify(id,'Family membership accepted','You joined '+q('SELECT name FROM families WHERE id=?',familyId).name+'.','/images/scene-families.jpg');return {ok:true,message:'You joined the family.'};
 }
 if(!all('PRAGMA table_info(families)').some(c=>c.name==='rename_count'))db.exec('ALTER TABLE families ADD COLUMN rename_count INTEGER NOT NULL DEFAULT 0');
 function dashboard(user){settleWars();const m=member(user.id);if(!m)return {family:null,invites:all("SELECT r.family_id,f.name FROM family_recruitment r JOIN families f ON f.id=r.family_id WHERE r.user_id=? AND r.kind='invite'",user.id)};
  const f=q('SELECT * FROM families WHERE id=?',m.family_id),owned=all('SELECT * FROM family_assets WHERE family_id=?',f.id),assetValue=owned.reduce((n,a)=>n+(familyAssets.find(x=>x.id===a.item_id)?.price||0)*a.quantity,0),invested=q('SELECT COALESCE(SUM(principal),0) n FROM investments WHERE family_id=? AND claimed=0',f.id).n;
  const extensions=all('SELECT upgrade_id FROM compound_upgrades WHERE family_id=?',f.id),extensionValue=extensions.reduce((n,x)=>n+(compoundUpgrades.find(v=>v.id===x.upgrade_id)?.price||0),0);
  return {family:{id:f.id,name:f.name,renameCount:f.rename_count,warStats:warStats(f.id),power:supply.familyPower(f.id),preferences:{...pref(f.id),bannerImage:covers(f.id).find(c=>c.id===pref(f.id).banner)?.image||''},capacity:familyCapacity(db,f.id),level:Math.floor((career('drugs',f.drugs_xp).level+career('guns',f.guns_xp).level)/2),assetCount:extensions.length+owned.reduce((n,a)=>n+a.quantity,0)+supply.inventory('family',f.id).weaponCount,assetValue:extensionValue+assetValue+supply.inventory('family',f.id).weaponValue,value:f.treasury+extensionValue+assetValue+invested+supply.inventory('family',f.id).weaponValue+supply.inventory('family',f.id).productionValue,canPromoteCapo:m.leader_id===user.id,canManage:m.leader_id===user.id||m.family_role==='capo',attacksReceived:q('SELECT COUNT(*) n FROM family_raid_history WHERE target_family=?',f.id).n,raids:q('SELECT COUNT(*) attempts,COALESCE(SUM(success),0) successes FROM family_raid_history WHERE attacker_family=?',f.id),members:all("SELECT u.id,u.username,u.role staff_role,u.xp,CASE WHEN u.id=? THEN 'Don' ELSE upper(substr(m.family_role,1,1)) || substr(m.family_role,2) END family_role FROM family_members m JOIN users u ON u.id=m.user_id WHERE m.family_id=? ORDER BY u.xp DESC",f.leader_id,f.id).map(p=>({...p,power:supply.personalPower(p.id).total,canManage:m.leader_id===user.id||m.family_role==='capo'&&p.family_role!=='Capo',nextRole:({Member:'soldier',Soldier:'enforcer',Enforcer:'consigliere',Consigliere:'underboss',Underboss:'capo'})[p.family_role]||null})),requests:m.leader_id===user.id||m.family_role==='capo'?all('SELECT r.*,u.username FROM family_recruitment r JOIN users u ON u.id=r.user_id WHERE r.family_id=?',f.id):[]},options:{covers:covers(f.id),crests:familyCrests,themes:['gold','silver','burgundy'],modes:['open','application','invite']}};
 }
 function route(req,path,body,user){const method=req.method,url=new URL(req.url||path,'http://localhost');
  if(path==='/api/unread'&&method==='GET'){
   const family=member(user.id)?.family_id,worldLast=q('SELECT MAX(id) n FROM world_chat')?.n||0,familyLast=family?(q('SELECT MAX(id) n FROM family_chat WHERE family_id=?',family)?.n||0):0;
   const after=channel=>q('SELECT last_id FROM chat_reads WHERE user_id=? AND channel=?',user.id,channel)?.last_id||0;
   return {messages:q('SELECT COUNT(*) n FROM messages m WHERE recipient_id=? AND id>COALESCE((SELECT last_id FROM message_reads WHERE user_id=? AND peer_id=m.sender_id),0)',user.id,user.id).n,world:q('SELECT COUNT(*) n FROM world_chat WHERE id>? AND user_id<>? AND hidden_by IS NULL AND NOT EXISTS(SELECT 1 FROM player_controls c WHERE c.user_id=? AND c.target_id=world_chat.user_id AND (c.blocked=1 OR c.muted=1))',after('world'),user.id,user.id).n,family:family?q('SELECT COUNT(*) n FROM family_chat WHERE family_id=? AND id>? AND user_id<>? AND NOT EXISTS(SELECT 1 FROM player_controls c WHERE c.user_id=? AND c.target_id=family_chat.user_id AND (c.blocked=1 OR c.muted=1))',family,after('family:'+family),user.id,user.id).n:0,worldLast,familyLast,familyId:family||null};
  }
  if(path==='/api/chat/read'&&method==='POST'){
   const family=member(user.id)?.family_id,channel=body.channel==='world'?'world':body.channel==='family'&&family?'family:'+family:null;
   if(!channel||!Number.isSafeInteger(body.lastId)||body.lastId<0)fail('Invalid conversation receipt.');
   const maximum=channel==='world'?(q('SELECT MAX(id) n FROM world_chat')?.n||0):(q('SELECT MAX(id) n FROM family_chat WHERE family_id=?',family)?.n||0);
   if(body.lastId>maximum)fail('Invalid conversation receipt.');
   run('INSERT INTO chat_reads VALUES(?,?,?) ON CONFLICT(user_id,channel) DO UPDATE SET last_id=MAX(last_id,excluded.last_id)',user.id,channel,body.lastId);return {ok:true};
  }
  if(path==='/api/players/search'&&method==='GET'){const term=(url.searchParams.get('q')||'').slice(0,20);if(!/^[a-zA-Z0-9_]*$/.test(term))return {players:[]};return {players:all("SELECT id,username,role,xp FROM users WHERE banned=0 AND substr(lower(username),1,length(?))=lower(?) ORDER BY username LIMIT 100",term,term)};}
  if(path==='/api/statistics'&&method==='GET')return {attempts:q('SELECT COUNT(*) attempts,COALESCE(SUM(success),0) successes FROM operation_history WHERE user_id=?',user.id),byKind:all('SELECT kind,COUNT(*) attempts,SUM(success) successes FROM operation_history WHERE user_id=? GROUP BY kind',user.id),arrests:q("SELECT COUNT(*) n FROM custody WHERE user_id=? AND kind='prison'",user.id).n,comas:q("SELECT COUNT(*) n FROM custody WHERE user_id=? AND kind='coma'",user.id).n};
  if(path==='/api/inbox'&&method==='GET'){
   const rows=all('SELECT m.*,s.username sender,s.role sender_role,r.username recipient FROM messages m JOIN users s ON s.id=m.sender_id JOIN users r ON r.id=m.recipient_id WHERE m.sender_id=? OR m.recipient_id=? ORDER BY m.id DESC',user.id,user.id),threads=new Map();
   for(const m of rows){const peer=m.sender_id===user.id?m.recipient_id:m.sender_id;if(!threads.has(peer)){const p=q('SELECT id,username,role,banned FROM users WHERE id=?',peer);threads.set(peer,{peer:p,last:m,unread:0});}if(m.recipient_id===user.id&&m.id>(q('SELECT last_id FROM message_reads WHERE user_id=? AND peer_id=?',user.id,peer)?.last_id||0))threads.get(peer).unread++;}
   return {threads:[...threads.values()]};
  }
  if(path==='/api/conversation'&&method==='GET'){
   const id=Number(url.searchParams.get('id')),before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER);if(!integer(id)||id===user.id||!integer(before))fail('Choose another player.');const peer=q('SELECT id,username,role,banned FROM users WHERE id=?',id);if(!peer)fail('Player not found.',404);
   const rows=all('SELECT id,sender_id,recipient_id,body,created_at FROM messages WHERE ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)) AND id<? ORDER BY id DESC LIMIT 101',user.id,id,id,user.id,before);return {peer,hasMore:rows.length>100,messages:rows.slice(0,100).reverse()};
  }
  if(path==='/api/conversation/read'&&method==='POST'){if(!integer(body.peerId)||!integer(body.lastId)||!q('SELECT 1 FROM messages WHERE id=? AND ((sender_id=? AND recipient_id=?) OR(sender_id=? AND recipient_id=?))',body.lastId,user.id,body.peerId,body.peerId,user.id))fail('Invalid conversation receipt.');run('INSERT INTO message_reads VALUES(?,?,?) ON CONFLICT(user_id,peer_id) DO UPDATE SET last_id=MAX(last_id,excluded.last_id)',user.id,body.peerId,body.lastId);return {ok:true};}
  if(path==='/api/family/dashboard'&&method==='GET')return dashboard(user);
  if(path==='/api/families'&&method==='GET')return {families:all('SELECT f.id,f.name,u.username leader,(SELECT COUNT(*) FROM family_members WHERE family_id=f.id) members FROM families f JOIN users u ON u.id=f.leader_id ORDER BY members DESC LIMIT 100').map(f=>({...f,capacity:familyCapacity(db,f.id),mode:pref(f.id).mode})),invites:all("SELECT family_id FROM family_recruitment WHERE user_id=? AND kind='invite'",user.id)};
  if(!['/api/family/preferences','/api/family/invite','/api/family/request','/api/family/respond','/api/families/join'].includes(path)||method!=='POST')return null;
  return transaction(()=>{
   if(path==='/api/families/join'){
    if(member(user.id))fail('You already belong to a family.',409);
    if(!integer(body.id)||!q('SELECT 1 FROM families WHERE id=?',body.id))fail('Family not found.',404);
    const mode=pref(body.id).mode,invited=q("SELECT 1 FROM family_recruitment WHERE family_id=? AND user_id=? AND kind='invite'",body.id,user.id);
    if(mode==='invite'&&!invited)fail('This family requires an invitation.',403);
    if(mode==='application'&&!invited){if(member(user.id))fail('Leave your current family first.',409);run("INSERT INTO family_recruitment VALUES(?,?,'application',?) ON CONFLICT DO NOTHING",body.id,user.id,clock());return {ok:true,pending:true,message:'Your membership application has been sent.'};}
    return join(user.id,body.id);
   }
   const m=manager(user.id),id=m.family_id;
   if(path==='/api/family/preferences'){
    if(!['open','application','invite'].includes(body.mode)||!['gold','silver','burgundy'].includes(body.theme)||!familyCrests.includes(body.crest)||typeof body.motto!=='string'||body.motto.length>160)fail('Choose valid family presets and a motto up to 160 characters.');
    if(body.banner!==undefined&&!covers(id).some(c=>c.id===body.banner))fail('Choose a family-owned cover image.');
    const family=q('SELECT name,rename_count FROM families WHERE id=?',id);
    if(body.name!==undefined&&body.name!==family.name){
     if(typeof body.name!=='string'||body.name.trim().length<3||body.name.trim().length>40||/[<>\x00-\x1f]/.test(body.name))fail('Family names must contain 3–40 characters.');
     const name=body.name.trim();
     if(name!==family.name){
      if(family.rename_count>=3)fail('A family can be renamed at most three times.',409);
      if(q('SELECT id FROM families WHERE lower(name)=lower(?) AND id<>?',name,id))fail('This family name is already in use.',409);
      if(!run('UPDATE families SET name=?,rename_count=rename_count+1,treasury=treasury-1000000 WHERE id=? AND rename_count<3 AND treasury>=1000000',name,id).changes)fail('Renaming requires $1 million in the family treasury.',409);
      log(user.id,'Renamed family '+family.name+' to '+name+' for $1000000.');
     }
    }
    run('INSERT INTO family_preferences(family_id,mode,theme,crest,motto,banner) VALUES(?,?,?,?,?,?) ON CONFLICT(family_id) DO UPDATE SET mode=excluded.mode,theme=excluded.theme,crest=excluded.crest,motto=excluded.motto,banner=excluded.banner',id,body.mode,body.theme,body.crest,body.motto.trim(),body.banner??pref(id).banner??'');log(user.id,'Updated family appearance and admission policy.');return {ok:true,message:'Family settings saved.'};
   }
   if(path==='/api/family/invite'){
    const target=typeof body.target==='string'?q('SELECT id FROM users WHERE username=? AND banned=0',body.target):null;if(!target||target.id===user.id||member(target.id))fail('Choose a player who has no family.');if(q('SELECT COUNT(*) n FROM family_members WHERE family_id=?',id).n>=familyCapacity(db,id))fail('Family is full.',409);
    run("INSERT INTO family_recruitment VALUES(?,?,'invite',?) ON CONFLICT DO NOTHING",id,target.id,clock());notify(target.id,'Family invitation',q('SELECT name FROM families WHERE id=?',id).name+' invited you. Visit My family to accept.','/images/scene-families.jpg');return {ok:true,message:'Invitation sent.'};
   }
   if(path==='/api/family/respond'){
    if(!integer(body.userId)||!['accept','decline'].includes(body.decision)||!q("SELECT 1 FROM family_recruitment WHERE family_id=? AND user_id=? AND kind='application'",id,body.userId))fail('Application not found.',404);
    if(body.decision==='accept')return join(body.userId,id);run("DELETE FROM family_recruitment WHERE family_id=? AND user_id=? AND kind='application'",id,body.userId);return {ok:true,message:'Application declined.'};
   }
   fail('Unsupported request.');
  });
 }
 return {route};
}
