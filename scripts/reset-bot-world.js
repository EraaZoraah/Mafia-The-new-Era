// Explicit maintenance operation; never runs at startup or on deployment.
import {DatabaseSync,backup} from 'node:sqlite';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {installGame} from '../game.js';
import {gameClient,installBotSchema} from '../bot-players.js';
const apply=process.argv.includes('--apply'),input=process.argv.find(a=>a.startsWith('--db='))?.slice(5)||'data/mafia.sqlite';
const file=resolve(input),db=new DatabaseSync(file,{readOnly:!apply});db.exec('PRAGMA foreign_keys=ON;PRAGMA busy_timeout=10000');
const all=(s,...v)=>db.prepare(s).all(...v),q=(s,...v)=>db.prepare(s).get(...v),run=(s,...v)=>db.prepare(s).run(...v);
const now=Date.now(),batch='fresh-bot-world-2026-10-14';
if(q("SELECT 1 FROM sqlite_master WHERE name='bot_meta'")&&q("SELECT 1 FROM bot_meta WHERE key=?",batch)){console.log('Already applied. No accounts changed.');db.close();process.exit(0);}
const owners=all("SELECT * FROM users WHERE role='owner'"),targets=all("SELECT id,username,role,email FROM users WHERE role<>'owner' AND deleted_at=0"),tests=new Set();
if(!owners.length)throw Error('No Owner. Reset refused.');
if(q("SELECT 1 FROM sqlite_master WHERE name='test_seed_batches'"))for(const b of all('SELECT manifest FROM test_seed_batches'))for(const p of JSON.parse(b.manifest).players||[])tests.add(p.id);
const testTargets=targets.filter(p=>tests.has(p.id)&&p.role==='player');
console.log(JSON.stringify({database:file,owners:owners.map(p=>p.username),removeTestAccounts:testTargets.length,resetPlayers:targets.filter(p=>!tests.has(p.id)).map(p=>p.username),createBots:50,silver:6,gold:4,apply},null,2));
if(!apply){db.close();process.exit(0);}
mkdirSync('backups',{recursive:true});const backupPath=resolve('backups/before-bot-reset-'+now+'.sqlite');await backup(db,backupPath);
const game=installGame(db,{hash:()=>{throw Error('Unexpected password change')},clock:()=>now,log:(id,message)=>run('INSERT INTO events(user_id,message,created_at) VALUES(?,?,?)',id,message,now),json:(_res,status,body)=>({status,body})}),call=gameClient(db,game);installBotSchema(db);
const ownerRows=JSON.stringify(all("SELECT * FROM users WHERE role='owner' ORDER BY id"));
const ownerAssets=JSON.stringify(all("SELECT * FROM possessions WHERE user_id IN(SELECT id FROM users WHERE role='owner') ORDER BY user_id,item_id"));
const ownerFamilies=JSON.stringify(all("SELECT * FROM families WHERE leader_id IN(SELECT id FROM users WHERE role='owner') ORDER BY id"));
const tables=all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(t=>t.name),quote=s=>'"'+s.replaceAll('"','""')+'"';
const deleting=new Set();
function cascade(table,rows){for(const row of rows){const key=table+':'+row._rowid_;if(deleting.has(key))continue;deleting.add(key);
 for(const child of tables){const groups=new Map();for(const fk of all('PRAGMA foreign_key_list('+quote(child)+')'))if(fk.table===table){const list=groups.get(fk.id)||[];list.push(fk);groups.set(fk.id,list);}
  for(const fks of groups.values()){const cols=all('PRAGMA table_info('+quote(table)+')').filter(c=>c.pk).sort((a,b)=>a.pk-b.pk);const values=fks.map((fk,i)=>row[fk.to||cols[i].name]);if(values.some(v=>v==null))continue;cascade(child,all('SELECT rowid _rowid_,* FROM '+quote(child)+' WHERE '+fks.map(f=>quote(f.from)+'=?').join(' AND '),...values));}}
 run('DELETE FROM '+quote(table)+' WHERE rowid=?',row._rowid_);
}}
db.exec('BEGIN EXCLUSIVE;PRAGMA defer_foreign_keys=ON');
try{
 // Non-Owner families are part of the fresh start. Preserve the Owner's family.
 for(const f of all("SELECT rowid _rowid_,* FROM families WHERE leader_id NOT IN(SELECT id FROM users WHERE role='owner')"))cascade('families',[f]);
 run("DELETE FROM family_members WHERE user_id IN(SELECT id FROM users WHERE role<>'owner')");
 for(const p of targets){const response=call(owners[0].id,'admin/player-lifecycle',{id:p.id,action:tests.has(p.id)&&p.role==='player'?'delete':'reset',confirm:true,confirmName:p.username});if(response.status!==200)throw Error(p.username+': '+JSON.stringify(response));
  for(const table of ['supporter_memberships','shop_entitlements','player_active_days','daily_claims','news_seen'])if(tables.includes(table)&&all('PRAGMA table_info('+quote(table)+')').some(c=>c.name==='user_id'))run('DELETE FROM '+quote(table)+' WHERE user_id=?',p.id);
  run('UPDATE users SET last_seen=0,online_until=0,play_ms=0,family_join_after=0 WHERE id=?',p.id);
 }
 const first=['Vito','Luca','Salvatore','Enzo','Marco','Dante','Carlo','Nico','Rocco','Vincenzo','Rosa','Bianca','Lucia','Sofia','Valentina','Alessio','Giovanni','Antonio','Francesca','Isabella','Matteo','Pietro','Santino','Carmine','Domenico'];
 const last=['Moretti','Bellini','Falcone','Romano','Vitale','DeLuca','Marino','Ricci','Conti','Lombardi','Ferraro','Greco','Mancini','Costa','Russo','Gallo','Rizzo','Bruno','Serra','Bianchi','Fontana','Caruso','Santoro','Leone','Valenti'];
 const bots=[];
 for(let i=0;i<50;i++){
  const username=first[i%25]+' '+last[(i*7+Math.floor(i/25))%25];if(q('SELECT 1 FROM users WHERE username=?',username))throw Error('Name collision: '+username);
  const id=Number(run("INSERT INTO users(username,email,password,role,cash,bank,xp,energy,health,city,created_at,energy_at,health_at) VALUES(?,?,?,'player',5000,0,0,100,100,'New York',?,?,?)",username,'bot-'+i+'-'+now+'@mafia.invalid',randomBytes(64).toString('hex'),now,now,now).lastInsertRowid);
  run('INSERT INTO bot_players(user_id,personality,next_at) VALUES(?,?,?)',id,['builder','trader','enforcer','leader','gambler'][i%5],now+(i+1)*60000);
  call(id,'armory');let product=null;
  if(i<10){product=i<6?'supporter':'grand-supporter';const r=call(owners[0].id,'admin/shop/grant',{recipient:username,product,key:batch+'-'+i,reason:'One-month bot playtest membership'});if(r.status!==200)throw Error(JSON.stringify(r));}
  bots.push({id,username,personality:['builder','trader','enforcer','leader','gambler'][i%5],membership:product});
 }
 run("INSERT INTO bot_meta VALUES('enabled','true') ON CONFLICT(key) DO UPDATE SET value='true'");run('INSERT INTO bot_meta VALUES(?,?)',batch,String(now));
 if(JSON.stringify(all("SELECT * FROM users WHERE role='owner' ORDER BY id"))!==ownerRows||JSON.stringify(all("SELECT * FROM possessions WHERE user_id IN(SELECT id FROM users WHERE role='owner') ORDER BY user_id,item_id"))!==ownerAssets||JSON.stringify(all("SELECT * FROM families WHERE leader_id IN(SELECT id FROM users WHERE role='owner') ORDER BY id"))!==ownerFamilies)throw Error('Owner preservation check failed; rolling back.');
 if(all('PRAGMA foreign_key_check').length)throw Error('Foreign key check failed');
 db.exec('COMMIT');mkdirSync('art',{recursive:true});writeFileSync('art/bot-world-reset.json',JSON.stringify({database:file,backup:backupPath,createdAt:now,removed:testTargets.map(p=>p.username),reset:targets.filter(p=>!tests.has(p.id)).map(p=>p.username),ownersPreserved:owners.map(p=>p.username),bots},null,2));console.log('Committed. Owner verified unchanged. Backup: '+backupPath);
}catch(e){db.exec('ROLLBACK');throw e}finally{db.close()}
