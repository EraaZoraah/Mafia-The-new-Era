import {MAX_CASH} from './money.js';
export const WEDDING_COST=50000000,MARRIAGE_BONUS=.10;
export const liquidationChance=rounds=>Math.min(.90,.35+.55*(1-Math.exp(-(rounds-60)/1500)));
export const backfireChance=rounds=>Math.min(.65,.65*(1-Math.exp(-rounds/1500)));
export function installPlayerSystems(db,{transaction,clock,fail,settleRaw,available,notify}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a),valid=n=>Number.isSafeInteger(n)&&n>0&&n<=1e12;
 db.exec(`CREATE TABLE IF NOT EXISTS bounties(id INTEGER PRIMARY KEY,sponsor_id INTEGER NOT NULL REFERENCES users(id),target_id INTEGER NOT NULL REFERENCES users(id),amount INTEGER NOT NULL CHECK(amount>0 AND amount<=1000000000000),status TEXT NOT NULL DEFAULT 'open',winner_id INTEGER REFERENCES users(id),paid INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,settled_at INTEGER NOT NULL DEFAULT 0,request_key TEXT NOT NULL,UNIQUE(sponsor_id,request_key));
 CREATE INDEX IF NOT EXISTS bounty_target ON bounties(target_id,status);
 CREATE TABLE IF NOT EXISTS incoming_operations(id INTEGER PRIMARY KEY,attacker_id INTEGER NOT NULL REFERENCES users(id),target_id INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,success INTEGER NOT NULL,rounds INTEGER NOT NULL,backfire_rounds INTEGER NOT NULL,backfire_success INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS incoming_target ON incoming_operations(target_id,kind);
 CREATE TABLE IF NOT EXISTS marriage_invites(id INTEGER PRIMARY KEY,sender_id INTEGER NOT NULL REFERENCES users(id),recipient_id INTEGER NOT NULL REFERENCES users(id),cost INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS marriages(id INTEGER PRIMARY KEY,payer_id INTEGER NOT NULL REFERENCES users(id),partner_id INTEGER NOT NULL REFERENCES users(id),cost INTEGER NOT NULL,started_at INTEGER NOT NULL,ended_at INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS marriage_members(user_id INTEGER PRIMARY KEY REFERENCES users(id),marriage_id INTEGER NOT NULL REFERENCES marriages(id));`);
 if(!all('PRAGMA table_info(users)').some(c=>c.name==='backfire_rounds'))db.exec('ALTER TABLE users ADD COLUMN backfire_rounds INTEGER NOT NULL DEFAULT 0');
 const sameFamily=(a,b)=>!!q('SELECT 1 FROM family_members a JOIN family_members b ON a.family_id=b.family_id WHERE a.user_id=? AND b.user_id=?',a,b);
 const married=id=>q('SELECT m.*,u.id spouse_id,u.username spouse FROM marriage_members mm JOIN marriages m ON m.id=mm.marriage_id JOIN users u ON u.id=CASE WHEN m.payer_id=? THEN m.partner_id ELSE m.payer_id END WHERE mm.user_id=? AND m.ended_at=0',id,id)||null;
 const bonus=id=>married(id)?1+MARRIAGE_BONUS:1;
 const key=k=>typeof k==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(k);
 function collect(id){let paid=0;for(const b of all("SELECT * FROM bounties WHERE winner_id=? AND status IN ('claimed','refunded') AND paid<amount ORDER BY id",id)){
  const amount=Math.min(b.amount-b.paid,MAX_CASH-q('SELECT cash FROM users WHERE id=?',id).cash);if(amount<=0)break;
  run('UPDATE users SET cash=cash+? WHERE id=?',amount,id);run('UPDATE bounties SET paid=paid+? WHERE id=?',amount,b.id);paid+=amount;
 }return paid;}
 function award(killer,target){let amount=0;for(const b of all("SELECT * FROM bounties WHERE target_id=? AND status='open' ORDER BY id",target)){
  if(killer===b.sponsor_id||killer===target||sameFamily(killer,target))continue;
  run("UPDATE bounties SET status='claimed',winner_id=?,settled_at=? WHERE id=? AND status='open'",killer,clock(),b.id);amount+=b.amount;
  notify(b.sponsor_id,'Bounty completed','Your bounty #'+b.id+' was completed. The escrow reward was assigned to its successful hunter.','/images/scene-operations.jpg');
 }const paid=collect(killer);return {amount,paid,pending:q("SELECT COALESCE(SUM(amount-paid),0) total FROM bounties WHERE winner_id=? AND status IN ('claimed','refunded')",killer).total};}
 const record=(attacker,target,kind,success,rounds,backfireRounds=0,backfireSuccess=false)=>run('INSERT INTO incoming_operations(attacker_id,target_id,kind,success,rounds,backfire_rounds,backfire_success,created_at) VALUES(?,?,?,?,?,?,?,?)',attacker,target,kind,Number(success),rounds,backfireRounds,Number(backfireSuccess),clock());
 function route(req,path,b,u){
  if(path==='/api/player/progress'&&req.method==='GET')return {incoming:all('SELECT kind,COUNT(*) attempts,SUM(success) successes,SUM(backfire_success) backfireKills FROM incoming_operations WHERE target_id=? GROUP BY kind ORDER BY kind',u.id).map(r=>({...r,successRate:r.attempts?r.successes/r.attempts:0})),note:'Incoming player operations recorded since the bounty/backfire update. Success percentage means the attacker succeeded against you. Rejected operations do not count.'};
  if(path==='/api/player/backfire'&&req.method==='POST'){if(!Number.isSafeInteger(b.rounds)||b.rounds<0||b.rounds>10000)fail('Choose 0–10,000 backfire rounds.');run('UPDATE users SET backfire_rounds=? WHERE id=?',b.rounds,u.id);return {ok:true,message:'Backfire preference saved. Rounds are only consumed when a valid liquidation attempt targets you.'};}
  if(path==='/api/bounties'&&req.method==='GET')return {bounties:all("SELECT b.id,b.amount,b.created_at,t.id targetId,t.username target,s.username sponsor FROM bounties b JOIN users t ON t.id=b.target_id JOIN users s ON s.id=b.sponsor_id WHERE b.status='open' AND t.deleted_at=0 ORDER BY b.amount DESC,b.id LIMIT 200"),pending:q("SELECT COALESCE(SUM(amount-paid),0) total FROM bounties WHERE winner_id=? AND status IN ('claimed','refunded')",u.id).total,backfire:u.backfire_rounds||0,ammo:q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=?",u.id)?.ammo||0};
  if(path==='/api/bounties/collect'&&req.method==='POST')return transaction(()=>{available(settleRaw(u.id));return {ok:true,reward:collect(u.id),message:'Available bounty credit collected.'};});
  if(path==='/api/bounties/post'&&req.method==='POST')return transaction(()=>{
   available(settleRaw(u.id));if(!key(b.key)||!valid(b.amount)||typeof b.target!=='string')fail('Choose a player and a whole-dollar bounty you can afford.');
   const t=q('SELECT * FROM users WHERE username=? COLLATE NOCASE AND banned=0 AND deleted_at=0',b.target.trim());if(!t||t.id===u.id||sameFamily(u.id,t.id))fail('Choose an active player outside your own family.');
   const old=q('SELECT * FROM bounties WHERE sponsor_id=? AND request_key=?',u.id,b.key);if(old){if(old.target_id!==t.id||old.amount!==b.amount)fail('Request key already used.',409);return {ok:true,duplicate:true};}
   if(u.xp<500||t.xp<500)fail('Both players need 500 XP.',403);
   if(q("SELECT COALESCE(SUM(amount),0) total FROM bounties WHERE target_id=? AND status='open'",t.id).total+b.amount>1e12)fail('Total open bounties on a player cannot exceed $1 trillion.',409);
   if(q("SELECT COUNT(*) n FROM bounties WHERE sponsor_id=? AND status='open'",u.id).n>=10)fail('At most ten open bounties per sponsor.',409);
   if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',b.amount,u.id,b.amount).changes)fail('Insufficient cash.',409);
   run('INSERT INTO bounties(sponsor_id,target_id,amount,created_at,request_key) VALUES(?,?,?,?,?)',u.id,t.id,b.amount,clock(),b.key);
   notify(t.id,'A bounty bears your name','A bounty of $'+b.amount.toLocaleString('en-US')+' has been funded. View Bounties under Crimes & missions.','/images/scene-operations.jpg');
   return {ok:true,cost:b.amount,message:'Bounty funded and held in escrow. Another eligible player must successfully liquidate the target to earn it.',image:'/images/scene-operations.jpg'};
  });
  if(path==='/api/marriage'&&req.method==='GET')return {marriage:married(u.id),cost:WEDDING_COST,bonusPercent:MARRIAGE_BONUS*100,invitations:all("SELECT i.*,s.username sender,r.username recipient FROM marriage_invites i JOIN users s ON s.id=i.sender_id JOIN users r ON r.id=i.recipient_id WHERE (i.sender_id=? OR i.recipient_id=?) AND i.status='pending' AND i.expires_at>? ORDER BY i.id DESC",u.id,u.id,clock())};
  if(path==='/api/marriage/invite'&&req.method==='POST')return transaction(()=>{
   available(settleRaw(u.id));const t=typeof b.target==='string'?q('SELECT * FROM users WHERE username=? COLLATE NOCASE AND banned=0 AND deleted_at=0',b.target.trim()):null;
   if(!t||t.id===u.id||married(u.id)||married(t.id))fail('Choose another unmarried player.');if(u.xp<500||t.xp<500)fail('Both players need 500 XP.',403);
   if(q("SELECT COUNT(*) n FROM marriage_invites WHERE sender_id=? AND created_at>?",u.id,clock()-86400000).n>=5)fail('At most five wedding invitations per day.',429);
   if(q("SELECT 1 FROM player_controls WHERE (user_id=? AND target_id=? OR user_id=? AND target_id=?) AND blocked=1",u.id,t.id,t.id,u.id))fail('Player invitations are blocked.',403);
   if(q("SELECT id FROM marriage_invites WHERE sender_id=? AND status='pending' AND expires_at>?",u.id,clock()))fail('You already have an outstanding proposal. Cancel it first.',409);
   run('INSERT INTO marriage_invites(sender_id,recipient_id,cost,created_at,expires_at) VALUES(?,?,?,?,?)',u.id,t.id,WEDDING_COST,clock(),clock()+72*3600000);
   notify(t.id,'A marriage proposal',u.username+' invited you to marry. Open Marriage in the main menu. Nothing is charged until you accept.','/images/marriage-banner.png');return {ok:true,message:'Proposal sent. No money has been charged.'};
  });
  if(path==='/api/marriage/respond'&&req.method==='POST')return transaction(()=>{
   const i=q('SELECT * FROM marriage_invites WHERE id=?',Number(b.id)||0);if(!i||!['accept','decline','cancel'].includes(b.action)||(b.action==='cancel'?i.sender_id!==u.id:i.recipient_id!==u.id))fail('Proposal unavailable.',403);
   if(i.status==='accepted'&&b.action==='accept')return {ok:true,duplicate:true};if(i.status!=='pending'||i.expires_at<=clock())fail('This proposal has ended.',409);
   if(b.action!=='accept'){run('UPDATE marriage_invites SET status=? WHERE id=?',b.action,i.id);return {ok:true,message:'Proposal '+(b.action==='decline'?'declined':'cancelled')+'. No money charged.'};}
   const payer=settleRaw(i.sender_id),recipient=settleRaw(i.recipient_id);available(payer);available(recipient);if(payer.banned||recipient.banned||payer.deleted_at||recipient.deleted_at||married(payer.id)||married(recipient.id))fail('Both players must be active and unmarried.',409);
   if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',i.cost,payer.id,i.cost).changes)fail('The wedding payer no longer has enough cash.',409);
   const id=Number(run('INSERT INTO marriages(payer_id,partner_id,cost,started_at) VALUES(?,?,?,?)',payer.id,recipient.id,i.cost,clock()).lastInsertRowid);
   for(const idPlayer of [payer.id,recipient.id])run('INSERT INTO marriage_members VALUES(?,?)',idPlayer,id);
   run("UPDATE marriage_invites SET status='cancelled' WHERE status='pending' AND (sender_id IN (?,?) OR recipient_id IN (?,?))",payer.id,recipient.id,payer.id,recipient.id);run("UPDATE marriage_invites SET status='accepted' WHERE id=?",i.id);
   for(const player of [payer,recipient])notify(player.id,'Congratulations — married','Your wedding is complete. Both partners now earn +10% on eligible activity cash and XP.','/images/marriage-banner.png');
   return {ok:true,cost:i.cost,message:'Wedding completed. '+payer.username+' paid for both partners. +10% eligible cash and XP for each spouse.'};
  });
  if(path==='/api/marriage/divorce'&&req.method==='POST')return transaction(()=>{const m=married(u.id);if(!m||b.confirm!==true)fail('Confirm the end of your current marriage.');settleRaw(m.payer_id);settleRaw(m.partner_id);run('UPDATE marriages SET ended_at=? WHERE id=?',clock(),m.id);run('DELETE FROM marriage_members WHERE marriage_id=?',m.id);notify(m.spouse_id,'Marriage ended',u.username+' ended your marriage. Both marriage bonuses have stopped.','/images/marriage-banner.png');return {ok:true,message:'Marriage ended. No wedding refund; both bonuses have stopped.'};});
  return null;
 }
 return {route,bonus,married,record,award};
}
