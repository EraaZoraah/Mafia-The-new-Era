import {splitStaffTotals} from './staff-totals.js';
export const ONLINE_WINDOW=90000;
export function installPresence(db,{clock,fail,membership=()=>null,lucky=()=>null}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 for(const field of ['last_seen','online_until','play_ms'])if(!all('PRAGMA table_info(users)').some(c=>c.name===field))db.exec('ALTER TABLE users ADD COLUMN '+field+' INTEGER NOT NULL DEFAULT 0');
 if(!all('PRAGMA table_info(users)').some(c=>c.name==='ui_language'))db.exec("ALTER TABLE users ADD COLUMN ui_language TEXT NOT NULL DEFAULT ''");
 const interfaceLanguages=['en','nl','es','fr','de'];
 db.exec('CREATE TABLE IF NOT EXISTS player_online_sessions(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,active_ms INTEGER NOT NULL DEFAULT 0,next_contact_ms INTEGER NOT NULL DEFAULT 600000)');
 db.exec('CREATE TABLE IF NOT EXISTS player_active_days(user_id INTEGER NOT NULL REFERENCES users(id),day TEXT NOT NULL,PRIMARY KEY(user_id,day))');
 function touch(id){const now=clock(),p=q('SELECT last_seen,online_until FROM users WHERE id=? AND banned=0 AND deleted_at=0',id);if(!p)return;
  const elapsed=p.last_seen&&p.online_until>now?Math.max(0,Math.min(60000,now-p.last_seen)):0;
  if(p.online_until<=now)run('INSERT INTO player_online_sessions VALUES(?,0,600000) ON CONFLICT(user_id) DO UPDATE SET active_ms=0,next_contact_ms=600000',id);else run('INSERT INTO player_online_sessions VALUES(?,?,600000) ON CONFLICT(user_id) DO UPDATE SET active_ms=active_ms+excluded.active_ms',id,elapsed);
  run('UPDATE users SET play_ms=play_ms+?,last_seen=?,online_until=? WHERE id=?',elapsed,now,now+ONLINE_WINDOW,id);
  run('INSERT OR IGNORE INTO player_active_days VALUES(?,?)',id,new Date(now).toISOString().slice(0,10));
 }
 const offline=id=>{touch(id);run('UPDATE users SET online_until=0 WHERE id=?',id);};
 function route(req,path,b,u){
  if(path==='/api/presence/heartbeat'&&req.method==='POST'){if(b.language!==undefined&&!interfaceLanguages.includes(b.language))fail('Choose a supported language.');touch(u.id);if(b.language!==undefined)run('UPDATE users SET ui_language=? WHERE id=? AND ui_language<>?',b.language,u.id,b.language);return {ok:true};}
  if(path==='/api/presence'&&req.method==='GET'){
   const raw=new URL(req.url,'http://localhost').searchParams.get('ids')||'';
   if(!/^\d+(,\d+)*$/.test(raw)||raw.split(',').length>100)fail('Choose at most 100 player IDs.');
   const ids=[...new Set(raw.split(',').map(Number))];if(ids.some(id=>!Number.isSafeInteger(id)||id<1))fail('Invalid player ID.');
   return {players:all('SELECT id,banned,last_seen,online_until FROM users WHERE deleted_at=0 AND id IN ('+ids.map(()=>'?').join(',')+')',...ids).map(p=>({bot:!!q('SELECT 1 FROM bot_players WHERE user_id=?',p.id),id:p.id,lastSeen:p.last_seen,online:!p.banned&&p.online_until>clock(),supporter:membership(p.id),luckyWinner:lucky(p.id)}))};
  }
  if(path==='/api/admin/languages'&&req.method==='GET'){
   if(u.role!=='owner')fail('Owner access required.',403);
   const groups=all("SELECT ui_language code,EXISTS(SELECT 1 FROM bot_players b WHERE b.user_id=users.id) bot,COUNT(*) n FROM users WHERE deleted_at=0 GROUP BY ui_language,bot");
   const totals={players:0,bots:0},map=new Map([...interfaceLanguages,''].map(code=>[code,{code,players:0,bots:0,total:0}]));
   for(const group of groups){const key=interfaceLanguages.includes(group.code)?group.code:'';const row=map.get(key),kind=group.bot?'bots':'players';row[kind]+=group.n;row.total+=group.n;totals[kind]+=group.n;}
   const rows=[...map.values()].map(row=>({...row,percent:totals.players?row.players/totals.players*100:0}));
   return {serverTime:clock(),total:totals.players+totals.bots,...totals,reported:rows.filter(row=>row.code).reduce((n,row)=>n+row.players,0),languages:rows};
  }
  if(path==='/api/admin/population'&&req.method==='GET'){
   if(!['owner','admin'].includes(u.role))fail('Staff access required.',403);
   const params=new URL(req.url,'http://localhost').searchParams,filter=params.get('filter')||'all',page=Number(params.get('page')||1);
   if(!['all','online'].includes(filter)||!Number.isSafeInteger(page)||page<1)fail('Invalid player filter.');
   const rows=all('SELECT id,username,role,xp,cash,bank,banned,last_seen,online_until,created_at,play_ms,(SELECT COUNT(*) FROM player_active_days d WHERE d.user_id=users.id) days_played FROM users WHERE deleted_at=0');
   const online=rows.filter(p=>!p.banned&&p.online_until>clock()),selected=filter==='online'?online:rows;
   const sort=params.get('sort')||'username',direction=params.get('direction')||'asc';if(!['id','username','xp','created_at','days_played','play_ms','last_seen'].includes(sort)||!['asc','desc'].includes(direction))fail('Invalid player sort.');
   selected.sort((a,b)=>{const x=a[sort],y=b[sort];return (direction==='asc'?1:-1)*(typeof x==='number'?x-y:String(x).localeCompare(String(y),'en',{numeric:true,sensitivity:'base'}))||a.id-b.id});
   const sum=key=>rows.filter(p=>!['owner','admin'].includes(p.role)).reduce((a,p)=>a+BigInt(p[key]),0n);
   const treasury=all('SELECT treasury FROM families').reduce((a,p)=>a+BigInt(p.treasury),0n);
   return {staff:splitStaffTotals(rows),total:rows.filter(p=>!['owner','admin'].includes(p.role)).length,online:online.filter(p=>!['owner','admin'].includes(p.role)).length,bountyEscrow:all("SELECT amount,paid FROM bounties WHERE status IN ('open','claimed','refunded')").reduce((n,b)=>n+BigInt(b.amount-b.paid),0n).toString(),totalXp:sum('xp').toString(),money:(sum('cash')+sum('bank')+treasury).toString(),playerCash:sum('cash').toString(),playerBank:sum('bank').toString(),familyTreasury:treasury.toString(),filter,page,pages:Math.max(1,Math.ceil(selected.length/50)),players:selected.slice((page-1)*50,page*50).map(p=>({id:p.id,username:p.username,role:p.role,xp:p.xp,banned:p.banned,online:!p.banned&&p.online_until>clock(),lastSeen:p.last_seen,createdAt:p.created_at,playMillis:p.play_ms,daysPlayed:p.days_played}))};
  }
  return null;
 }
 return {route,touch,offline};
}
