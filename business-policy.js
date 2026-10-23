import {createHmac,randomBytes} from 'node:crypto';
import {catalog} from './catalog.js';
export const businessPolicies=[
 {id:'stable',name:'Stable operation',multiplier:1,risk:0,seizure:0,closureHours:0,description:'Predictable business income without additional inspections.'},
 {id:'illegal',name:'Illegal operation',multiplier:1.4,risk:.06,seizure:.5,closureHours:1,description:'Higher income. Each operating hour has a 6% inspection chance: half that hour is seized, followed by one closed hour.'},
 {id:'launder',name:'Money laundering',multiplier:2,risk:.12,seizure:.8,closureHours:2,description:'Highest gross income and risk. Each operating hour has a 12% inspection chance: 80% of that hour is seized, followed by two closed hours.'}
];
export function installBusinessPolicy(db,{clock,transaction,settleRaw,available,fail,blockedMillis,incomeMultiplier=()=>1}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS business_policy(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,item_id TEXT NOT NULL,policy TEXT NOT NULL CHECK(policy IN ('stable','illegal','launder')),changed_at INTEGER NOT NULL,PRIMARY KEY(user_id,item_id));CREATE TABLE IF NOT EXISTS business_policy_totals(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,item_id TEXT NOT NULL,gross INTEGER NOT NULL DEFAULT 0,received INTEGER NOT NULL DEFAULT 0,withheld INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,item_id));CREATE TABLE IF NOT EXISTS business_policy_seed(id INTEGER PRIMARY KEY CHECK(id=1),seed TEXT NOT NULL);`);
 if(!q('SELECT 1 FROM business_policy_seed'))run('INSERT INTO business_policy_seed VALUES(1,?)',randomBytes(32).toString('hex'));
 const seed=q('SELECT seed FROM business_policy_seed').seed;
 const policy=(id,item)=>{const r=q('SELECT * FROM business_policy WHERE user_id=? AND item_id=?',id,item);return {...businessPolicies.find(p=>p.id===(r?.policy||'stable')),changedAt:r?.changed_at||0,changeAfter:r?r.changed_at+86400000:0};};
 const hit=(id,item,epoch,p)=>p.risk>0&&parseInt(createHmac('sha256',seed).update([id,item,epoch,p.id].join(':')).digest('hex').slice(0,8),16)/4294967296<p.risk;
 const hourCache=new Map();
 function hourState(id,item,epoch,p){
  if(!p.risk||p.changedAt>=epoch*3600000)return 1;
  const key=id+':'+item,old=hourCache.get(key),same=old?.policy===p.id&&old?.changedAt===p.changedAt&&old.epoch<=epoch;
  let last=same?old.epoch:Math.floor(p.changedAt/3600000),closed=same?old.closed:0,yieldRate=same?old.yieldRate:1;
  for(let n=last+1;n<=epoch;n++){if(closed>0){closed--;yieldRate=0;}else if(hit(id,item,n,p)){yieldRate=1-p.seizure;closed=p.closureHours;}else yieldRate=1;}
  hourCache.set(key,{policy:p.id,changedAt:p.changedAt,epoch,closed,yieldRate});return yieldRate;
 }
 function accrue(asset,item,from,end,multiplier){
  const p=policy(asset.user_id,item.id);let remainder=asset.elapsed_remainder||0,numerator=BigInt(asset.income_remainder),gross=0;
  for(let start=from;start<end;){const stop=Math.min(end,(Math.floor(start/3600000)+1)*3600000),active=Math.max(0,stop-start-blockedMillis(asset.user_id,start,stop))+remainder,minutes=Math.floor(active/60000);remainder=active%60000;
   const base=minutes*item.income*asset.quantity*multiplier(start,stop)*p.multiplier,rate=hourState(asset.user_id,item.id,Math.floor(start/3600000),p);gross+=base/60;numerator+=BigInt(Math.round(base*rate*1000000));start=stop;
  }
  const earned=Number(numerator/60000000n);run('INSERT INTO business_policy_totals VALUES(?,?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET gross=gross+excluded.gross,received=received+excluded.received,withheld=withheld+excluded.withheld',asset.user_id,item.id,Math.round(gross),earned,Math.max(0,Math.round(gross)-earned));
  return {earned,remainder,incomeRemainder:Number(numerator%60000000n)};
 }
 function view(id){return {policies:businessPolicies,items:all("SELECT * FROM possessions WHERE user_id=? AND category='business'",id).map(a=>{const item=catalog.find(c=>c.id===a.item_id),p=policy(id,a.item_id),state=hourState(id,a.item_id,Math.floor(clock()/3600000),p);return {...a,name:item.name,image:item.image,policy:p,baseHourly:item.income*a.quantity,grossHourly:Math.floor(item.income*a.quantity*p.multiplier*incomeMultiplier(id)),operating:state>0,currentYield:state,totals:q('SELECT * FROM business_policy_totals WHERE user_id=? AND item_id=?',id,a.item_id)||{gross:0,received:0,withheld:0}};})};}
 function route(req,path,body,user){if(!['/api/business/policies','/api/business/policy'].includes(path))return null;
  if(path==='/api/business/policies'&&req.method==='GET')return transaction(()=>{settleRaw(user.id,clock(),false);return view(user.id);});
  if(path!=='/api/business/policy'||req.method!=='POST')fail('Method not allowed.',405);
  return transaction(()=>{available(settleRaw(user.id,clock(),false));const item=catalog.find(c=>c.category==='business'&&c.id===body.item),p=businessPolicies.find(p=>p.id===body.policy);if(!item||!p||!q("SELECT 1 FROM possessions WHERE user_id=? AND category='business' AND item_id=?",user.id,item.id))fail('Choose an owned business and a valid policy.');const old=policy(user.id,item.id);if(old.id===p.id)return {ok:true,message:'Business policy unchanged.'};if(old.changeAfter>clock())fail('Business policy can change once every 24 hours.',409);
   // New risk starts at the next complete hour, preventing retroactive seizures.
   run('INSERT INTO business_policy VALUES(?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET policy=excluded.policy,changed_at=excluded.changed_at',user.id,item.id,p.id,clock());return {ok:true,message:'Business policy saved. Operations continue automatically.',image:item.image};});
 }
 return {policy,view,route,accrue};
}
