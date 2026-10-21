import {summarizeTrade} from './trade-summary.js';
export function installVehicleTradeRecords(db,{clock,catalog,stolenVehicles,transaction}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS vehicle_trade_receipts(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,model TEXT NOT NULL,spent INTEGER NOT NULL DEFAULT 0,received INTEGER NOT NULL DEFAULT 0,legacy_event_id INTEGER UNIQUE,created_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS vehicle_trade_owner ON vehicle_trade_receipts(user_id,kind);
 CREATE TABLE IF NOT EXISTS vehicle_trade_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
 function record(userId,kind,model,spent,received,legacy=null,at=clock()){
  run('INSERT INTO vehicle_trade_receipts(user_id,kind,model,spent,received,legacy_event_id,created_at) VALUES(?,?,?,?,?,?,?)',userId,kind,model,spent,received,legacy,at);
 }
 if(!q("SELECT 1 FROM vehicle_trade_meta WHERE key='verified-history-v1'"))transaction(()=>{
  const columns=all('PRAGMA table_info(events)').map(c=>c.name);
  if(['id','user_id','message','created_at'].every(c=>columns.includes(c)))for(const e of all("SELECT * FROM events WHERE message LIKE 'Purchased %' OR message LIKE 'Sold %' ORDER BY id")){
   const amount=e.message.match(/ for \$(\d+)\.$/);if(!amount||!Number.isSafeInteger(Number(amount[1])))continue;
   const recovered=stolenVehicles.find(c=>e.message.startsWith('Sold recovered '+c.name+' in '));
   const purchased=catalog.find(c=>c.category==='car'&&(e.message.startsWith('Sold '+c.name+' for $')||e.message.startsWith('Purchased 1 ')&&e.message.endsWith(' '+c.name+' for $'+amount[1]+'.')));
   if(recovered)record(e.user_id,'recovered',recovered.id,0,Number(amount[1]),e.id,e.created_at);
   else if(purchased)record(e.user_id,'purchased',purchased.id,e.message.startsWith('Purchased ')?Number(amount[1]):0,e.message.startsWith('Sold ')?Number(amount[1]):0,e.id,e.created_at);
  }
  if(q("SELECT 1 FROM sqlite_master WHERE name='economy_ledger'"))for(const r of all("SELECT account_id,cash_delta,created_at FROM economy_ledger WHERE scope='player' AND source='vehicles/ship' AND cash_delta<0"))record(r.account_id,'recovered','transport',-r.cash_delta,0,null,r.created_at);
  for(const a of all('SELECT a.*,v.vehicle_id model FROM vehicle_auctions a JOIN vehicle_loot v ON v.id=a.vehicle_id')){
   record(a.seller_id,'recovered',a.model,a.listing_fee,0,null,a.ends_at);
   if(a.state==='sold'){record(a.seller_id,'recovered',a.model,0,a.bid-Number(BigInt(a.bid)*3n/100n),null,a.ends_at);record(a.bidder_id,'recovered',a.model,a.bid,0,null,a.ends_at);}
  }
  run("INSERT INTO vehicle_trade_meta VALUES('verified-history-v1',?)",String(clock()));
 });
 function summary(id,kind){
  const names=new Map([...catalog,...stolenVehicles].map(c=>[c.id,c.name]));names.set('transport','Vehicle transport');
  const rows=all('SELECT * FROM vehicle_trade_receipts WHERE user_id=? AND kind=?',id,kind).map(r=>({id:r.model,name:names.get(r.model)||r.model,invested:r.spent,received:r.received}));
  return summarizeTrade(rows);
 }
 return {record,summary};
}
