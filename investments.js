import {summarizeTrade} from './trade-summary.js';
export const investmentTerms=[
 {hours:6,minBps:80,maxBps:140},{hours:12,minBps:150,maxBps:240},{hours:24,minBps:280,maxBps:400},{hours:48,minBps:450,maxBps:600},{hours:72,minBps:650,maxBps:800},
];
export const investmentLimit=10000000000000;
const respectThresholds=[0n,100000n,1000000n,10000000n,100000000n,1000000000n,10000000000n];
const respectNames=['New blood','Contributor','Trusted earner','Family benefactor','Inner circle','Pillar of the family','Legacy patron'];
export function respect(total='0'){
 const amount=BigInt(total),level=respectThresholds.findLastIndex(x=>amount>=x);
 return {level:level+1,name:respectNames[level],donated:amount.toString(),nextDonation:respectThresholds[level+1]?.toString()||null,payoutBonus:level*.02,chanceBonus:level*.005};
}
export function installInvestments(db,{supporterBonus=()=>1,transaction,settleRaw,familyMember,role,familyLog,log,draw,clock,blockedMillis,maxCash}){
 const q=(sql,...args)=>db.prepare(sql).get(...args),all=(sql,...args)=>db.prepare(sql).all(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
 transaction(()=>db.exec(`CREATE TABLE IF NOT EXISTS family_contributions(user_id INTEGER NOT NULL REFERENCES users(id),family_id INTEGER NOT NULL REFERENCES families(id),total TEXT NOT NULL DEFAULT '0',PRIMARY KEY(user_id,family_id));
  CREATE TABLE IF NOT EXISTS investments(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),family_id INTEGER REFERENCES families(id),principal INTEGER NOT NULL CHECK(principal BETWEEN 1 AND 1000000000),rate_bps INTEGER NOT NULL CHECK(rate_bps BETWEEN 0 AND 800),opened_at INTEGER NOT NULL,matures_at INTEGER NOT NULL,claimed INTEGER NOT NULL DEFAULT 0 CHECK(claimed IN (0,1)),CHECK((user_id IS NULL)!=(family_id IS NULL)));
  CREATE INDEX IF NOT EXISTS investments_personal ON investments(user_id,claimed);
  CREATE INDEX IF NOT EXISTS investments_family ON investments(family_id,claimed);
  CREATE TABLE IF NOT EXISTS investment_quotes(scope TEXT NOT NULL CHECK(scope IN ('personal','family')),account_id INTEGER NOT NULL,hours INTEGER NOT NULL,rate_bps INTEGER NOT NULL CHECK(rate_bps BETWEEN 0 AND 800),expires_at INTEGER NOT NULL,PRIMARY KEY(scope,account_id,hours));`));
 // Rebuild the old CHECK constraint atomically, retaining every existing position.
 const hasInterest=all('PRAGMA table_info(investments)').some(c=>c.name==='earned_interest');
 if(!/principal BETWEEN 1 AND 10000000000000\b/.test(q("SELECT sql FROM sqlite_master WHERE name='investments'").sql))transaction(()=>db.exec(`
  CREATE TABLE investments_v3(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),family_id INTEGER REFERENCES families(id),principal INTEGER NOT NULL CHECK(principal BETWEEN 1 AND ${investmentLimit}),rate_bps INTEGER NOT NULL CHECK(rate_bps BETWEEN 0 AND 800),opened_at INTEGER NOT NULL,matures_at INTEGER NOT NULL,claimed INTEGER NOT NULL DEFAULT 0 CHECK(claimed IN (0,1)),earned_interest INTEGER,CHECK((user_id IS NULL)!=(family_id IS NULL)));
  INSERT INTO investments_v3(id,user_id,family_id,principal,rate_bps,opened_at,matures_at,claimed,earned_interest) SELECT id,user_id,family_id,principal,rate_bps,opened_at,matures_at,claimed,${hasInterest?'earned_interest':'NULL'} FROM investments;
  DROP TABLE investments;
  ALTER TABLE investments_v3 RENAME TO investments;
  CREATE INDEX investments_personal ON investments(user_id,claimed);
  CREATE INDEX investments_family ON investments(family_id,claimed);
 `));
 if(!all('PRAGMA table_info(investments)').some(c=>c.name==='earned_interest'))db.exec('ALTER TABLE investments ADD COLUMN earned_interest INTEGER');
 for(const p of all('PRAGMA table_info(events)').some(c=>c.name==='message')?all('SELECT id,principal FROM investments WHERE claimed=1 AND earned_interest IS NULL'):[]){const record=q("SELECT message FROM events WHERE message LIKE ? ORDER BY created_at DESC,id DESC LIMIT 1",'Claimed investment #'+p.id+':%');const match=record?.message.match(/^Claimed investment #(\d+): \$(\d+) principal and \$(\d+) interest\.$/);if(match&&Number(match[1])===p.id&&Number(match[2])===p.principal)run('UPDATE investments SET earned_interest=? WHERE id=?',Number(match[3]),p.id);}
 function investmentTrade(a){const rows=all('SELECT * FROM investments WHERE '+a.column+'=?',a.id);return summarizeTrade(rows.map(p=>({id:String(p.rate_bps),name:(p.rate_bps/100).toFixed(2)+'%',invested:p.principal,received:p.claimed?p.principal+(p.earned_interest||0):0,closedCost:p.claimed&&p.earned_interest!==null?p.principal:0,closedReceived:p.claimed&&p.earned_interest!==null?p.principal+p.earned_interest:0})),{realized:true,missing:rows.filter(p=>p.claimed&&p.earned_interest===null).length,stock:rows.filter(p=>!p.claimed).map(p=>({id:String(p.rate_bps),name:(p.rate_bps/100).toFixed(2)+'%',cost:p.principal}))});}
 function performance(a){const rows=all('SELECT principal,earned_interest FROM investments WHERE '+a.column+'=? AND claimed=1 AND earned_interest IS NOT NULL',a.id),principal=rows.reduce((n,p)=>n+p.principal,0),profit=rows.reduce((n,p)=>n+p.earned_interest,0);return {profit,principal,margin:principal?profit/principal*100:0,count:rows.length};}
 function account(id,scope,manage=false){
  if(!['personal','family'].includes(scope))fail('Choose personal or family funds.');
  if(scope==='family'){const m=familyMember(id,manage);return {scope,id:m.family_id,column:'family_id',canManage:['don','capo'].includes(role(m))}}
  return {scope,id,column:'user_id',canManage:true};
 }
 const interest=p=>{const duration=Math.max(1,p.matures_at-p.opened_at),blocked=p.user_id?blockedMillis(p.user_id,p.opened_at,p.matures_at):0;return Math.floor(p.principal*p.rate_bps/10000*Math.max(0,duration-blocked)/duration)};
 const investments=a=>all('SELECT * FROM investments WHERE '+a.column+'=? AND claimed=0 ORDER BY matures_at',a.id).map(x=>({...x,interest:Math.floor(interest(x)*(x.user_id?supporterBonus(x.user_id):1)),ready:x.matures_at<=clock()}));
 function quotes(a){return investmentTerms.map(term=>{
  let quote=q('SELECT * FROM investment_quotes WHERE scope=? AND account_id=? AND hours=?',a.scope,a.id,term.hours);
  if(!quote||quote.expires_at<=clock()){
   run('INSERT INTO investment_quotes(scope,account_id,hours,rate_bps,expires_at) VALUES(?,?,?,?,?) ON CONFLICT(scope,account_id,hours) DO UPDATE SET rate_bps=excluded.rate_bps,expires_at=excluded.expires_at',a.scope,a.id,term.hours,draw(term.minBps,term.maxBps),clock()+15*60000);
   quote=q('SELECT * FROM investment_quotes WHERE scope=? AND account_id=? AND hours=?',a.scope,a.id,term.hours);
  }
  return {...term,rateBps:quote.rate_bps,expiresAt:quote.expires_at};
 })}
 function route(method,path,body,user){
  if(method==='GET'&&path==='/api/investments')return transaction(()=>{
   const personal=account(user.id,'personal'),member=q('SELECT family_id FROM family_members WHERE user_id=?',user.id);
   const accounts=[personal,...(member?[account(user.id,'family')]:[])];
   return {limit:investmentLimit,accounts:accounts.map(a=>{const positions=investments(a);return {trade:investmentTrade(a),performance:performance(a),scope:a.scope,canManage:a.canManage,available:a.scope==='personal'?q('SELECT cash FROM users WHERE id=?',a.id).cash:q('SELECT treasury FROM families WHERE id=?',a.id).treasury,activePrincipal:positions.reduce((n,x)=>n+x.principal,0),positions,quotes:quotes(a)}})};
  });
  if(method!=='POST'||!['/api/investments/open','/api/investments/claim'].includes(path))return null;
  return transaction(()=>{
   const a=account(user.id,body.scope,true),table=a.scope==='personal'?'users':'families',field=a.scope==='personal'?'cash':'treasury';
   settleRaw(user.id);
   if(path==='/api/investments/open'){
    if(!Number.isSafeInteger(body.amount)||body.amount<1||body.amount>investmentLimit||!investmentTerms.some(t=>t.hours===body.hours))fail('Choose a valid amount and a supported term of up to 72 hours.');
    const active=investments(a).reduce((n,x)=>n+x.principal,0);if(active+body.amount>investmentLimit)fail('Active investments are limited to $10,000,000,000,000 per account.',409);
    const quote=q('SELECT * FROM investment_quotes WHERE scope=? AND account_id=? AND hours=?',a.scope,a.id,body.hours);
    if(!quote||quote.expires_at<=clock()||body.rateBps!==quote.rate_bps)fail('Your quote expired or changed. Refresh investment rates before opening.',409);
    if(!run('UPDATE '+table+' SET '+field+'='+field+'-? WHERE id=? AND '+field+'>=?',body.amount,a.id,body.amount).changes)fail('Insufficient available funds.');
    const result=run('INSERT INTO investments('+a.column+',principal,rate_bps,opened_at,matures_at) VALUES(?,?,?,?,?)',a.id,body.amount,quote.rate_bps,clock(),clock()+body.hours*3600000);
    const message='Opened a '+body.hours+'-hour investment of $'+body.amount+' at '+quote.rate_bps/100+'% total return.';
    if(a.scope==='family')familyLog(a.id,user.username+': '+message);log(user.id,message);
    return {ok:true,id:Number(result.lastInsertRowid),rateBps:quote.rate_bps};
   }
   if(!Number.isSafeInteger(body.id)||body.id<1)fail('Choose a valid investment.');
   const position=q('SELECT * FROM investments WHERE id=? AND '+a.column+'=? AND claimed=0',body.id,a.id);
   if(!position)fail('Investment not found or already claimed.',409);if(position.matures_at>clock())fail('This investment has not matured yet.',409);
   const earnedInterest=Math.floor(interest(position)*(position.user_id?supporterBonus(position.user_id):1)),payout=position.principal+earnedInterest;
   if(!run('UPDATE '+table+' SET '+field+'='+field+'+? WHERE id=? AND '+field+'<=?',payout,a.id,maxCash-payout).changes)fail('Make room in the receiving balance before claiming. Your investment is safe.',409);
   run('UPDATE investments SET claimed=1,earned_interest=? WHERE id=?',earnedInterest,position.id);
   const message='Claimed investment #'+position.id+': $'+position.principal+' principal and $'+earnedInterest+' interest.';
   if(a.scope==='family')familyLog(a.id,user.username+': '+message);log(user.id,message);return {ok:true,payout,interest:earnedInterest};
  });
 }
 return {route};
}
