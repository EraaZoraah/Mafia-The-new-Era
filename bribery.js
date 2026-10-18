import {progression} from './progression.js';
export const BRIBE_CHANCE=.3,BRIBE_WINDOW=90000,BRIBE_IMAGE='/images/police-bribe.png';
export function bribePrice(xp,referenceCash,baseFee){
 const level=progression(xp).rankLevel;
 return Math.max(1,Math.min(Math.floor(baseFee*.65),Math.round(Math.max(0,referenceCash)*.12+level*2500)));
}
export function installBribery(db,{clock,transaction,fail,draw,active,release,log}){
 const q=(s,...v)=>db.prepare(s).get(...v),run=(s,...v)=>db.prepare(s).run(...v);
 db.exec(`CREATE TABLE IF NOT EXISTS police_bribes(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),custody_id INTEGER NOT NULL UNIQUE REFERENCES custody(id),label TEXT NOT NULL,cost INTEGER NOT NULL,expires_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'open',created_at INTEGER NOT NULL,settled_at INTEGER NOT NULL DEFAULT 0);`);
 const current=id=>{const b=q("SELECT b.* FROM police_bribes b JOIN custody c ON c.id=b.custody_id WHERE b.user_id=? AND b.status='open' AND b.expires_at>? AND c.released_at=0 AND c.ends_at>? ORDER BY b.id DESC LIMIT 1",id,clock(),clock());return b?{...b,notificationId:q("SELECT id FROM player_notifications WHERE user_id=? AND title='You have been arrested' AND created_at=? ORDER BY id DESC LIMIT 1",id,b.created_at)?.id,image:BRIBE_IMAGE,serverTime:clock()}:null};
 function offer(id,{label,referenceCash}){
  const stay=active(id);if(!stay||stay.kind!=='prison'||q('SELECT 1 FROM police_bribes WHERE custody_id=?',stay.id)||draw()>=BRIBE_CHANCE*10000)return null;
  const u=q('SELECT xp FROM users WHERE id=?',id),cost=bribePrice(u.xp,referenceCash,stay.base_fee);
  run('INSERT INTO police_bribes(user_id,custody_id,label,cost,expires_at,created_at) VALUES(?,?,?,?,?,?)',id,stay.id,label,cost,Math.min(stay.ends_at,clock()+BRIBE_WINDOW),clock());
  return current(id);
 }
 function route(req,path,b,u){
  if(path==='/api/bribery'&&req.method==='GET')return {offer:current(u.id)};
  if(!['/api/bribery/pay','/api/bribery/decline'].includes(path)||req.method!=='POST')return null;
  return transaction(()=>{
   if(!Number.isSafeInteger(b.id)||b.id<1)fail('Choose a police offer.');
   const offer=q('SELECT * FROM police_bribes WHERE id=? AND user_id=?',b.id,u.id);if(!offer)fail('Police offer not found.',404);
   if(offer.status==='paid'&&path.endsWith('/pay'))return {ok:true,duplicate:true,message:'This police offer has already been paid.'};
   const stay=active(u.id);if(offer.status!=='open'||offer.expires_at<=clock()||stay?.id!==offer.custody_id)fail('This police offer has expired or the sentence has changed.',409);
   if(path.endsWith('/decline')){run("UPDATE police_bribes SET status='declined',settled_at=? WHERE id=?",clock(),offer.id);return {ok:true,message:'Offer declined. Your prison sentence continues.',image:'/images/scene-arrest.jpg'};}
   if(b.maxCost!==offer.cost)fail('Refresh the police offer before paying.',409);
   if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',offer.cost,u.id,offer.cost).changes)fail('Not enough cash for this bribe. Your sentence continues.',409);
   run("UPDATE police_bribes SET status='paid',settled_at=? WHERE id=?",clock(),offer.id);
   release(stay,'You paid $'+offer.cost+' to a corrupt officer and avoided the remaining prison sentence.');
   log(u.id,'Police bribe: paid $'+offer.cost+' after '+offer.label+'.');return {ok:true,cost:offer.cost,message:'The officer accepted your bribe. You are free to continue.',image:BRIBE_IMAGE};
  });
 }
 return {route,offer,current};
}
