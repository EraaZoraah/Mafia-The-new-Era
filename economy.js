// Append-only wallet/XP changes. No reconstructed history or parsing of log text.
export function installEconomy(db,{clock,fail}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS economy_context(id INTEGER PRIMARY KEY CHECK(id=1),source TEXT NOT NULL,at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS economy_ledger(id INTEGER PRIMARY KEY,scope TEXT NOT NULL,account_id INTEGER NOT NULL,source TEXT NOT NULL,cash_delta INTEGER NOT NULL,bank_delta INTEGER NOT NULL,xp_delta INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS economy_time ON economy_ledger(created_at,source);
 CREATE INDEX IF NOT EXISTS economy_account_source ON economy_ledger(scope,account_id,source,id);
 CREATE TABLE IF NOT EXISTS economy_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
 run("INSERT OR IGNORE INTO economy_meta VALUES('started_at',?)",String(clock()));run("INSERT OR REPLACE INTO economy_context VALUES(1,'system',?)",clock());
 db.exec(`CREATE TRIGGER IF NOT EXISTS economy_player_created AFTER INSERT ON users BEGIN INSERT INTO economy_ledger(scope,account_id,source,cash_delta,bank_delta,xp_delta,created_at) SELECT 'player',NEW.id,source,NEW.cash,NEW.bank,NEW.xp,at FROM economy_context WHERE id=1; END;
 CREATE TRIGGER IF NOT EXISTS economy_player AFTER UPDATE OF cash,bank,xp ON users WHEN NEW.cash<>OLD.cash OR NEW.bank<>OLD.bank OR NEW.xp<>OLD.xp BEGIN INSERT INTO economy_ledger(scope,account_id,source,cash_delta,bank_delta,xp_delta,created_at) SELECT 'player',NEW.id,source,NEW.cash-OLD.cash,NEW.bank-OLD.bank,NEW.xp-OLD.xp,at FROM economy_context WHERE id=1; END;
 CREATE TRIGGER IF NOT EXISTS economy_family AFTER UPDATE OF treasury ON families WHEN NEW.treasury<>OLD.treasury BEGIN INSERT INTO economy_ledger(scope,account_id,source,cash_delta,bank_delta,xp_delta,created_at) SELECT 'family',NEW.id,source,NEW.treasury-OLD.treasury,0,0,at FROM economy_context WHERE id=1; END;`);
 const source=value=>run('UPDATE economy_context SET source=?,at=? WHERE id=1',value,clock());
 function withSource(value,fn){const old=q('SELECT source FROM economy_context WHERE id=1').source;source(value);try{return fn()}finally{source(old)}}
 function route(req,path,b,user){if(path!=='/api/admin/economy/activity'||req.method!=='GET')return null;if(!['owner','admin'].includes(user.role))fail('Staff access required.',403);const days=Number(new URL(req.url||path,'http://localhost').searchParams.get('days')||7);if(![1,7,28].includes(days))fail('Choose 1, 7 or 28 days.');const since=clock()-days*86400000;
  const grouped=new Map();
  for(const row of all('SELECT scope,source,cash_delta,bank_delta,xp_delta FROM economy_ledger WHERE created_at>=?',since)){
   const key=row.scope+'|'+row.source,v=grouped.get(key)||{scope:row.scope,source:row.source,changes:0,earned:0n,spent:0n,net:0n,xp:0n},delta=BigInt(row.cash_delta)+BigInt(row.bank_delta);
   v.changes++;v.earned+=delta>0n?delta:0n;v.spent+=delta<0n?-delta:0n;v.net+=delta;v.xp+=BigInt(row.xp_delta);grouped.set(key,v);
  }
  const flows=[...grouped.values()].sort((a,b)=>a.earned===b.earned?0:a.earned>b.earned?-1:1).map(v=>Object.fromEntries(Object.entries(v).map(([k,n])=>[k,typeof n==='bigint'?(n<=BigInt(Number.MAX_SAFE_INTEGER)&&n>=BigInt(Number.MIN_SAFE_INTEGER)?Number(n):n.toString()):n])));

  return {days,startedAt:Number(q("SELECT value FROM economy_meta WHERE key='started_at'").value),flows,activity:all('SELECT kind,COUNT(*) attempts,SUM(success) successes FROM operation_history WHERE created_at>=? GROUP BY kind ORDER BY attempts DESC',since),growth:all("SELECT u.id,u.username,u.xp,SUM(l.xp_delta) gained FROM economy_ledger l JOIN users u ON u.id=l.account_id WHERE l.scope='player' AND l.created_at>=? AND u.deleted_at=0 GROUP BY u.id HAVING gained>0 ORDER BY gained DESC LIMIT 20",since),note:'Wallet inflows/outflows, not all new money: bank movements net to zero; transfers, investments, assets surrendered and staff changes are listed separately. Growth includes staff XP changes under their own source. History begins when this update is installed.'};
 }
 return {source,withSource,route};
}
