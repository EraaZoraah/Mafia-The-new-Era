import {assertHostile,installDiplomacy,succeedDon} from './diplomacy.js';
import {familyAssets,MAX_CASH} from './empire-catalog.js';
import {raidChance} from './family-wars.js';

export function installWarOperations(db,{clock,transaction,settleRaw,available,familyMember,familyDebit,consume,wars,raidQuote,roll,draw,fail,territoryMap}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS war_sabotage(war_id INTEGER NOT NULL REFERENCES family_wars(id),family_id INTEGER NOT NULL REFERENCES families(id),until INTEGER NOT NULL,PRIMARY KEY(war_id,family_id));
 CREATE TABLE IF NOT EXISTS war_teams(id INTEGER PRIMARY KEY,war_id INTEGER NOT NULL REFERENCES family_wars(id),family_id INTEGER NOT NULL REFERENCES families(id),target_id INTEGER NOT NULL REFERENCES families(id),created_by INTEGER NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'recruiting' CHECK(status IN ('recruiting','completed','cancelled','expired')));
 CREATE TABLE IF NOT EXISTS war_team_members(team_id INTEGER NOT NULL REFERENCES war_teams(id),user_id INTEGER NOT NULL REFERENCES users(id),PRIMARY KEY(team_id,user_id));`);
 const territory=id=>all('SELECT item_id,quantity FROM family_assets WHERE family_id=?',id).flatMap(a=>{const x=familyAssets.find(x=>x.id===a.item_id&&x.category==='Territory');return x?[{...x,quantity:a.quantity}]:[]});
 const sabotageUntil=id=>q("SELECT MAX(s.until) until FROM war_sabotage s JOIN family_wars w ON w.id=s.war_id WHERE s.family_id=? AND w.status='active' AND w.ends_at>? AND s.until>?",id,clock(),clock())?.until||0;
 function opponent(id,target){assertHostile(db,id,target);const w=wars.active(id);if(!w||w.ends_at<=clock()||![w.attacker_id,w.defender_id].includes(target)||id===target)fail('This operation requires an active war against that family.',409);return w}
 function eligible(id,familyId,energy){const u=settleRaw(id);if(u.banned||u.coma_until>clock())fail('Every participant must be active and outside coma.',409);available(u);const m=familyMember(id);if(m.family_id!==familyId)fail('Every participant must still belong to this family.',409);if(u.xp<500||u.energy<energy)fail('Every participant needs 500 XP and '+energy+' energy.',409);return u}
 function ready(from,target){
  if(!territory(from.id).length)fail('Your family must own territory before launching war operations.',409);
  if(from.raid_until>clock())fail('Your family is regrouping. All attacks share the raid cooldown.',429);
  if(target.shield_until>clock())fail('This family has a recovery shield.',409);
  if(Math.max(from.created_at,target.created_at)>clock()-3600000)fail('New families have one hour of protection.',409);
 }
 function expireTeams(){run("UPDATE war_teams SET status='expired' WHERE status='recruiting' AND (expires_at<=? OR war_id IN (SELECT id FROM family_wars WHERE status<>'active' OR ends_at<=?))",clock(),clock())}
 function view(id){expireTeams();return {territory:territory(id),sabotageUntil:sabotageUntil(id),teams:all('SELECT * FROM war_teams WHERE family_id=? ORDER BY id DESC LIMIT 10',id).map(t=>({...t,members:all('SELECT u.id,u.username FROM war_team_members m JOIN users u ON u.id=m.user_id WHERE m.team_id=? ORDER BY u.id',t.id)}))}}
 function action(id,body,kind,team=null){
  const m=familyMember(id,true),from=q('SELECT * FROM families WHERE id=?',m.family_id);
  const target=q('SELECT * FROM families WHERE id=?',Number(body.familyId)||0);if(!target)fail('Choose a rival family.');
  const w=opponent(from.id,target.id);ready(from,target);
  const members=team?all('SELECT user_id FROM war_team_members WHERE team_id=?',team.id).map(x=>x.user_id):[id];
  if(team&&(members.length<2||members.length>5))fail('A joint assault requires 2–5 consenting members.',409);
  const energy=kind==='sabotage'?20:kind==='capture'?45:35,cost=kind==='sabotage'?500000:kind==='capture'?2500000:2000000,ammo=kind==='sabotage'?30:kind==='capture'?75:50;
  if(team&&!members.includes(id))fail('The commander must join the team before launching.',409);
  for(const member of members)eligible(member,from.id,energy);
  let item;
  if(kind==='capture')item=territoryMap.captureTarget(from.id,target.id,body);
  if(kind==='sabotage'&&sabotageUntil(target.id)>clock())fail('This family is already sabotaged. Effects do not stack.',409);
  const quote=raidQuote(from,target),attackPower=Math.round(quote.attackPower*(team?1+.15*(members.length-1):1));
  const chance=kind==='capture'?territoryMap.captureChance({...quote,familyId:from.id},item.plot):kind==='sabotage'?Math.min(.95,quote.chance+.10):raidChance(attackPower,quote.defenderPower,quote.defense.reduction);
  familyDebit(from.id,cost);for(const member of members){consume(member,'family',{tier:1,ammo});run('UPDATE users SET energy=energy-? WHERE id=?',energy,member)}
  if(kind==='capture')territoryMap.recordAttempt(from.id);
  const success=roll()<chance*10000;let loot=0,detail='';
  if(success&&kind==='sabotage'){const until=Math.min(clock()+3600000,w.ends_at);run('INSERT INTO war_sabotage VALUES(?,?,?) ON CONFLICT(war_id,family_id) DO UPDATE SET until=excluded.until',w.id,target.id,until);detail='Raid defense halved until '+new Date(until).toISOString()+'. Vault protection is unchanged.'}
  if(success&&kind==='capture'){territoryMap.transfer(item.plot,from.id,target.id);detail='Captured '+item.plot.name+' in '+item.plot.city+'. Ownership and bonuses transferred.';}
  if(success&&kind==='joint assault'){loot=Math.min(MAX_CASH-(from.treasury-cost),Math.floor(quote.maxLoot*draw(50,100)/100));run('UPDATE families SET treasury=treasury+? WHERE id=?',loot,from.id);run('UPDATE families SET treasury=treasury-? WHERE id=?',loot,target.id);detail=members.length+' members fought together.'}
  run('UPDATE families SET raid_until=? WHERE id=?',clock()+1800000,from.id);run('UPDATE families SET shield_until=? WHERE id=?',clock()+1200000,target.id);
  const points=kind==='capture'?3:2;wars.record(from.id,target.id,id,success,loot,chance,attackPower,quote.defenderPower,kind,points,detail);
  for(const member of members)run('INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(?,?,?,?)',member,kind,success?1:0,clock());
  if(team)run('INSERT INTO family_raid_history(attacker_family,target_family,success,loot,created_at) VALUES(?,?,?,?,?)',from.id,target.id,success?1:0,loot,clock());
  if(team)run("UPDATE war_teams SET status='completed' WHERE id=?",team.id);
  const message=from.name+' launched '+kind+' against '+target.name+': '+(success?'success':'failed')+'. '+(success?points+' war points earned.':'Defender earns 1 war point.')+' '+detail;
  wars.inform(from.id,'War operation result',message);wars.inform(target.id,'Enemy war operation',message);
  return {success,message,chance,cost,reward:loot,energy,ammoUsed:ammo*members.length,image:item?.image||'/images/scene-families.jpg'};
 }
 function route(path,body,user){
  if(!['/api/family/war/sabotage','/api/family/war/capture','/api/family/war/team/create','/api/family/war/team/join','/api/family/war/team/leave','/api/family/war/team/cancel','/api/family/war/team/launch'].includes(path))return null;
  return transaction(()=>{
   wars.settle();expireTeams();const u=settleRaw(user.id);available(u);const m=familyMember(u.id),familyId=m.family_id;
   if(path.endsWith('/sabotage')||path.endsWith('/capture'))return action(u.id,body,path.endsWith('/sabotage')?'sabotage':'capture');
   if(path.endsWith('/create')){
    familyMember(u.id,true);const target=Number(body.familyId);if(!Number.isSafeInteger(target)||target<1)fail('Choose a rival family.');const w=opponent(familyId,target);
    if(!territory(familyId).length)fail('Buy family territory before assembling an assault.',409);
    eligible(u.id,familyId,35);if(q("SELECT id FROM war_teams WHERE family_id=? AND status='recruiting'",familyId))fail('Your family already has an assault recruiting.',409);
    const r=run('INSERT INTO war_teams(war_id,family_id,target_id,created_by,expires_at) VALUES(?,?,?,?,?)',w.id,familyId,target,u.id,Math.min(clock()+900000,w.ends_at));
    run('INSERT INTO war_team_members VALUES(?,?)',r.lastInsertRowid,u.id);wars.inform(familyId,'Joint assault recruiting',u.username+' is assembling a joint assault. Join from Rival families within 15 minutes. Joining is free; resources are spent only when launched.');return {ok:true,message:'Assault created. At least one other member must join.',image:'/images/scene-families.jpg'};
   }
   if(!Number.isSafeInteger(body.teamId)||body.teamId<1)fail('Choose an assault team.');
   const t=q("SELECT * FROM war_teams WHERE id=? AND family_id=? AND status='recruiting'",body.teamId,familyId);if(!t)fail('This assault is unavailable or has expired.',409);opponent(familyId,t.target_id);
   if(path.endsWith('/join')){eligible(u.id,familyId,35);if(q('SELECT 1 FROM war_team_members WHERE team_id=? AND user_id=?',t.id,u.id))fail('You already joined this assault.',409);if(q('SELECT COUNT(*) n FROM war_team_members WHERE team_id=?',t.id).n>=5)fail('This assault is full.',409);run('INSERT INTO war_team_members VALUES(?,?)',t.id,u.id);return {ok:true,message:'You joined. On launch you spend 35 energy and your family spends 50 rounds for you.'}}
   if(path.endsWith('/leave')){run('DELETE FROM war_team_members WHERE team_id=? AND user_id=?',t.id,u.id);return {ok:true,message:'You left the assault. No resources were spent.'}}
   familyMember(u.id,true);
   if(path.endsWith('/cancel')){run("UPDATE war_teams SET status='cancelled' WHERE id=?",t.id);return {ok:true,message:'Assault cancelled. No resources were spent.'}}
   return action(u.id,{familyId:t.target_id},'joint assault',t);
  });
 }
 return {route,view,territory,sabotageUntil};
}
