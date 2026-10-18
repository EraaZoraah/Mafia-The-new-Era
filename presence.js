import {splitStaffTotals} from './staff-totals.js';
export const ONLINE_WINDOW=90000;
export function installPresence(db,{clock,fail,membership=()=>null,lucky=()=>null}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 for(const field of ['last_seen','online_until','play_ms'])if(!all('PRAGMA table_info(users)').some(c=>c.name===field))db.exec('ALTER TABLE users ADD COLUMN '+field+' INTEGER NOT NULL DEFAULT 0');
 db.exec('CREATE TABLE IF NOT EXISTS player_active_days(user_id INTEGER NOT NULL REFERENCES users(id),day TEXT NOT NULL,PRIMARY KEY(user_id,day))');
 function touch(id){const now=clock(),p=q('SELECT last_seen,online_until FROM users WHERE id=? AND banned=0 AND deleted_at=0',id);if(!p)return;
  const elapsed=p.last_seen&&p.online_until>now?Math.max(0,Math.min(60000,now-p.last_seen)):0;
  run('UPDATE users SET play_ms=play_ms+?,last_seen=?,online_until=? WHERE id=?',elapsed,now,now+ONLINE_WINDOW,id);
  run('INSERT OR IGNORE INTO player_active_days VALUES(?,?)',id,new Date(now).toISOString().slice(0,10));
 }
 const offline=id=>{touch(id);run('UPDATE users SET online_until=0 WHERE id=?',id);};
 function route(req,path,b,u){
  if(path==='/api/presence/heartbeat'&&req.method==='POST'){touch(u.id);return {ok:true};}
  if(path==='/api/presence'&&req.method==='GET'){
   const raw=new URL(req.url,'http://localhost').searchParams.get('ids')||'';
   if(!/^\d+(,\d+)*$/.test(raw)||raw.split(',').length>100)fail('Choose at most 100 player IDs.');
   const ids=[...new Set(raw.split(',').map(Number))];if(ids.some(id=>!Number.isSafeInteger(id)||id<1))fail('Invalid player ID.');
   return {players:all('SELECT id,last_seen,online_until FROM users WHERE banned=0 AND deleted_at=0 AND id IN ('+ids.map(()=>'?').join(',')+')',...ids).map(p=>({bot:!!q('SELECT 1 FROM bot_players WHERE user_id=?',p.id),id:p.id,lastSeen:p.last_seen,online:p.online_until>clock(),supporter:membership(p.id),luckyWinner:lucky(p.id)}))};
  }
  if(path==='/api/admin/population'&&req.method==='GET'){
   if(!['owner','admin'].includes(u.role))fail('Staff access required.',403);
   const params=new URL(req.url,'http://localhost').searchParams,filter=params.get('filter')||'all',page=Number(params.get('page')||1);
   if(!['all','online'].includes(filter)||!Number.isSafeInteger(page)||page<1)fail('Invalid player filter.');
   const rows=all('SELECT id,username,role,xp,cash,bank,banned,last_seen,online_until,created_at,play_ms,(SELECT COUNT(*) FROM player_active_days d WHERE d.user_id=users.id) days_played FROM users WHERE deleted_at=0');
   const online=rows.filter(p=>!p.banned&&p.online_until>clock()),selected=filter==='online'?online:rows;
   const sum=key=>rows.filter(p=>!['owner','admin'].includes(p.role)).reduce((a,p)=>a+BigInt(p[key]),0n);
   const treasury=all('SELECT treasury FROM families').reduce((a,p)=>a+BigInt(p.treasury),0n);
   return {staff:splitStaffTotals(rows),total:rows.length,online:online.length,bountyEscrow:all("SELECT amount,paid FROM bounties WHERE status IN ('open','claimed','refunded')").reduce((n,b)=>n+BigInt(b.amount-b.paid),0n).toString(),totalXp:sum('xp').toString(),money:(sum('cash')+sum('bank')+treasury).toString(),playerCash:sum('cash').toString(),playerBank:sum('bank').toString(),familyTreasury:treasury.toString(),filter,page,pages:Math.max(1,Math.ceil(selected.length/50)),players:selected.sort((a,b)=>a.username.localeCompare(b.username)).slice((page-1)*50,page*50).map(p=>({id:p.id,username:p.username,role:p.role,xp:p.xp,banned:p.banned,online:!p.banned&&p.online_until>clock(),lastSeen:p.last_seen,createdAt:p.created_at,playMillis:p.play_ms,daysPlayed:p.days_played}))};
  }
  return null;
 }
 return {route,touch,offline};
}
