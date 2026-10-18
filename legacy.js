import {installSeasonEvents,seasonPrizes} from './season-events.js';
import {progression} from './progression.js';

export const milestones=[
 {id:'art-crown-jewels',target:2,name:'Crown jewels of the underworld',title:'Sovereign Curator',key:'artCrownJewels',description:'Personally steal the Diamond Phoenix and Platinum Crown, then certify both as originals. Auction purchases do not count.',tab:'art-market',icon:'♛',theme:'amethyst'},
 {"id": "art-first", "target": 1, "name": "A discerning eye", "title": "Art Initiate", "key": "artOriginals", "description": "Hold 1 distinct appraised original artworks in your collection.", "tab": "art-market", "icon": "▧", "theme": "amethyst"},
 {"id": "art-five", "target": 5, "name": "Private gallery", "title": "Gallery Curator", "key": "artOriginals", "description": "Hold 5 distinct appraised original artworks in your collection.", "tab": "art-market", "icon": "▧", "theme": "amethyst"},
 {"id": "art-ten", "target": 10, "name": "An exceptional collection", "title": "Master Collector", "key": "artOriginals", "description": "Hold 10 distinct appraised original artworks in your collection.", "tab": "art-market", "icon": "▧", "theme": "amethyst"},
 {"id": "art-complete", "target": 25, "name": "The complete gallery", "title": "Keeper of the Twenty-Five", "key": "artOriginals", "description": "Hold 25 distinct appraised original artworks in your collection.", "tab": "art-market", "icon": "▧", "theme": "amethyst"},
 {"id": "pristine-first", "target": 1, "name": "A perfect recovery", "title": "Pristine Finder", "key": "pristineThefts", "description": "Steal 1 Pristine five-star vehicles yourself. Auction purchases do not count.", "tab": "warehouses", "icon": "✧", "theme": "sapphire"},
 {"id": "pristine-five", "target": 5, "name": "Flawless acquisitions", "title": "Flawless Collector", "key": "pristineThefts", "description": "Steal 5 Pristine five-star vehicles yourself. Auction purchases do not count.", "tab": "warehouses", "icon": "✧", "theme": "sapphire"},
 {"id": "pristine-twenty-five", "target": 25, "name": "Untouched legends", "title": "Pristine Kingpin", "key": "pristineThefts", "description": "Steal 25 Pristine five-star vehicles yourself. Auction purchases do not count.", "tab": "warehouses", "icon": "✧", "theme": "sapphire"},
 {id:'first-crime',name:'First footsteps',description:'Complete your first successful crime.',target:1,key:'crimes',title:'Street Initiate',icon:'♠',tab:'missions',intro:true},
 {id:'first-business',name:'Build your income',description:'Own your first business. Earn cash through crimes, then visit Businesses.',target:1,key:'businesses',title:'Entrepreneur',icon:'◆',tab:'business',intro:true},
 {id:'first-family',name:'Find your people',description:'Join or create a family. Joining an open family is free.',target:1,key:'family',title:'Family Loyalist',icon:'♜',tab:'families',intro:true,theme:'emerald'},
 {id:'first-team',name:'Stronger together',description:'Complete a successful team mission or joint family assault. Recruit your crew on Team missions.',target:1,key:'team',title:'Trusted Operative',icon:'⚑',tab:'team-missions',intro:true,theme:'onyx'},
 {id:'crime-100',name:'Made in the streets',description:'Complete 100 successful crimes.',target:100,key:'crimes',title:'Street Legend',icon:'★',tab:'missions'},
 {id:'business-4',name:'The portfolio',description:'Own four business copies at the same time.',target:4,key:'businesses',title:'Business Magnate',icon:'▣',tab:'business'},
 {id:'respect-10',name:'A name worth knowing',description:'Receive respect from players ten times.',target:10,key:'respect',title:'Respected Name',icon:'✦',tab:'respect'},
 {id:'millionaire',name:'Your first million',description:'Hold at least $1,000,000 in cash and bank combined.',target:1000000,key:'wealth',title:'Self Made',icon:'◇',tab:'bank'},
 {id:'collector',name:'The collection',description:'Own ten personal property copies at once.',target:10,key:'assets',title:'Private Collector',icon:'♛',tab:'inventory'},
 {id:'big-score',name:'Fortune favors the bold',description:'Hit your first Big Score in a crime.',target:1,key:'bigScores',title:'Lucky Legend',icon:'✧',tab:'missions'},
 {"id": "crime-10", "name": "Finding your feet", "description": "Complete 10 successful crimes.", "target": 10, "key": "crimes", "title": "Rising Operator", "icon": "♠", "tab": "missions"},
 {"id": "crime-500", "name": "City legend", "description": "Complete 500 successful crimes.", "target": 500, "key": "crimes", "title": "City Legend", "icon": "★", "tab": "missions", "theme": "sapphire"},
 {"id": "crime-1000", "name": "The long game", "description": "Complete 1,000 successful crimes.", "target": 1000, "key": "crimes", "title": "Criminal Icon", "icon": "♛", "tab": "missions", "theme": "ruby"},
 {"id": "shipment-1", "name": "First delivery", "description": "Complete one successful drugs or guns shipment.", "target": 1, "key": "shipments", "title": "Courier", "icon": "⚑", "tab": "shipments"},
 {"id": "shipment-25", "name": "Reliable connections", "description": "Complete 25 successful shipments.", "target": 25, "key": "shipments", "title": "Route Master", "icon": "◆", "tab": "shipments", "theme": "teal"},
 {"id": "shipment-100", "name": "Across the borders", "description": "Complete 100 successful shipments.", "target": 100, "key": "shipments", "title": "Global Connector", "icon": "✦", "tab": "shipments", "theme": "amethyst"},
 {"id": "first-home", "name": "A place of your own", "description": "Own a home.", "target": 1, "key": "homes", "title": "Estate Owner", "icon": "⌂", "tab": "home"},
 {"id": "first-car", "name": "Your first set of keys", "description": "Own a car.", "target": 1, "key": "cars", "title": "Night Driver", "icon": "◇", "tab": "car"},
 {"id": "first-jet", "name": "Above the city", "description": "Own a private jet.", "target": 1, "key": "jets", "title": "Sky Sovereign", "icon": "✧", "tab": "jet", "theme": "ice"},
 {"id": "first-yacht", "name": "Beyond the shore", "description": "Own a yacht.", "target": 1, "key": "yachts", "title": "Admiral", "icon": "⚓", "tab": "yacht", "theme": "ocean"},
 {"id": "business-12", "name": "An expanding empire", "description": "Own 12 business copies at once.", "target": 12, "key": "businesses", "title": "Empire Architect", "icon": "▣", "tab": "business", "theme": "copper"},
 {"id": "respect-50", "name": "A reputation earned", "description": "Receive player respect 50 times.", "target": 50, "key": "respect", "title": "Honor Keeper", "icon": "✦", "tab": "respect"},
 {"id": "respect-100", "name": "The name everyone knows", "description": "Receive player respect 100 times.", "target": 100, "key": "respect", "title": "Living Legend", "icon": "♛", "tab": "respect", "theme": "ivory"},
 {"id": "wealth-100m", "name": "Nine figures", "description": "Hold $100,000,000 in cash and bank combined.", "target": 100000000, "key": "wealth", "title": "Capital Baron", "icon": "◆", "tab": "bank"},
 {"id": "wealth-1b", "name": "The billionaires circle", "description": "Hold $1,000,000,000 in cash and bank combined.", "target": 1000000000, "key": "wealth", "title": "Billionaire", "icon": "♛", "tab": "bank"},
 {"id": "collection-25", "name": "A remarkable collection", "description": "Own 25 personal property copies at once.", "target": 25, "key": "assets", "title": "Connoisseur", "icon": "◇", "tab": "inventory"},
 {"id": "collection-50", "name": "A private dynasty", "description": "Own 50 personal property copies at once.", "target": 50, "key": "assets", "title": "Dynasty Curator", "icon": "♜", "tab": "inventory"},
 {"id": "big-score-10", "name": "A lucky streak", "description": "Hit 10 Big Scores.", "target": 10, "key": "bigScores", "title": "Fortune Hunter", "icon": "✧", "tab": "missions"},
 {"id": "big-score-50", "name": "Luck becomes legend", "description": "Hit 50 Big Scores.", "target": 50, "key": "bigScores", "title": "Golden Touch", "icon": "★", "tab": "missions"},
 {"id": "team-10", "name": "Brothers in arms", "description": "Complete 10 successful team missions or joint assaults.", "target": 10, "key": "team", "title": "Crew Commander", "icon": "⚑", "tab": "rivals"}
];
export const SEASON_LENGTH=28*86400000;
export function installLegacy(db,{marriageBonus=()=>1,clock,transaction,fail,settleWars,power,promote=()=>{}}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS achievement_xp_claims(user_id INTEGER NOT NULL REFERENCES users(id),milestone TEXT NOT NULL,xp INTEGER NOT NULL,claimed_at INTEGER NOT NULL,PRIMARY KEY(user_id,milestone));
 CREATE TABLE IF NOT EXISTS player_milestones(user_id INTEGER NOT NULL REFERENCES users(id),milestone TEXT NOT NULL,earned_at INTEGER NOT NULL,PRIMARY KEY(user_id,milestone));
 CREATE TABLE IF NOT EXISTS crime_big_scores(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),crime TEXT NOT NULL,reward INTEGER NOT NULL,xp INTEGER NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS family_respect_gifts(user_id INTEGER NOT NULL REFERENCES users(id),day TEXT NOT NULL,family_id INTEGER NOT NULL REFERENCES families(id),created_at INTEGER NOT NULL,PRIMARY KEY(user_id,day));
 CREATE TABLE IF NOT EXISTS family_seasons(id INTEGER PRIMARY KEY,starts_at INTEGER NOT NULL UNIQUE,ends_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'active');
 CREATE TABLE IF NOT EXISTS family_season_results(season_id INTEGER NOT NULL REFERENCES family_seasons(id),family_id INTEGER NOT NULL REFERENCES families(id),family_name TEXT NOT NULL,points INTEGER NOT NULL,wins INTEGER NOT NULL,battles INTEGER NOT NULL,rank INTEGER NOT NULL,trophy TEXT NOT NULL,PRIMARY KEY(season_id,family_id));
 CREATE TABLE IF NOT EXISTS world_chat(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),body TEXT NOT NULL,request_key TEXT NOT NULL,created_at INTEGER NOT NULL,hidden_by INTEGER REFERENCES users(id),UNIQUE(user_id,request_key));`);
 if(!q('SELECT id FROM family_seasons LIMIT 1')){const start=Math.floor(clock()/86400000)*86400000;run('INSERT INTO family_seasons(starts_at,ends_at) VALUES(?,?)',start,start+SEASON_LENGTH)}
 const seasons=installSeasonEvents(db,{clock});
 function sync(id){
  const u=q('SELECT cash,bank,respect_received FROM users WHERE id=?',id);if(!u)return [];
  const counts={crimes:q("SELECT COUNT(*) n FROM operation_history WHERE user_id=? AND kind='crime' AND success=1",id).n,businesses:q("SELECT COALESCE(SUM(quantity),0) n FROM possessions WHERE user_id=? AND category='business'",id).n,family:q('SELECT COUNT(*) n FROM family_members WHERE user_id=?',id).n,team:q("SELECT COUNT(*) n FROM operation_history WHERE user_id=? AND kind IN ('joint assault','crew mission') AND success=1",id).n,respect:u.respect_received,wealth:u.cash+u.bank,assets:q('SELECT COALESCE(SUM(quantity),0) n FROM possessions WHERE user_id=?',id).n,bigScores:q('SELECT COUNT(*) n FROM crime_big_scores WHERE user_id=?',id).n};
  counts.artCrownJewels=q("SELECT 1 FROM sqlite_master WHERE name='art_theft_history'")?q("SELECT COUNT(DISTINCT h.spec_id) n FROM art_theft_history h JOIN art_objects o ON o.id=h.object_id WHERE h.user_id=? AND h.spec_id IN ('diamond-phoenix','platinum-crown') AND o.authentic=1 AND o.appraised=1",id).n:0;
  counts.artOriginals=q("SELECT 1 FROM sqlite_master WHERE name='art_objects'")?q("SELECT COUNT(DISTINCT spec_id) n FROM art_objects WHERE user_id=? AND state='collection' AND appraised=1 AND authentic=1",id).n:0;
  counts.pristineThefts=q('SELECT COUNT(*) n FROM vehicle_thefts WHERE user_id=? AND stars=5',id).n;
  counts.shipments=q("SELECT COUNT(*) n FROM operation_history WHERE user_id=? AND kind='shipment' AND success=1",id).n;
  const ownedCategories=all('SELECT category,SUM(quantity) n FROM possessions WHERE user_id=? GROUP BY category',id);
  for(const [key,category] of [['homes','home'],['cars','car'],['jets','jet'],['yachts','yacht']])counts[key]=ownedCategories.find(x=>x.category===category)?.n||0;
  for(const x of milestones)if(counts[x.key]>=x.target)run('INSERT OR IGNORE INTO player_milestones VALUES(?,?,?)',id,x.id,clock());
  const earned=all('SELECT * FROM player_milestones WHERE user_id=?',id);
  const claimed=all('SELECT milestone FROM achievement_xp_claims WHERE user_id=?',id);
  return milestones.map(x=>({...x,xpReward:Math.floor((x.intro?500:x.theme?2000:1000)*marriageBonus(id)),xpClaimed:claimed.some(c=>c.milestone===x.id),progress:Math.min(x.target,counts[x.key]),earnedAt:earned.find(e=>e.milestone===x.id)?.earned_at||null}));
 }
 const titles=id=>sync(id).filter(x=>x.earnedAt).map(x=>({id:'achievement:'+x.id,name:x.title}));
 const themes=id=>sync(id).filter(x=>x.earnedAt&&x.theme).map(x=>x.theme);
 function respect(id){const m=q('SELECT family_id FROM family_members WHERE user_id=?',id);if(!m)return null;const total=q('SELECT COUNT(*) n FROM family_respect_gifts WHERE family_id=?',m.family_id).n+seasons.respect(m.family_id),thresholds=[0,5,15,30,60,100,175,275,400,600],names=['Unknown','Recognized','Connected','Respected','Established','Influential','Renowned','Legendary','Untouchable','Underworld Royalty'];let level=0;for(let i=0;i<thresholds.length;i++)if(total>=thresholds[i])level=i;return {total,level:level+1,name:names[level],next:thresholds[level+1]||null,givenToday:!!q('SELECT 1 FROM family_respect_gifts WHERE user_id=? AND day=?',id,new Date(clock()).toISOString().slice(0,10))}}
 function score(s){
  const rows=new Map(all('SELECT id,name FROM families').map(f=>[f.id,{familyId:f.id,name:f.name,points:0,wins:0,battles:0}]));
  for(const b of all('SELECT b.*,w.attacker_id war_attacker,w.defender_id war_defender FROM family_war_battles b JOIN family_wars w ON w.id=b.war_id WHERE b.created_at>=? AND b.created_at<?',s.starts_at,s.ends_at)){
   const winner=b.success?b.attacker_id:b.attacker_id===b.war_attacker?b.war_defender:b.war_attacker,row=rows.get(winner);
   if(row){row.points+=b.success?(b.kind==='capture'?3:b.kind==='sabotage'||b.kind==='joint assault'?2:1):1;row.battles++}
  }
  for(const w of all("SELECT winner_id FROM family_wars WHERE status<>'active' AND winner_id IS NOT NULL AND attacker_score+defender_score>0 AND ended_at>=? AND ended_at<?",s.starts_at,s.ends_at)){const row=rows.get(w.winner_id);if(row){row.wins++;row.points+=25}}
  const sorted=[...rows.values()].sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));let rank=0,previous=-1;return sorted.map((r,i)=>{if(r.points!==previous)rank=i+1;previous=r.points;return {...r,rank,trophy:r.points>0&&rank<=3?['Gold crown','Silver crest','Bronze rose'][rank-1]:''}});
 }
 function settleSeasons(){
  let s=q("SELECT * FROM family_seasons WHERE status='active' ORDER BY id DESC LIMIT 1");
  while(s.ends_at<=clock()){
   const rows=score(s);seasons.award(s,rows);
   for(const row of rows)if(row.points>0)run('INSERT OR IGNORE INTO family_season_results VALUES(?,?,?,?,?,?,?,?)',s.id,row.familyId,row.name,row.points,row.wins,row.battles,row.rank,row.trophy);
   run("UPDATE family_seasons SET status='completed' WHERE id=?",s.id);run('INSERT INTO family_seasons(starts_at,ends_at) VALUES(?,?)',s.ends_at,s.ends_at+SEASON_LENGTH);s=q("SELECT * FROM family_seasons WHERE status='active' ORDER BY id DESC LIMIT 1");
  }seasons.pay();for(const season of all('SELECT * FROM family_seasons WHERE id NOT IN (SELECT season_id FROM season_announcements)'))seasons.publish(season);return s;
 }
 function route(req,path,body,user){
  const method=req.method,id=user.id,params=new URL(req.url,'http://localhost').searchParams;
  if(method==='GET'&&path==='/api/achievements')return {milestones:sync(id)};
  if(method==='POST'&&path==='/api/achievements/claim')return transaction(()=>{
   const m=sync(id).find(x=>x.id===body.milestone);if(!m?.earnedAt)fail('Earn this achievement first.',403);if(m.xpClaimed)fail('This XP reward has already been claimed.',409);
   const before=q('SELECT xp,hospital_until,prison_until FROM users WHERE id=?',id);if(before.hospital_until>clock()||before.prison_until>clock())fail('Claim your reward after release.',409);
   const xp=Math.min(m.xpReward,1e12-before.xp);if(xp<m.xpReward)fail('Your XP balance is full.',409);
   run('INSERT INTO achievement_xp_claims VALUES(?,?,?,?)',id,m.id,xp,clock());run('UPDATE users SET xp=xp+? WHERE id=?',xp,id);promote(id,before.xp);
   return {ok:true,xp,message:m.name+' completed. +'+xp+' XP. Your permanent title and medal are unlocked.',image:'/images/scene-leaderboard.jpg'};
  });
  if(path==='/api/family/respect'&&method==='GET')return {respect:respect(id)};
  if(path==='/api/family/respect/give'&&method==='POST')return transaction(()=>{const m=q('SELECT family_id FROM family_members WHERE user_id=?',id);if(!m)fail('Join a family first.',403);const day=new Date(clock()).toISOString().slice(0,10);if(q('SELECT 1 FROM family_respect_gifts WHERE user_id=? AND day=?',id,day))fail('You already gave family respect today. It resets at 00:00 UTC.',409);run('INSERT INTO family_respect_gifts VALUES(?,?,?,?)',id,day,m.family_id,clock());return {ok:true,message:'Your family earned one respect. This is separate from donation respect and player respect.',respect:respect(id),image:'/images/scene-families.jpg'}});
  if(method==='GET'&&path==='/api/seasons'){
   settleWars();return transaction(()=>{const current=settleSeasons();return {current,prizes:seasonPrizes,honors:all('SELECT family_id FROM family_season_awards WHERE starts_at<=? AND expires_at>?',clock(),clock()).map(a=>({familyId:a.family_id,...seasons.honor(a.family_id)})),ranking:score(current),history:all("SELECT * FROM family_seasons WHERE status='completed' ORDER BY id DESC LIMIT 24").map(s=>({...s,results:all('SELECT r.*,a.cash prize_cash,a.paid prize_paid,a.respect prize_respect FROM family_season_results r LEFT JOIN family_season_awards a ON a.season_id=r.season_id AND a.family_id=r.family_id WHERE r.season_id=? ORDER BY r.rank,r.family_name',s.id)}))}});
  }
  if(method==='GET'&&path==='/api/directory'){
   const page=Number(params.get('page')||1),search=(params.get('search')||'').trim();if(!Number.isSafeInteger(page)||page<1||page>100000||search.length>30)fail('Invalid player search.');
   const term='%'+search.replace(/[\\%_]/g,'\\$&')+'%',total=q("SELECT COUNT(*) n FROM users WHERE banned=0 AND username LIKE ? ESCAPE '\\'",term).n;
   return {page,total,pages:Math.max(1,Math.ceil(total/30)),players:all("SELECT u.id,u.username,u.role,u.xp,u.cash,u.city,f.name family FROM users u LEFT JOIN family_members m ON m.user_id=u.id LEFT JOIN families f ON f.id=m.family_id WHERE u.banned=0 AND u.username LIKE ? ESCAPE '\\' ORDER BY u.username COLLATE NOCASE,u.id LIMIT 30 OFFSET ?",term,(page-1)*30).map(p=>({...p,rank:progression(p.xp).rank,power:power(p.id).total}))};
  }
  if(method==='GET'&&path==='/api/world-chat')return {messages:all('SELECT c.id,c.user_id,c.created_at,CASE WHEN c.hidden_by IS NULL THEN c.body ELSE \'[Message removed by staff]\' END body,c.hidden_by,u.username,u.role FROM world_chat c JOIN users u ON u.id=c.user_id ORDER BY c.id DESC LIMIT 100').reverse()};
  if(method==='POST'&&path==='/api/world-chat/send')return transaction(()=>{
   if(typeof body.text!=='string'||!body.text.trim()||body.text.length>1000||typeof body.key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.key))fail('Write 1–1,000 characters.');
   const old=q('SELECT * FROM world_chat WHERE user_id=? AND request_key=?',id,body.key);if(old){if(old.body!==body.text.trim())fail('Message request already used.',409);return {ok:true,id:old.id}}
   if((q('SELECT MAX(created_at) at FROM world_chat WHERE user_id=?',id)?.at||0)>clock()-5000)fail('Wait five seconds between world chat messages.',429);
   const r=run('INSERT INTO world_chat(user_id,body,request_key,created_at) VALUES(?,?,?,?)',id,body.text.trim(),body.key,clock());return {ok:true,id:Number(r.lastInsertRowid)};
  });
  if(method==='POST'&&path==='/api/world-chat/hide')return transaction(()=>{if(!['owner','admin'].includes(user.role))fail('Staff only.',403);if(!Number.isSafeInteger(body.id)||body.id<1)fail('Choose a message.');const message=q('SELECT c.*,u.role FROM world_chat c JOIN users u ON u.id=c.user_id WHERE c.id=?',body.id);if(!message)fail('Message not found.',404);if(user.role==='admin'&&message.role==='owner')fail('Owner messages are protected.',403);run('UPDATE world_chat SET hidden_by=? WHERE id=?',id,body.id);return {ok:true}});
  return null;
 }
 const tick=()=>{settleWars();return transaction(settleSeasons)};
 return {route,sync,titles,themes,respect,honor:seasons.honor,tick};
}
