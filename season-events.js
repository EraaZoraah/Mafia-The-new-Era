import {MAX_CASH} from './money.js';
export const seasonPrizes=[{cash:100000000,respect:100,title:'Reigning Champions',medal:'🥇'},{cash:50000000,respect:60,title:'Silver Dynasty',medal:'🥈'},{cash:25000000,respect:30,title:'Bronze Alliance',medal:'🥉'}];
export function installSeasonEvents(db,{clock}){
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 db.exec(`CREATE TABLE IF NOT EXISTS family_season_awards(season_id INTEGER NOT NULL REFERENCES family_seasons(id),family_id INTEGER NOT NULL REFERENCES families(id),rank INTEGER NOT NULL,cash INTEGER NOT NULL,paid INTEGER NOT NULL DEFAULT 0,respect INTEGER NOT NULL,title TEXT NOT NULL,medal TEXT NOT NULL,starts_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,PRIMARY KEY(season_id,family_id));
 CREATE TABLE IF NOT EXISTS season_announcements(season_id INTEGER PRIMARY KEY REFERENCES family_seasons(id),bulletin_id INTEGER NOT NULL UNIQUE REFERENCES bulletins(id));`);
 function award(season,rows){
  for(const rank of [1,2,3]){
   const tied=rows.filter(r=>r.points>0&&r.rank===rank).sort((a,b)=>a.familyId-b.familyId);if(!tied.length)continue;
   const pool=seasonPrizes.slice(rank-1,rank-1+tied.length),cash=pool.reduce((n,p)=>n+p.cash,0),respect=pool.reduce((n,p)=>n+p.respect,0),prize=seasonPrizes[rank-1];
   tied.forEach((r,i)=>run('INSERT OR IGNORE INTO family_season_awards(season_id,family_id,rank,cash,respect,title,medal,starts_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)',season.id,r.familyId,rank,Math.floor(cash/tied.length)+(i<cash%tied.length?1:0),Math.floor(respect/tied.length)+(i<respect%tied.length?1:0),prize.title,prize.medal,season.ends_at,season.ends_at+28*86400000));
  }
 }
 function pay(){for(const a of all('SELECT * FROM family_season_awards WHERE paid<cash ORDER BY season_id,family_id')){const amount=Math.min(a.cash-a.paid,Math.max(0,MAX_CASH-q('SELECT treasury FROM families WHERE id=?',a.family_id).treasury));if(amount){run('UPDATE families SET treasury=treasury+? WHERE id=?',amount,a.family_id);run('UPDATE family_season_awards SET paid=paid+? WHERE season_id=? AND family_id=?',amount,a.season_id,a.family_id)}}}
 function publish(s){
  if(q('SELECT 1 FROM season_announcements WHERE season_id=?',s.id))return;
  const owner=q("SELECT id FROM users WHERE role='owner' AND banned=0 ORDER BY id LIMIT 1");if(!owner)return;
  const previous=q('SELECT * FROM family_seasons WHERE ends_at=? AND status=?',s.starts_at,'completed'),results=previous?all('SELECT r.*,a.cash,a.respect FROM family_season_results r LEFT JOIN family_season_awards a ON a.season_id=r.season_id AND a.family_id=r.family_id WHERE r.season_id=? ORDER BY r.rank,r.family_name',previous.id):[];
  const recap=previous?`Season ${previous.id} results:\n`+(results.slice(0,12).map(r=>`#${r.rank} ${r.family_name}: ${r.points} points${r.cash!=null?` — $${r.cash.toLocaleString('en-US')} and ${r.respect} family respect`:''}.`).join('\n')||'No scoring families; no prizes awarded.')+(results.length>12?'\nFull results are in Family seasons.':''):'The first family season begins. Write the first chapter of city history.';
  const body=`${recap}\n\nSeason ${s.id} is now open, until ${new Date(s.ends_at).toISOString().slice(0,16).replace('T',' ')} UTC.\nWhich family will take the lead this season?\n\n1st: $100,000,000 + 100 family respect.\n2nd: $50,000,000 + 60 family respect.\n3rd: $25,000,000 + 30 family respect.\nWinners receive a medal and a family title for the next season; archived trophies remain permanent. Ties share the prize pool of the places occupied. Positive season points are required. Permanent possessions are preserved.`;
  const id=run("INSERT INTO bulletins(author_id,kind,title,body,status,starts_at,ends_at,popup,updated_at) VALUES(?,'event',?,?,'published',?,?,1,?)",owner.id,`Family season ${s.id} — a new crown awaits`,body,s.starts_at,s.ends_at,clock()).lastInsertRowid;
  run('INSERT INTO season_announcements VALUES(?,?)',s.id,id);
 }
 const honor=id=>q('SELECT season_id,rank,title,medal,expires_at FROM family_season_awards WHERE family_id=? AND starts_at<=? AND expires_at>? ORDER BY season_id DESC LIMIT 1',id,clock(),clock())||null;
 const respect=id=>q('SELECT COALESCE(SUM(respect),0) n FROM family_season_awards WHERE family_id=?',id).n;
 return {award,pay,publish,honor,respect};
}
