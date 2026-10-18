// Mutual family consent and deterministic leadership succession.
export function installDiplomacy(db){db.exec(`CREATE TABLE IF NOT EXISTS family_alliances(a INTEGER REFERENCES families(id),b INTEGER REFERENCES families(id),requested_by INTEGER NOT NULL,status TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(a,b),CHECK(a<b));`);}
export function allied(db,a,b){return !!db.prepare("SELECT 1 FROM family_alliances WHERE a=? AND b=? AND status='accepted'").get(Math.min(a,b),Math.max(a,b));}
export function assertHostile(db,a,b){if(allied(db,a,b))throw Object.assign(Error('Allied families cannot raid, capture territory or declare war on each other.'),{status:409});}
export function succeedDon(db,userId,clock,fail){
 const m=db.prepare('SELECT m.*,f.leader_id FROM family_members m JOIN families f ON f.id=m.family_id WHERE m.user_id=?').get(userId);if(!m)return;
 if(m.leader_id===userId){
  const next=db.prepare(`SELECT u.id,u.username FROM family_members m JOIN users u ON u.id=m.user_id LEFT JOIN family_contributions c ON c.user_id=u.id AND c.family_id=m.family_id WHERE m.family_id=? AND u.id<>? AND u.banned=0 ORDER BY CASE m.family_role WHEN 'capo' THEN 6 WHEN 'underboss' THEN 5 WHEN 'consigliere' THEN 4 WHEN 'enforcer' THEN 3 WHEN 'soldier' THEN 2 ELSE 1 END DESC,u.respect_received DESC,length(COALESCE(c.total,'0')) DESC,COALESCE(c.total,'0') DESC,u.xp DESC,u.id ASC LIMIT 1`).get(m.family_id,userId);
  if(!next)fail('Appoint or recruit an active successor before the last Don leaves, resets or deletes their account.',409);
  db.prepare('UPDATE families SET leader_id=? WHERE id=?').run(next.id,m.family_id);
  db.prepare("UPDATE family_members SET family_role='member' WHERE user_id=?").run(next.id);
  db.prepare('INSERT INTO family_events(family_id,message,created_at) VALUES(?,?,?)').run(m.family_id,next.username+' succeeded the departing Don. Highest role, then received respect, lifetime donations, XP and player ID break ties.',clock());
 }
 db.prepare('DELETE FROM family_members WHERE user_id=?').run(userId);
 db.prepare('UPDATE users SET family_join_after=? WHERE id=?').run(clock()+3600000,userId);
}
