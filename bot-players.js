import {randomInt,randomUUID} from 'node:crypto';
import {catalog} from './catalog.js';
import {familyAssets} from './empire-catalog.js';
import {crewMissions} from './crew-operations.js';
import {autonomousMove,botDomains} from './bot-autonomy.js';
export function installBotSchema(db){
 db.exec(`CREATE TABLE IF NOT EXISTS bot_players(user_id INTEGER PRIMARY KEY REFERENCES users(id),enabled INTEGER NOT NULL DEFAULT 1,personality TEXT NOT NULL, next_at INTEGER NOT NULL,session_until INTEGER NOT NULL DEFAULT 0,last_action TEXT NOT NULL DEFAULT '',last_status INTEGER NOT NULL DEFAULT 0,last_error TEXT NOT NULL DEFAULT '',actions INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS bot_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
 if(!db.prepare('PRAGMA table_info(bot_players)').all().some(c=>c.name==='activity'))db.exec('ALTER TABLE bot_players ADD COLUMN activity INTEGER NOT NULL DEFAULT 100');
 db.exec(`CREATE TABLE IF NOT EXISTS bot_decisions(user_id INTEGER REFERENCES users(id),domain TEXT NOT NULL,next_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,domain));
 CREATE TABLE IF NOT EXISTS bot_action_stats(user_id INTEGER REFERENCES users(id),path TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,successes INTEGER NOT NULL DEFAULT 0,last_status INTEGER NOT NULL DEFAULT 0,last_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,path));`);
}
// Shared dispatcher: bots never get an owner identity, fabricated balances or bypasses.
export function gameClient(db,game){return (id,path,body)=>{
 let response;const res={writeHead(status){this.status=status;return this},end(text){response={status:this.status,body:JSON.parse(text)};return this}};
 const u=db.prepare('SELECT * FROM users WHERE id=? AND banned=0 AND deleted_at=0').get(id);if(!u)return {status:403,body:{error:'Inactive player'}};
 const output=game.route({method:body===undefined?'GET':'POST',url:'/api/'+path},res,'/api/'+path.split('?')[0],body||{},u);
 return response||(output?.status?output:{status:404,body:{error:'Unsupported game action'}});
};}
export function installBots(db,game,{clock=Date.now,random=randomInt,call=gameClient(db,game)}={}){
 installBotSchema(db);const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 const pick=xs=>xs.length?xs[random(0,xs.length)]:null;
 function step(id,{domain}={}){
  const bot=q('SELECT * FROM bot_players WHERE user_id=? AND enabled=1',id),u=q("SELECT * FROM users WHERE id=? AND role='player' AND banned=0 AND deleted_at=0",id);if(!bot||!u)return;
  game.presence.touch(id);game.settle(id);
  const get=p=>{const r=call(id,p);return r.status<300?r.body:null};
  const act=(p,b={})=>{if(['world-chat/send','family/chat/send'].includes(p))return {status:403,body:{error:'Autonomous chat posting is disabled.'}};const r=call(id,p,p==='profile/settings'?b:{...b,key:randomUUID(),requestKey:randomUUID()});run('UPDATE bot_players SET last_action=?,last_status=?,last_error=?,actions=actions+? WHERE user_id=?',p,r.status,r.body.error||'',r.status<300?1:0,id);run('INSERT INTO bot_action_stats VALUES(?,?,1,?,?,?) ON CONFLICT(user_id,path) DO UPDATE SET attempts=attempts+1,successes=successes+excluded.successes,last_status=excluded.last_status,last_at=excluded.last_at',id,p,r.status<300?1:0,r.status,clock());return r};
  const current=q('SELECT * FROM users WHERE id=?',id);
  if(Math.max(current.coma_until,current.prison_until,current.hospital_until)>clock()){
   const police=get('bribery')?.offer;if(police){if(police.cost<=current.cash*.2)act('bribery/pay',{id:police.id,maxCost:police.cost});else act('bribery/decline',{id:police.id});return;}
   const custody=get('custody'),stay=custody?.stays.find(s=>s.user_id===id);if(stay&&stay.cost<(current.cash+current.bank)*.15)act('custody/pay',{id:stay.id,source:current.cash>=stay.cost?'cash':current.bank>=stay.cost?'bank':'personal',maxCost:stay.cost});
   else if(stay&&stay.ends_at-clock()>12*3600000){const asset=custody.assets.filter(a=>a.price>=stay.cost&&a.category!=='business').sort((a,b)=>a.price-b.price)[0];if(asset)act('custody/pay',{id:stay.id,source:'assets',maxCost:stay.cost,assets:[{category:asset.category,item_id:asset.item_id,quantity:1}]});}return;
  }
  const member=q('SELECT f.*,m.family_role FROM family_members m JOIN families f ON f.id=m.family_id WHERE m.user_id=?',id);
  const move=chosen=>autonomousMove({id,u:current,family:member,db,get,act,pick,random,clock,profile:game.profile},chosen);
  // Prioritize a real, persisted server failure; shared subject deduplication
  // prevents every bot reporting the same route. Support failures never recurse.
  const failure=q("SELECT path FROM bot_action_stats WHERE user_id=? AND last_status>=500 AND path NOT LIKE 'support/%' ORDER BY last_at DESC LIMIT 1",id);
  if(!domain&&failure&&!q("SELECT 1 FROM support_tickets WHERE category='bug' AND subject=? AND created_at>?",('Bot server error: '+failure.path).slice(0,100),clock()-7*86400000)&&(q("SELECT next_at FROM bot_decisions WHERE user_id=? AND domain='bug-report'",id)?.next_at||0)<=clock()){
   run("INSERT INTO bot_decisions VALUES(?,'bug-report',?) ON CONFLICT(user_id,domain) DO UPDATE SET next_at=excluded.next_at",id,clock()+3600000);
   act('support/create',{category:'bug',subject:('Bot server error: '+failure.path).slice(0,100),body:'An automated player received a server error from '+failure.path+'. Please review the server activity logs. No credentials or request content are included.',target:''});return;
  }
  if(domain){if(!botDomains.includes(domain))throw Error('Unknown bot domain');return move(domain);}
  // Finish open hands before beginning another activity. No abandoned poker/blackjack locks.
  if(q("SELECT 1 FROM casino_rounds WHERE user_id=? AND (status='active' OR paid=0)",id)||q("SELECT 1 FROM casino_extra_rounds WHERE user_id=? AND (status='active' OR paid=0)",id)){move('casino');return;}
  const recovered=q("SELECT id FROM vehicle_loot WHERE user_id=? AND state='pending'",id);if(recovered){move('vehicles');return;}
  const a=get('armory');if(!a)return;
  if(a.ammo<80&&current.cash>=2000){act('armory/buy',{scope:'personal',kind:'ammo',quantity:Math.min(500,Math.floor(current.cash*.15/a.ammoPrice))});return;}
  const fresh=a.weapons.filter(w=>w.tier>a.tier&&w.price<current.cash*.2).sort((a,b)=>a.price-b.price)[0];
  if(fresh){act('armory/buy',{scope:'personal',kind:'weapon',item:fresh.id,quantity:1});return;}
  const intent=random(0,100),family=q('SELECT f.*,m.family_role FROM family_members m JOIN families f ON f.id=m.family_id WHERE m.user_id=?',id);
  if(intent>=78&&intent<90){
   // Choose among the least recently visited domains, with jitter; no personality is excluded.
   const recent=all("SELECT domain,next_at FROM bot_decisions WHERE user_id=? AND domain LIKE 'choice:%'",id);
   const ordered=[...botDomains].sort((a,b)=>(recent.find(r=>r.domain==='choice:'+a)?.next_at||0)-(recent.find(r=>r.domain==='choice:'+b)?.next_at||0));
   const chosen=pick(ordered.slice(0,4));run('INSERT INTO bot_decisions VALUES(?,?,?) ON CONFLICT(user_id,domain) DO UPDATE SET next_at=excluded.next_at',id,'choice:'+chosen,clock());if(move(chosen))return;
  }
  if(intent<10){
   const d=get('daily');const job=d?.jobs.find(j=>!j.claimed&&j.progress>=j.target);if(job){act('daily/claim',{day:d.day,job:job.id});return;}
   const earned=get('achievements')?.milestones.find(m=>m.earnedAt&&!m.xpClaimed);if(earned){act('achievements/claim',{milestone:earned.id});return;}
  }
  if(intent>=10&&intent<25){
   if(move('shipments'))return;
  }
  if(intent>=25&&intent<34){
   const candidates=catalog.filter(c=>c.price<current.cash*.25&&(q('SELECT quantity FROM possessions WHERE user_id=? AND item_id=?',id,c.id)?.quantity||0)<c.limit);
   const parking=q("SELECT COALESCE(SUM(quantity),0)*6 n FROM possessions WHERE user_id=? AND category='garage' AND item_id NOT IN ('vehicle-warehouse','production-warehouse')",id).n,cars=q("SELECT COALESCE(SUM(quantity),0) n FROM possessions WHERE user_id=? AND category='car'",id).n;const item=pick(candidates.filter(c=>(c.category!=='car'||cars<parking)&&(bot.personality==='builder'?c.category==='business':true)));if(item){act('assets/buy',{id:item.id,category:item.category,quantity:1});return;}
  }
  if(intent>=34&&intent<39){
   const e=get('employees')?.items.filter(e=>e.quantity<e.limit&&e.price<current.cash*.2),employee=pick(e||[]);if(employee){act('employees/hire',{item:employee.id,quantity:1});return;}
   if(current.cash>2e6&&current.personal_protection<10){act('security/personal',{quantity:1});return;}
  }
  if(intent>=39&&intent<46){
   if(!family){const families=get('families')?.families.filter(f=>f.mode==='open'&&f.members<f.capacity&&!q("SELECT 1 FROM users WHERE id=(SELECT leader_id FROM families WHERE id=?) AND role='owner'",f.id));
    if(current.cash>3e6&&(!families?.length||bot.personality==='leader')){act('families',{name:current.username.split(' ').at(-1)+' Syndicate'});return;}
    const chosen=pick(families||[]);if(chosen){act('families/join',{id:chosen.id});return;}
   }else{
    if(current.cash>1e6&&family.treasury<current.cash*.2){act('family/donate',{amount:Math.floor(current.cash*.05)});return;}
    if(family.leader_id===id||family.family_role==='capo'){
     const arm=get('armory?scope=family');if(arm&&arm.ammo<100&&family.treasury>5000){act('armory/buy',{scope:'family',kind:'ammo',quantity:100});return;}
     const weapon=arm?.weapons.filter(w=>w.tier>arm.tier&&w.price<family.treasury*.1).sort((a,b)=>a.price-b.price)[0];if(weapon){act('armory/buy',{scope:'family',kind:'weapon',item:weapon.id,quantity:1});return;}
     const item=pick(familyAssets.filter(x=>x.category!=='Territory'&&x.price<family.treasury*.4&&(q('SELECT quantity FROM family_assets WHERE family_id=? AND item_id=?',family.id,x.id)?.quantity||0)<x.limit));if(item){act('family/buy',{id:item.id,quantity:1});return;}
    }
    if(move('respect'))return;
   }
  }
  if(intent>=46&&intent<52){
   const crews=get('team-missions');const own=crews?.lobbies.find(l=>q('SELECT 1 FROM crew_members WHERE operation_id=? AND user_id=?',l.id,id));
   if(own){if(own.leader_id===id&&q('SELECT COUNT(*) n FROM crew_members WHERE operation_id=?',own.id).n===crewMissions.find(m=>m.id===own.mission)?.size)act('team-missions/launch',{id:own.id});return;}
   const join=crews?.lobbies.find(l=>q('SELECT COUNT(*) n FROM crew_members WHERE operation_id=?',l.id).n<(crewMissions.find(m=>m.id===l.mission)?.size||0));if(join){act('team-missions/join',{id:join.id});return;}
   const m=pick(crewMissions.filter(m=>m.requiredXp<=current.xp&&m.tier<=a.tier&&m.ammo<=a.ammo&&m.fee<current.cash*.05&&m.energy<=current.energy));if(m){act('team-missions/create',{mission:m.id});return;}
  }
  if(intent>=52&&intent<57){
   const target=pick(all("SELECT id,username FROM users WHERE id<>? AND role<>'owner' AND banned=0 AND deleted_at=0",id));if(target){act('respect/give',{target:target.username});return;}
  }
  if(intent>=57&&intent<60){
   const targets=all("SELECT u.username FROM users u WHERE u.id<>? AND u.role<>'owner' AND u.banned=0 AND u.deleted_at=0 AND u.xp>=500 AND u.protected_until<? AND u.coma_until<? AND u.prison_until<? AND NOT EXISTS(SELECT 1 FROM family_members a JOIN family_members b ON a.family_id=b.family_id WHERE a.user_id=? AND b.user_id=u.id)",id,clock(),clock(),clock(),id);const target=pick(targets),kind=pick(['rob','hostage','attack','liquidate'].filter(kind=>!q("SELECT 1 FROM actions WHERE user_id=? AND kind IN ('pvp',?) AND available_at>?",id,'pvp:'+kind,clock())));if(target&&kind){act('pvp',{target:target.username,kind,rounds:Math.min(300,Math.max(60,a.ammo))});return;}
  }
  if(intent>=60&&intent<64&&move('freight'))return;
  if(intent===64&&current.cash>1e6){const wallet=get('crypto'),coin=pick(wallet?.coins||[]);if(coin&&coin.buy<current.cash*.005){const own=wallet.wallet.find(w=>w.coin===coin.id);act('crypto/trade',{coin:coin.id,side:own?.quantity?'sell':'buy',quantity:1,epoch:coin.epoch});return;}}
  if(intent===65&&move('casino'))return;
  if(intent===66&&move('investments'))return;
  if(intent===67){const mystery=get('mystery')?.offer;if(mystery){act('mystery/resolve',{id:mystery.id,choice:'accept'});return;}}
  if(intent===68&&family&&family.leader_id===id&&family.treasury>1e6){const item=pick(familyAssets.filter(a=>a.category==='Territory'&&a.price<family.treasury*.1));if(item){act('family/map/buy',{id:item.id,city:current.city,quantity:1});return;}}
  if(intent===69&&move('war'))return;
  if(intent===70){const relationship=get('marriage');const invite=relationship?.invitations.find(i=>i.recipient_id===id&&q('SELECT 1 FROM bot_players WHERE user_id=?',i.sender_id));if(invite){act('marriage/respond',{id:invite.id,action:'accept'});return;}if(!relationship?.marriage&&current.cash>20e6){const partner=pick(all("SELECT u.username FROM bot_players b JOIN users u ON u.id=b.user_id WHERE u.id<>? AND u.banned=0 AND u.deleted_at=0 AND NOT EXISTS(SELECT 1 FROM marriage_members m WHERE m.user_id=u.id)",id));if(partner){act('marriage/invite',{target:partner.username});return;}}}
  if(intent===71&&current.heat>=60){const city=pick(get('airport')?.destinations.filter(d=>d.city!==current.city)||[]);if(city){act('airport/fly',{city:city.city});return;}}
  if(intent===72)return; // Bots never post to family or world chat.
  if(intent===73){const thread=get('inbox')?.threads.find(t=>t.unread&&!q('SELECT 1 FROM bot_players WHERE user_id=?',t.peer.id));if(thread){act('conversation/read',{peerId:thread.peer.id,lastId:thread.last.id});act('messages',{recipient:thread.peer.username,message:'I am an automated game character. You can invite me to a crew or interact with me through my profile; I cannot answer free-form questions.'});return;}}
  if(intent===74&&family){const stay=get('custody')?.stays.find(s=>s.kind==='prison'&&s.user_id!==id&&q('SELECT 1 FROM family_members WHERE family_id=? AND user_id=?',family.id,s.user_id));if(stay&&current.cash>20e6){act('custody/breakout',{id:stay.id,scope:'personal'});return;}}
  if(intent===75&&family&&family.leader_id===id){const up=get('compound/upgrades');const item=up?.compound?pick(up.upgrades.filter(x=>!x.owned&&x.price<family.treasury*.2)):null;if(item){act('compound/upgrade',{upgrade:item.id});return;}}
  if(intent===76&&family&&family.leader_id===id){const relations=get('family/alliances');const incoming=relations?.alliances.find(x=>x.status==='pending'&&x.requested_by!==family.id);if(incoming){act('family/alliance',{familyId:incoming.a===family.id?incoming.b:incoming.a,action:'accept'});return;}}
  if(intent===77&&family&&(family.leader_id===id||family.family_role==='capo')){const map=get('family/map?city='+encodeURIComponent(current.city));const free=map?.plots.find(p=>!p.owner_id&&p.price<family.treasury*.1);if(free&&map.ownedInCity<20){act('family/map/buy',{city:current.city,plotId:free.id});return;}}
  // The default is productive play, not free money: choose a legal, affordable crime.
  const crimes=get('catalog')?.crimes.filter(c=>!c.locked&&c.requiredXp<=current.xp&&c.energy<=current.energy&&c.supplies.ammo<=a.ammo&&c.supplies.tier<=a.tier&&!(q('SELECT available_at FROM actions WHERE user_id=? AND kind=?',id,c.id)?.available_at>clock())).sort((a,b)=>(b.payout.min*b.chance-b.supplies.ammo*25)/b.energy-(a.payout.min*a.chance-a.supplies.ammo*25)/a.energy);
  if(crimes?.length)act('action',{kind:pick(random(0,5)===0?crimes:crimes.slice(0,bot.personality==='enforcer'?3:2)).id});
 }
 function tick(){
  if(q("SELECT value FROM bot_meta WHERE key='enabled'")?.value!=='true')return;
  // Bound work per tick. Each claimed next_at survives restarts; never replay missed days.
  for(const b of all("SELECT b.* FROM bot_players b JOIN users u ON u.id=b.user_id WHERE b.enabled=1 AND b.next_at<=? AND u.role='player' AND u.banned=0 AND u.deleted_at=0 ORDER BY b.next_at LIMIT 4",clock())){
   const now=clock(),activity=Math.max(.4,Math.min(1.5,(b.activity||100)/100));let until=b.session_until;
   if(until&&until<=now){game.presence.offline(b.user_id);run('UPDATE bot_players SET session_until=0,next_at=? WHERE user_id=?',now+Math.round(random(2*3600000,8*3600000)/activity),b.user_id);continue;}
   if(!until)until=now+Math.round(random(20*60000,50*60000)*activity);
   if(!run('UPDATE bot_players SET next_at=?,session_until=? WHERE user_id=? AND next_at=?',now+Math.round(random(30000,90000)/Math.sqrt(activity)),until,b.user_id,b.next_at).changes)continue;
   try{step(b.user_id)}catch(e){run('UPDATE bot_players SET last_status=500,last_error=? WHERE user_id=?',String(e.message).slice(0,300),b.user_id);}
  }
 }
 return {tick,step};
}
