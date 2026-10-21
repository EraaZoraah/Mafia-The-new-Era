// Exact, read-only monetary summaries. Never treat a quote as received cash.
export function summarizeTrade(rows,{stock=[],missing=0,realized=false}={}){
 const groups=new Map();
 const group=(id,name)=>{if(!groups.has(id))groups.set(id,{id,name,invested:0n,received:0n,closedCost:0n,closedReceived:0n,inventoryCost:0n,inventoryValue:0n,losses:0n});return groups.get(id);};
 for(const r of rows){const g=group(r.id,r.name);for(const k of ['invested','received','closedCost','closedReceived','losses'])g[k]+=BigInt(r[k]??0);}
 for(const r of stock){const g=group(r.id,r.name);g.inventoryCost+=BigInt(r.cost??0);g.inventoryValue+=BigInt(r.value??0);}
 const values=g=>({...g,net:g.received-g.invested,profit:realized?g.closedReceived-g.closedCost:null});
 const total={invested:0n,received:0n,closedCost:0n,closedReceived:0n,inventoryCost:0n,inventoryValue:0n,losses:0n};
 for(const g of groups.values())for(const k of Object.keys(total))total[k]+=g[k];
 const serial=g=>Object.fromEntries(Object.entries(values(g)).map(([k,v])=>[k,typeof v==='bigint'?v.toString():v]));
 return {...serial(total),missing,stockTracked:stock.length>0,items:[...groups.values()].map(serial)};
}

// Trading expense rows are already captured atomically by the wallet ledger.
// A lifecycle reset establishes a new reporting period for retained audit rows.
export function recordedTradeCosts(db,userId,prefixes){
 if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='economy_ledger'").get())return [];
 const period=db.prepare("SELECT 1 FROM sqlite_master WHERE name='trade_periods'").get()?db.prepare('SELECT ledger_after FROM trade_periods WHERE user_id=?').get(userId):null;
 const reset=db.prepare("SELECT 1 FROM sqlite_master WHERE name='player_lifecycle'").get()?db.prepare('SELECT MAX(created_at) at FROM player_lifecycle WHERE target_id=?').get(userId)?.at:0;
 return db.prepare("SELECT id,source,cash_delta,created_at FROM economy_ledger WHERE scope='player' AND account_id=? AND cash_delta<0 AND created_at>=? AND id>?").all(userId,period?0:reset||0,period?.ledger_after||0).filter(r=>prefixes.some(p=>r.source===p||r.source.startsWith(p+':')));
}

export function resetTradePeriod(db,userId){
 db.exec('CREATE TABLE IF NOT EXISTS trade_periods(user_id INTEGER PRIMARY KEY,ledger_after INTEGER NOT NULL,art_auction_after INTEGER NOT NULL)');
 const max=table=>db.prepare("SELECT 1 FROM sqlite_master WHERE name=?").get(table)?db.prepare('SELECT COALESCE(MAX(id),0) n FROM '+table).get().n:0;
 db.prepare('INSERT INTO trade_periods VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET ledger_after=excluded.ledger_after,art_auction_after=excluded.art_auction_after').run(userId,max('economy_ledger'),max('art_auctions'));
}
