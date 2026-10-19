import {createHash,randomBytes} from 'node:crypto';
import {progression} from './progression.js';
import {MAX_CASH} from './money.js';
export const referralEvent={id:'beta-referrals',name:'Beta referral event',starter:25000000,reward:50000000,rank:5,days:3,milestones:[{count:5,tier:'silver',days:30},{count:10,tier:'gold',days:30}]};
export function installReferrals(db,{clock,transaction,fail,notify=()=>{},log=()=>{}}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE IF NOT EXISTS referral_accounts(user_id INTEGER PRIMARY KEY REFERENCES users(id),network TEXT NOT NULL,email_key TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS referrals(user_id INTEGER PRIMARY KEY REFERENCES users(id),referrer_id INTEGER NOT NULL REFERENCES users(id),created_at INTEGER NOT NULL,status TEXT NOT NULL,flags TEXT NOT NULL,paid_at INTEGER NOT NULL DEFAULT 0,reviewer_id INTEGER REFERENCES users(id),reviewed_at INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS referral_milestones(user_id INTEGER NOT NULL REFERENCES users(id),threshold INTEGER NOT NULL,awarded_at INTEGER NOT NULL,PRIMARY KEY(user_id,threshold));
 CREATE TABLE IF NOT EXISTS referral_memberships(user_id INTEGER PRIMARY KEY REFERENCES users(id),tier TEXT NOT NULL,starts_at INTEGER NOT NULL,expires_at INTEGER NOT NULL);`);
 run("INSERT OR IGNORE INTO settings(key,value) VALUES('referral_salt',?)",randomBytes(32).toString('hex'));
 const fingerprint=ip=>createHash('sha256').update(q("SELECT value FROM settings WHERE key='referral_salt'").value+'|'+ip).digest('hex');
 const bot=id=>!!q('SELECT 1 FROM bot_players WHERE user_id=?',id);
 function registration(create,name,ip,email){return transaction(()=>{
  if(name!==undefined&&typeof name!=='string')fail('Enter a valid referrer username.');const entered=(name||'').trim();if(entered.length>30)fail('Enter a valid referrer username.');
  const ref=entered?q('SELECT * FROM users WHERE username=? AND banned=0 AND deleted_at=0',entered):null;if(entered&&(!ref||bot(ref.id)))fail('Choose an existing human referrer.');
  const network=fingerprint(ip),emailKey=String(email).toLowerCase().replace(/\+[^@]*(?=@)/,'');const flags=[];
  if(ref&&q('SELECT 1 FROM referral_accounts WHERE network=? OR email_key=?',network,emailKey))flags.push('Shared registration network or email alias');
  const id=Number(create());run('INSERT INTO referral_accounts VALUES(?,?,?)',id,network,emailKey);
  if(ref){run('INSERT INTO referrals(user_id,referrer_id,created_at,status,flags) VALUES(?,?,?,?,?)',id,ref.id,clock(),flags.length?'review':'pending',JSON.stringify(flags));run('UPDATE users SET cash=? WHERE id=?',referralEvent.starter,id);log(id,'Beta referral starter bonus: $25000000.');}
  return id;
 });}
 function eligible(id){const u=q('SELECT xp,role,banned,deleted_at FROM users WHERE id=?',id);return u&&u.role==='player'&&!u.banned&&!u.deleted_at&&!bot(id)&&progression(u.xp).rankLevel>=referralEvent.rank&&q('SELECT COUNT(*) n FROM player_active_days WHERE user_id=?',id).n>=referralEvent.days;}
 function settle(){return transaction(()=>{
  if(!q("SELECT 1 FROM settings WHERE key='referral-beta-announcement'")){const author=q("SELECT id FROM users WHERE role='owner' AND banned=0 AND deleted_at=0 ORDER BY id LIMIT 1");if(author){const b=run("INSERT INTO bulletins(author_id,kind,title,body,status,starts_at,ends_at,popup,updated_at) VALUES(?,'event',?,?,'published',?,?,1,?)",author.id,'Beta event: Invite your inner circle','New players can enter a friend’s username at registration for $25,000,000 starting cash. The referrer receives $50,000,000 when the new player reaches rank 5 and three distinct active days. Five qualified friends unlock 30 days of Supporter; ten unlock 30 days of Grand Supporter. Suspicious referrals require staff review. See Beta referrals for progress and rules.',clock(),4102444800000,clock());run("INSERT INTO settings VALUES('referral-beta-announcement',?)",String(b.lastInsertRowid));}}

  const eventId=q("SELECT value FROM settings WHERE key='referral-beta-announcement'")?.value;
  if(eventId)run('UPDATE bulletins SET body=?,updated_at=? WHERE id=? AND body=?',"New players can enter a friend’s username at registration for $25,000,000 starting cash. The referrer receives $50,000,000 when the new player reaches rank 5 and three distinct active days. Five qualified friends unlock 30 days of Supporter; ten unlock 30 days of Grand Supporter. Suspicious referrals require staff review. See Beta referrals for progress and rules.",clock(),Number(eventId),"New players can enter a friend’s username at registration for $10,000,000 starting cash. The referrer receives $25,000,000 when the new player reaches rank 5 and three distinct active days. Five qualified friends unlock 30 days of Supporter; ten unlock 30 days of Grand Supporter. Suspicious referrals require staff review. See Beta referrals for progress and rules.");
  for(const r of all("SELECT * FROM referrals WHERE paid_at=0 AND status IN ('pending','approved')")){
   if(!eligible(r.user_id))continue;const ref=q('SELECT * FROM users WHERE id=?',r.referrer_id);if(!ref||ref.banned||ref.deleted_at||bot(ref.id))continue;
   if(!run('UPDATE users SET cash=cash+? WHERE id=? AND cash<=?',referralEvent.reward,ref.id,MAX_CASH-referralEvent.reward).changes)continue;
   run("UPDATE referrals SET status='qualified',paid_at=? WHERE user_id=? AND paid_at=0",clock(),r.user_id);log(ref.id,'Qualified beta referral #'+r.user_id+': $50000000.');notify(ref.id,'Referral qualified','A friend reached rank 5 and three active days. Your $50,000,000 beta reward was credited.','/images/outcome-success.png');
  }
  for(const row of all("SELECT referrer_id id,COUNT(*) n FROM referrals WHERE paid_at>0 GROUP BY referrer_id"))for(const m of referralEvent.milestones){
   if(row.n<m.count||q('SELECT 1 FROM referral_milestones WHERE user_id=? AND threshold=?',row.id,m.count))continue;
   const paid=q('SELECT expires_at FROM supporter_memberships WHERE user_id=? AND expires_at>?',row.id,clock()),old=q('SELECT * FROM referral_memberships WHERE user_id=?',row.id),start=Math.max(clock(),paid?.expires_at||0),remaining=old?Math.max(0,old.expires_at-Math.max(clock(),old.starts_at)):0;
   run('INSERT INTO referral_memberships VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET tier=excluded.tier,starts_at=excluded.starts_at,expires_at=excluded.expires_at',row.id,m.tier==='gold'||old?.tier==='gold'?'gold':'silver',start,start+remaining+m.days*86400000);
   run('INSERT INTO referral_milestones VALUES(?,?,?)',row.id,m.count,clock());notify(row.id,'Referral milestone unlocked',m.count+' qualified friends: 30 free days of '+(m.tier==='gold'?'Grand Supporter':'Supporter')+'. Existing paid time is preserved; no purchase cash or XP is granted.','/images/premium-shop-v4.png');
  }
 });}
 function list(staff,id){settle();const rows=all(`SELECT r.*,u.username player,u.xp,u.banned,a.username referrer,(SELECT COUNT(*) FROM player_active_days d WHERE d.user_id=u.id) active_days FROM referrals r JOIN users u ON u.id=r.user_id JOIN users a ON a.id=r.referrer_id ${staff?'':'WHERE r.referrer_id=? OR r.user_id=?'} ORDER BY r.created_at DESC`,...(staff?[]:[id,id])).map(r=>({...r,flags:staff?JSON.parse(r.flags):[],rank:progression(r.xp).rank,rankLevel:progression(r.xp).rankLevel}));return {userId:id,event:referralEvent,rows,total:rows.length,qualified:rows.filter(r=>r.paid_at).length,review:rows.filter(r=>r.status==='review').length,membership:q('SELECT * FROM referral_memberships WHERE user_id=?',id)||null,milestones:all('SELECT * FROM referral_milestones WHERE user_id=?',id)};}
 function route(req,path,b,u){if(req.method==='GET'&&path==='/api/referrals')return list(false,u.id);
  if(path.startsWith('/api/admin/referrals')){if(!['owner','admin'].includes(u.role))fail('Staff access required.',403);
   if(req.method==='GET'&&path==='/api/admin/referrals')return list(true,u.id);
   if(req.method==='POST'&&path==='/api/admin/referrals/review')return transaction(()=>{if(!Number.isSafeInteger(b.id)||!['approve','reject','reopen'].includes(b.decision)||typeof b.reason!=='string'||b.reason.trim().length<5||b.reason.length>500)fail('Choose a referral decision and a reason of 5–500 characters.');const r=q('SELECT * FROM referrals WHERE user_id=?',b.id);if(!r||r.paid_at||b.decision==='reopen'&&!['approved','rejected'].includes(r.status)||b.decision!=='reopen'&&r.status!=='review')fail('Only a pending review can be decided.',409);run('UPDATE referrals SET status=?,reviewer_id=?,reviewed_at=? WHERE user_id=?',b.decision==='reopen'?'review':b.decision==='approve'?'approved':'rejected',u.id,clock(),b.id);run('INSERT INTO owner_audit(actor_id,target_id,details,created_at) VALUES(?,?,?,?)',u.id,b.id,JSON.stringify({referralReview:true,referrerId:r.referrer_id,decision:b.decision,reason:b.reason.trim()}),clock());log(u.id,'Referral review #'+b.id+': '+b.decision+' · '+b.reason.trim());settle();return {ok:true};});
  }return null;
 }
 function guard(id,path){const r=q('SELECT * FROM referrals WHERE user_id=?',id);if(r&&!r.paid_at&&(!eligible(id)||r.status==='review'||r.status==='rejected')&&/\/api\/(pvp|transfers|family\/donate|art\/bid|vehicles\/auction\/bid|bounties\/post|marriage\/invite)/.test(path))fail('Referral beta accounts unlock player-to-player spending after qualification and any required review.',403);}
 return {protectedTarget:id=>{const r=q('SELECT * FROM referrals WHERE user_id=?',id);return !!r&&(!eligible(id)||['review','rejected'].includes(r.status));},view:id=>list(false,id),registration,route,settle,guard};
}
