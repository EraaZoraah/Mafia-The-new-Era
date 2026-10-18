import {assertHostile,installDiplomacy,succeedDon} from './diplomacy.js';
// All mutations run inside the caller's IMMEDIATE transaction.
export function raidChance(attackerPower,defenderPower,defense=0){
 const a=Math.max(1,attackerPower),d=Math.max(1,defenderPower);
 return Math.max(.01,Math.min(.95,(a/(a+d))*(1-defense)));
}
export function installFamilyWars(db,{clock,familyLog,notify,fail}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS family_wars(
 id INTEGER PRIMARY KEY,attacker_id INTEGER NOT NULL REFERENCES families(id),defender_id INTEGER NOT NULL REFERENCES families(id),
 started_at INTEGER NOT NULL,ends_at INTEGER NOT NULL,ended_at INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','surrendered')),
 attacker_score INTEGER NOT NULL DEFAULT 0,defender_score INTEGER NOT NULL DEFAULT 0,
 attacker_loot INTEGER NOT NULL DEFAULT 0,defender_loot INTEGER NOT NULL DEFAULT 0,winner_id INTEGER REFERENCES families(id),
 CHECK(attacker_id<>defender_id));
 CREATE INDEX IF NOT EXISTS family_wars_active ON family_wars(status,ends_at);
 CREATE TABLE IF NOT EXISTS family_war_battles(id INTEGER PRIMARY KEY,war_id INTEGER NOT NULL REFERENCES family_wars(id),
 actor_id INTEGER NOT NULL REFERENCES users(id),attacker_id INTEGER NOT NULL REFERENCES families(id),success INTEGER NOT NULL,
 loot INTEGER NOT NULL,chance REAL NOT NULL,attacker_power INTEGER NOT NULL,defender_power INTEGER NOT NULL,created_at INTEGER NOT NULL);`);
 for(const [name,type] of [['kind',"TEXT NOT NULL DEFAULT 'raid'"],['detail',"TEXT NOT NULL DEFAULT ''"]])if(!all('PRAGMA table_info(family_war_battles)').some(c=>c.name===name))db.exec('ALTER TABLE family_war_battles ADD COLUMN '+name+' '+type);
 const inform=(id,title,message)=>{familyLog(id,message);for(const m of all('SELECT user_id FROM family_members WHERE family_id=?',id))notify(m.user_id,title,message,'/images/scene-families.jpg')};
 function finish(w,status,winner){
  const endedAt=status==='completed'?w.ends_at:clock();
  run('UPDATE family_wars SET status=?,winner_id=?,ended_at=? WHERE id=? AND status=\'active\'',status,winner,endedAt,w.id);
  const message='War #'+w.id+' ended: '+(winner?(q('SELECT name FROM families WHERE id=?',winner)?.name||'Family')+' wins.':'draw.')+(winner?(w.attacker_score+w.defender_score)>0?' Winner receives +10% family shipment income for 24 hours.':' No income bonus: no battles were fought.':' No victory bonus for a draw.')+' Mutual ceasefire until '+new Date(endedAt+86400000).toISOString()+'.';
  inform(w.attacker_id,'Family war ended',message);inform(w.defender_id,'Family war ended',message);
 }
 function settle(){for(const w of all("SELECT * FROM family_wars WHERE status='active' AND ends_at<=?",clock()))finish(w,'completed',w.attacker_score===w.defender_score?null:w.attacker_score>w.defender_score?w.attacker_id:w.defender_id)}
 const active=id=>q("SELECT * FROM family_wars WHERE status='active' AND (attacker_id=? OR defender_id=?)",id,id);
 const truce=(a,b)=>q("SELECT MAX(ended_at+86400000) until FROM family_wars WHERE status<>'active' AND ((attacker_id=? AND defender_id=?) OR (attacker_id=? AND defender_id=?))",a,b,b,a)?.until||0;
 function declare(from,target){assertHostile(db,from.id,target.id);
  settle();if(active(from.id)||active(target.id))fail('Each family can fight one active war at a time.',409);
  if(truce(from.id,target.id)>clock())fail('A 24-hour ceasefire is still active between these families.',409);
  if(from.created_at>clock()-3600000||target.created_at>clock()-3600000)fail('New families have one hour of protection.',409);
  const result=run('INSERT INTO family_wars(attacker_id,defender_id,started_at,ends_at) VALUES(?,?,?,?)',from.id,target.id,clock(),clock()+86400000);
  const message=from.name+' declared a 24-hour war on '+target.name+'. Successful raids score one point; failed raids score one point for the defending family.';
  inform(from.id,'War declared',message);inform(target.id,'War declared',message);return {ok:true,warId:Number(result.lastInsertRowid),message,image:'/images/scene-families.jpg'};
 }
 function surrender(id){settle();const w=active(id);if(!w)fail('Your family has no active war.',409);finish(w,'surrendered',w.attacker_id===id?w.defender_id:w.attacker_id);return {ok:true,message:'Your family surrendered. A 24-hour ceasefire is active.',image:'/images/scene-families.jpg'}}
 function record(from,target,actor,success,loot,chance,a,d,kind='raid',points=1,detail=''){
  const w=active(from);if(!w||![w.attacker_id,w.defender_id].includes(target))return null;
  const side=from===w.attacker_id?'attacker':'defender',scorer=success?side:side==='attacker'?'defender':'attacker';
  run(`UPDATE family_wars SET ${scorer}_score=${scorer}_score+?,${side}_loot=${side}_loot+? WHERE id=?`,success?points:1,loot,w.id);
  run('INSERT INTO family_war_battles(war_id,actor_id,attacker_id,success,loot,chance,attacker_power,defender_power,created_at,kind,detail) VALUES(?,?,?,?,?,?,?,?,?,?,?)',w.id,actor,from,success?1:0,loot,chance,a,d,clock(),kind,detail);return w.id;
 }
 function history(id){return all('SELECT w.*,a.name attacker_name,d.name defender_name FROM family_wars w JOIN families a ON a.id=w.attacker_id JOIN families d ON d.id=w.defender_id WHERE attacker_id=? OR defender_id=? ORDER BY w.id DESC LIMIT 20',id,id).map(w=>({...w,battles:all('SELECT b.*,u.username,f.name attacker_name FROM family_war_battles b JOIN users u ON u.id=b.actor_id JOIN families f ON f.id=b.attacker_id WHERE war_id=? ORDER BY b.id DESC LIMIT 50',w.id)}))}
 function stats(id){const raids=q('SELECT COUNT(*) attempts,COALESCE(SUM(success),0) successes FROM family_raid_history WHERE attacker_family=?',id);return {wins:q("SELECT COUNT(*) n FROM family_wars WHERE winner_id=? AND status<>'active'",id).n,...raids,successRate:raids.attempts?raids.successes/raids.attempts:0,bonusUntil:q("SELECT COALESCE(MAX(ended_at+86400000),0) until FROM family_wars WHERE winner_id=? AND status<>'active' AND attacker_score+defender_score>0",id).until}}
 return {stats,settle,active,truce,declare,surrender,record,history,inform};
}
