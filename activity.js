// Read-only personal journal. Money is taken only from the append-only economy ledger.
// Narrative notices are never parsed into amounts and never affect the totals.
export const activityCategories=['all','money','danger','family','other'];
export const activityLabels={
 passive:'Hourly income collected',registration:'Starting balance',bank:'Bank transfer',
 'assets/buy':'Asset purchase','employees/hire':'Employee hired','armory/buy':'Armory purchase',
 action:'Crime result',pvp:'Player operation','crypto/trade':'Crypto trade',
 'production/start':'Production started','production/sell':'Production sale','production/ship':'Cargo dispatched',
 'shipments/run':'Shipment result','art/heist':'Art heist','art/appraise':'Art appraisal','art/list':'Auction listing',
 'art/bid':'Auction bid or refund','art-auction':'Art auction settlement','vehicle-auction':'Vehicle auction settlement',
 'vehicles/sell':'Vehicle sale','vehicles/ship':'Vehicle transport','vehicles/buy':'Vehicle purchase',
 'territory-income':'Family territory income',transfers:'Player transfer','family/donate':'Family donation',
 'custody/pay':'Release payment','bribery/pay':'Police bribe','airport/fly':'Flight payment',
 'investments':'Investment movement','midnight-circuit':'Race settlement',season:'Season reward',
 'daily/claim':'Daily reward','achievements/claim':'Achievement reward','gifts/collect':'Complimentary gift',
 'bounties/collect':'Bounty reward','system':'Recorded balance change'
};
export function activitySource(source){const key=String(source).split(':')[0];return activityLabels[key]||(/invest/.test(key)?'Investment movement':/casino|lottery/.test(key)?'Casino result':/circuit/.test(key)?'Race settlement':/family/.test(key)?'Family operation':/admin/.test(key)?'Staff adjustment':'Recorded balance change');}
const safe=n=>n<=BigInt(Number.MAX_SAFE_INTEGER)&&n>=BigInt(Number.MIN_SAFE_INTEGER)?Number(n):n.toString();

export function installActivity(db,{clock,fail}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a);

 for(const [name,type] of [['created_at','INTEGER NOT NULL DEFAULT 0'],['message',"TEXT NOT NULL DEFAULT ''"]])if(!all('PRAGMA table_info(events)').some(c=>c.name===name))db.exec('ALTER TABLE events ADD COLUMN '+name+' '+type);
 db.exec(`CREATE TABLE IF NOT EXISTS activity_notices(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,message TEXT NOT NULL,image TEXT NOT NULL,created_at INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS activity_archive_user ON activity_notices(user_id,created_at,id);INSERT OR IGNORE INTO activity_notices SELECT id,user_id,title,message,image,created_at FROM player_notifications;CREATE TRIGGER IF NOT EXISTS activity_notice_archive AFTER INSERT ON player_notifications BEGIN INSERT OR IGNORE INTO activity_notices VALUES(NEW.id,NEW.user_id,NEW.title,NEW.message,NEW.image,NEW.created_at);END;`);
 db.exec('CREATE INDEX IF NOT EXISTS activity_economy_user ON economy_ledger(scope,account_id,created_at,id); CREATE TABLE IF NOT EXISTS activity_logins(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,since_at INTEGER NOT NULL,login_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS activity_events_user ON events(user_id,created_at,id); CREATE INDEX IF NOT EXISTS activity_live_notices_user ON player_notifications(user_id,created_at,id)');
 function login(id){const user=q('SELECT last_seen,created_at FROM users WHERE id=?',id);if(!user)return;const now=clock(),since=Math.max(user.created_at||0,user.last_seen||now-86400000);db.prepare('INSERT INTO activity_logins VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET since_at=excluded.since_at,login_at=excluded.login_at').run(id,Math.min(now,since),now);}
 function view(req,u){const params=new URL(req.url||'/api/activity','http://localhost').searchParams,period=params.get('period')||'away',filter=params.get('filter')||'all',page=Number(params.get('page')||1);if(!['away','day','week'].includes(period)||!activityCategories.includes(filter)||!Number.isSafeInteger(page)||page<1||page>100000)fail('Invalid activity filter.');
  const now=clock(),anchor=q('SELECT * FROM activity_logins WHERE user_id=?',u.id),since=period==='away'?(anchor?.since_at||now-86400000):now-(period==='week'?7:1)*86400000;
  const totals={received:0n,spent:0n,net:0n,cash:0n,bank:0n,xp:0n};
  for(const row of db.prepare("SELECT cash_delta,bank_delta,xp_delta FROM economy_ledger WHERE scope='player' AND account_id=? AND created_at>=? AND created_at<=?").iterate(u.id,since,now)){const cash=BigInt(row.cash_delta),bank=BigInt(row.bank_delta),delta=cash+bank;totals.cash+=cash;totals.bank+=bank;totals.xp+=BigInt(row.xp_delta);totals.net+=delta;if(delta>0n)totals.received+=delta;else totals.spent-=delta;}
  // Category expressions are fixed SQL; only parameter values come from the client.
  const textCategory="CASE WHEN lower(coalesce(title,'')||' '||message||' '||coalesce(image,'')) GLOB '*family*' OR lower(message) GLOB '*territor*' THEN 'family' WHEN lower(coalesce(title,'')||' '||message) GLOB '*attack*' OR lower(message) GLOB '*arrest*' OR lower(message) GLOB '*prison*' OR lower(message) GLOB '*coma*' OR lower(message) GLOB '*intercept*' OR lower(message) GLOB '*robbed*' OR lower(message) GLOB '*liquidat*' OR lower(message) GLOB '*kidnap*' THEN 'danger' ELSE 'other' END";
  const moneySQL="SELECT 'money' kind,id,created_at,'money' category FROM economy_ledger WHERE scope='player' AND account_id=? AND created_at BETWEEN ? AND ?";
  const eventSQL="SELECT 'event' kind,id,created_at,"+textCategory+" category FROM (SELECT id,created_at,message,'' title,'' image FROM events WHERE user_id=? AND created_at BETWEEN ? AND ? AND NOT EXISTS(SELECT 1 FROM activity_notices n WHERE n.user_id=events.user_id AND n.created_at=events.created_at AND n.message=events.message))";
  const noticeSQL="SELECT 'notice' kind,id,created_at,"+textCategory+" category FROM activity_notices WHERE user_id=? AND created_at BETWEEN ? AND ?";
  const args=[u.id,since,now,u.id,since,now,u.id,since,now,filter,filter],union=`(${moneySQL} UNION ALL ${eventSQL} UNION ALL ${noticeSQL}) WHERE (?='all' OR category=?)`;
  const matching=q('SELECT COUNT(*) n FROM '+union,...args).n;
  const entries=all('SELECT * FROM '+union+' ORDER BY created_at DESC,kind,id DESC LIMIT 30 OFFSET ?',...args,(page-1)*30).map(ref=>{
   if(ref.kind==='money'){const r=q('SELECT * FROM economy_ledger WHERE id=?',ref.id);return {id:'money:'+r.id,at:r.created_at,category:'money',title:activitySource(r.source),source:r.source,cash:r.cash_delta,bank:r.bank_delta,xp:r.xp_delta,net:safe(BigInt(r.cash_delta)+BigInt(r.bank_delta)),message:'',image:null};}
   const r=ref.kind==='event'?q('SELECT message,created_at FROM events WHERE id=?',ref.id):q('SELECT title,message,image,created_at FROM activity_notices WHERE id=?',ref.id);return {id:ref.kind+':'+ref.id,at:r.created_at,category:ref.category,title:r.title||'Activity record',message:r.message,image:r.image||null,cash:0,bank:0,xp:0,net:0};
  });
  return {period,filter,page,pages:Math.max(1,Math.ceil(matching/30)),count:matching,since,until:now,loginAt:anchor?.login_at||null,recordedSince:Number(q("SELECT value FROM economy_meta WHERE key='started_at'")?.value||now),totals:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,safe(v)])),entries};
 }
 function route(req,path,b,u){if(path==='/api/activity'&&req.method==='GET')return view(req,u);return null;}
 return {route,view,login};
}
