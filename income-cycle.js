export const INCOME_CAP_MS=24*3600000;
export function installIncomeCycles(db,{blockedMillis}){
 const q=(s,...a)=>db.prepare(s).get(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec('CREATE TABLE IF NOT EXISTS income_cycles(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,started_at INTEGER NOT NULL,last_at INTEGER NOT NULL,active_ms INTEGER NOT NULL CHECK(active_ms BETWEEN 0 AND 86400000))');
 const active=(id,a,b)=>Math.max(0,b-a-blockedMillis(id,a,b));
 function window(user,time,earning){
  let row=q('SELECT * FROM income_cycles WHERE user_id=?',user.id);
  if(!row){
   if(!earning)return {from:time,to:time,elapsed:0,startedAt:time};
   const oldest=q('SELECT MIN(income_at) stamp FROM (SELECT income_at FROM possessions WHERE user_id=? UNION ALL SELECT income_at FROM employees WHERE user_id=?)',user.id,user.id)?.stamp||time;
   const start=Math.min(time,user.pending_income?user.income_claim_at||oldest:Math.max(user.income_claim_at||0,oldest));
   const last=Math.max(start,Math.min(time,oldest));
   row={user_id:user.id,started_at:start,last_at:last,active_ms:user.pending_income?Math.min(INCOME_CAP_MS,active(user.id,start,last)):0};
   run('INSERT INTO income_cycles VALUES(?,?,?,?)',user.id,start,last,row.active_ms);
   run('UPDATE users SET income_claim_at=? WHERE id=?',start,user.id);
  }
  const from=Math.min(time,row.last_at),duration=earning?active(user.id,from,time):0,remaining=INCOME_CAP_MS-row.active_ms;
  let to=time;
  if(!earning||!remaining)to=from;
  else if(duration>remaining){let lo=from,hi=time;while(lo<hi){const mid=lo+Math.floor((hi-lo)/2);if(active(user.id,from,mid)>=remaining)hi=mid;else lo=mid+1;}to=lo;}
  const elapsed=Math.min(INCOME_CAP_MS,row.active_ms+duration);
  run('UPDATE income_cycles SET last_at=?,active_ms=? WHERE user_id=?',time,elapsed,user.id);
  return {from,to,elapsed,startedAt:row.started_at};
 }
 function elapsed(user,time,earning){const r=q('SELECT * FROM income_cycles WHERE user_id=?',user.id);return r?Math.min(INCOME_CAP_MS,r.active_ms+(earning?active(user.id,Math.min(time,r.last_at),time):0)):0;}
 function reset(id,time){run('INSERT INTO income_cycles VALUES(?,?,?,0) ON CONFLICT(user_id) DO UPDATE SET started_at=excluded.started_at,last_at=excluded.last_at,active_ms=0',id,time,time);run('UPDATE users SET income_claim_at=? WHERE id=?',time,id);}
 return {window,elapsed,reset};
}
