import {MAX_CASH} from './money.js';
import {skins} from './skins.js';
import {isStaff} from './staff.js';
export const cosmetics=[
 ...skins.filter(s=>s.cents||s.grantOnly).flatMap(s=>[{id:'skin:'+s.id,kind:'skin',value:s.id,name:s.name},{id:'frame:'+s.frame,kind:'frame',value:s.frame,name:s.frameName}]),
 {id:'theme:champagne',kind:'theme',value:'champagne',name:'Champagne gold color'},
 {id:'theme:midnight',kind:'theme',value:'midnight',name:'Midnight blue color'},
 {id:'theme:velvet',kind:'theme',value:'velvet',name:'Velvet plum color'},
 {id:'frame:laurel',kind:'frame',value:'laurel',name:'Golden laurel avatar frame'},
 {id:'frame:platinum',kind:'frame',value:'platinum',name:'Platinum avatar frame'},
 {id:'frame:artdeco',kind:'frame',value:'artdeco',name:'Art Deco avatar frame'},
 {id:'title:patron',kind:'title',value:'Patron of the City',name:'Patron of the City title'},
 {id:'title:night',kind:'title',value:'Midnight Aristocrat',name:'Midnight Aristocrat title'},
 {id:'title:velvet',kind:'title',value:'Velvet Society',name:'Velvet Society title'}
];
export const shopProducts=[
 ...skins.filter(s=>s.grantOnly).map(s=>({id:'skin-'+s.id,name:s.name,cents:0,ownerGrantOnly:true,section:'skins',items:['skin:'+s.id,'frame:'+s.frame],image:s.image,skin:s})),
 ...skins.filter(s=>s.cents).map(s=>({id:'skin-'+s.id,name:s.name,cents:s.cents,section:'skins',items:['skin:'+s.id,'frame:'+s.frame],image:s.image,skin:s})),
 {id:'energy-refill',name:'Fresh Start · Energy',cents:199,section:'rewards',items:[],rewards:{energy:500},image:'/images/premium-shop-v4.png'},
 {id:'xp-boost',name:'Street Experience · XP',cents:299,section:'rewards',items:[],rewards:{xp:50000},image:'/images/premium-shop-v4.png'},
 {id:'cash-reserve',name:'Cash Reserve',cents:299,section:'rewards',items:[],rewards:{cash:25000000},image:'/images/premium-shop-v4.png'},
 {id:'energy-reserve',name:'Energy Reserve',cents:279,section:'rewards',items:[],rewards:{energy:750},image:'/images/premium-shop-v4.png'},
 {id:'energy-vault',name:'Energy Vault',cents:349,section:'rewards',items:[],rewards:{energy:1000},image:'/images/premium-shop-v4.png'},
 {id:'xp-reserve',name:'Underworld Experience',cents:499,section:'rewards',items:[],rewards:{xp:100000},image:'/images/premium-shop-v4.png'},
 {id:'xp-vault',name:'Legacy Experience',cents:899,section:'rewards',items:[],rewards:{xp:200000},image:'/images/premium-shop-v4.png'},
 {id:'cash-fortune',name:'City Fortune',cents:499,section:'rewards',items:[],rewards:{cash:50000000},image:'/images/premium-shop-v4.png'},
 {id:'cash-empire',name:'Empire Reserve',cents:899,section:'rewards',items:[],rewards:{cash:100000000},image:'/images/premium-shop-v4.png'},
 {id:'starter-supplies',name:'Street Supplies Pack',cents:499,section:'rewards',items:[],rewards:{cash:25000000,xp:50000,energy:500},image:'/images/premium-shop-v4.png'},
 {id:'supporter',name:'Supporter',cents:499,bonusPercent:10,items:[],supporter:'silver',cash:125000000,xp:250000,days:30,image:'/images/premium-shop-v4.png'},
 {id:'grand-supporter',name:'Grand Supporter',cents:999,bonusPercent:25,items:[],supporter:'gold',cash:375000000,xp:750000,days:30,image:'/images/premium-shop-v4.png'},
 {id:'champagne',name:'Champagne Gold',cents:199,items:['theme:champagne'],image:'/images/premium-shop-v4.png'},
 {id:'midnight',name:'Midnight Blue',cents:199,items:['theme:midnight'],image:'/images/premium-shop-v4.png'},
 {id:'velvet',name:'Velvet Plum',cents:199,items:['theme:velvet'],image:'/images/premium-shop-v4.png'},
 {id:'laurel',name:'Golden Laurel',cents:199,items:['frame:laurel'],image:'/images/premium-shop-v4.png'},
 {id:'platinum',name:'Platinum Frame',cents:199,items:['frame:platinum'],image:'/images/premium-shop-v4.png'},
 {id:'artdeco',name:'Art Deco Frame',cents:199,items:['frame:artdeco'],image:'/images/premium-shop-v4.png'},
 {id:'titles',name:'Signature Titles',cents:499,items:['title:patron','title:night','title:velvet'],image:'/images/premium-shop-v4.png'},
 {id:'patron-pack',name:'City Patron Pack',cents:499,items:['theme:champagne','frame:laurel','title:patron'],image:'/images/premium-shop-v4.png'},
 {id:'night-pack',name:'Midnight Society Pack',cents:499,items:['theme:midnight','frame:platinum','title:night'],image:'/images/premium-shop-v4.png'},
 {id:'velvet-pack',name:'Velvet Collection Pack',cents:499,items:['theme:velvet','frame:artdeco','title:velvet'],image:'/images/premium-shop-v4.png'},
 {id:'complete-collection',name:'Frames, Colors & Titles Collection',cents:1199,items:cosmetics.filter(x=>!x.id.startsWith('skin:')&&!x.id.startsWith('frame:skin-')&&!skins.filter(s=>s.grantOnly).some(s=>x.id==='skin:'+s.id)).map(x=>x.id),image:'/images/premium-shop-v4.png'}
].sort((a,b)=>Number(!!b.supporter)-Number(!!a.supporter));
export function installShop(db,{transaction,clock,fail,notify,promote=()=>{},settleRaw,energyMax=()=>100}){
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 db.exec(`CREATE TABLE IF NOT EXISTS shop_grants(id INTEGER PRIMARY KEY,actor_id INTEGER NOT NULL REFERENCES users(id),user_id INTEGER NOT NULL REFERENCES users(id),product_id TEXT NOT NULL,request_key TEXT NOT NULL,reason TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(actor_id,request_key));
 CREATE TABLE IF NOT EXISTS shop_entitlements(user_id INTEGER NOT NULL REFERENCES users(id),cosmetic_id TEXT NOT NULL,grant_id INTEGER NOT NULL REFERENCES shop_grants(id),PRIMARY KEY(user_id,cosmetic_id));`);
 const owned=id=>all('SELECT cosmetic_id FROM shop_entitlements WHERE user_id=?',id).map(x=>x.cosmetic_id);
 db.exec('CREATE TABLE IF NOT EXISTS supporter_memberships(user_id INTEGER PRIMARY KEY REFERENCES users(id),tier TEXT NOT NULL,expires_at INTEGER NOT NULL,grant_id INTEGER NOT NULL REFERENCES shop_grants(id))');
 const paidMembership=id=>q('SELECT tier,expires_at expiresAt FROM supporter_memberships WHERE user_id=? AND expires_at>?',id,clock())||null;
 const membership=id=>{const paid=paidMembership(id),free=db.prepare("SELECT 1 FROM sqlite_master WHERE name='referral_memberships'").get()?q('SELECT tier,expires_at expiresAt FROM referral_memberships WHERE user_id=? AND starts_at<=? AND expires_at>?',id,clock(),clock()):null;return paid?.tier==='gold'?paid:free?.tier==='gold'?free:paid||free||null};
 const bonus=id=>membership(id)?.tier==='gold'?1.25:membership(id)?1.10:1;
 const unlocked=(id,kind)=>{const ids=owned(id);return cosmetics.filter(c=>c.kind===kind&&ids.includes(c.id))};
 const titles=id=>unlocked(id,'title').map(x=>({id:'shop:'+x.id,name:x.value}));
 const avatars=id=>skins.filter(s=>s.ownerOnly?q('SELECT role FROM users WHERE id=?',id)?.role==='owner':(!s.cents&&!s.grantOnly)||owned(id).includes('skin:'+s.id));
 const themes=id=>unlocked(id,'theme').map(x=>x.value),frames=id=>['plain',...unlocked(id,'frame').map(x=>x.value),...(q('SELECT role FROM users WHERE id=?',id)?.role==='owner'?['owner-diamond']:[])];
 function route(req,path,b,u){
  if(req.method==='GET'&&path==='/api/shop')return {currency:'EUR',checkoutEnabled:false,checkoutMessage:'PayPal checkout is not configured. No payments are being accepted. Prices are a proposed launch catalog.',skins:skins.filter(s=>!s.ownerOnly&&!s.grantOnly).map(s=>({...s,owned:!s.cents||owned(u.id).includes('skin:'+s.id)})),products:shopProducts.filter(p=>!p.ownerGrantOnly||u.role==='owner').map(p=>({...p,section:p.section||(p.supporter?'memberships':p.items.length>1?'packs':p.items[0]?.startsWith('frame:')?'frames':p.items[0]?.startsWith('theme:')?'colors':'packs'),items:p.items.map(id=>cosmetics.find(x=>x.id===id)),owned:p.rewards?false:p.supporter?!!membership(u.id):p.items.every(id=>owned(u.id).includes(id))})),membership:membership(u.id),owned:owned(u.id),canGrant:isStaff(u)};
  if(path==='/api/shop/checkout'&&req.method==='POST')fail('Checkout is not available yet. No payment has been taken.',503);
  if(path==='/api/admin/shop'&&req.method==='GET'){if(!isStaff(u))fail('Staff access required.',403);return {grants:all('SELECT g.id,g.product_id,g.reason,g.created_at,a.username actor,t.username recipient FROM shop_grants g JOIN users a ON a.id=g.actor_id JOIN users t ON t.id=g.user_id ORDER BY g.id DESC LIMIT 100')}}
  if(path==='/api/admin/shop/grant'&&req.method==='POST')return transaction(()=>{
   if(!isStaff(u))fail('Only Owner and Admin can grant shop products.',403);
   const p=shopProducts.find(x=>x.id===b.product),target=typeof b.recipient==='string'?q('SELECT id FROM users WHERE username=? COLLATE NOCASE',b.recipient.trim()):null;
   if(!p||!target||typeof b.key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(b.key)||typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>200)fail('Choose a player and product, and provide a reason of 1–200 characters.');
   if(p.ownerGrantOnly&&u.role!=='owner')fail('Owner access required.',403);
   const old=q('SELECT * FROM shop_grants WHERE actor_id=? AND request_key=?',u.id,b.key);
   if(old){if(old.user_id!==target.id||old.product_id!==p.id||old.reason!==b.reason.trim())fail('This request key was already used for another grant.',409);return {ok:true,message:'This grant was already delivered.',image:p.image}}
   if(q('SELECT banned OR deleted_at inactive FROM users WHERE id=?',target.id).inactive)fail('Choose an active player.',409);
   const missing=p.items.filter(id=>!owned(target.id).includes(id));if(!p.supporter&&!p.rewards&&!missing.length)fail('This player already owns every item in this product.',409);
   let before;
   if(p.supporter){
    if(membership(target.id))fail('This player already has an active supporter membership. Renew after it expires.',409);
    before=settleRaw?settleRaw(target.id):q('SELECT * FROM users WHERE id=?',target.id);
    if(before.cash+p.cash>MAX_CASH||before.xp+p.xp>1e12)fail('Make room for the full cash and XP reward first.',409);
   }
   if(p.rewards){before=settleRaw?settleRaw(target.id):q('SELECT * FROM users WHERE id=?',target.id);if(before.cash+(p.rewards.cash||0)>MAX_CASH||before.xp+(p.rewards.xp||0)>1e12||before.energy+(p.rewards.energy||0)>1000000000)fail('Make room for the full reward first. Purchased energy can exceed your normal capacity, up to one billion stored energy.',409);}
   const grant=run('INSERT INTO shop_grants(actor_id,user_id,product_id,request_key,reason,created_at) VALUES(?,?,?,?,?,?)',u.id,target.id,p.id,b.key,b.reason.trim(),clock()).lastInsertRowid;
   for(const item of missing)run('INSERT INTO shop_entitlements VALUES(?,?,?)',target.id,item,grant);
   if(p.supporter){run('INSERT INTO supporter_memberships VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET tier=excluded.tier,expires_at=excluded.expires_at,grant_id=excluded.grant_id',target.id,p.supporter,clock()+p.days*86400000,grant);run('UPDATE users SET cash=cash+?,xp=xp+? WHERE id=?',p.cash,p.xp,target.id);promote(target.id,before.xp);}
   if(p.rewards){run('UPDATE users SET cash=cash+?,xp=xp+?,energy=energy+? WHERE id=?',p.rewards.cash||0,p.rewards.xp||0,p.rewards.energy||0,target.id);promote(target.id,before.xp);}
   run('INSERT INTO owner_audit(actor_id,target_id,details,created_at) VALUES(?,?,?,?)',u.id,target.id,JSON.stringify({shopGrant:Number(grant),product:p.id,items:missing,reason:b.reason.trim(),payment:'complimentary'}),clock());
   notify(target.id,'A gift for your collection',p.rewards?`${p.name}: ${Object.entries(p.rewards).map(([k,v])=>v.toLocaleString('en-US')+' '+k).join(', ')} delivered once.`:p.supporter?`${p.name}: $${p.cash.toLocaleString('en-US')} and ${p.xp.toLocaleString('en-US')} XP delivered once. Your ${p.supporter} name, diamond and +${p.bonusPercent}% earnings/XP bonus last 30 days. No automatic renewal.`:`${p.name} was granted by staff. Your ${missing.length} new cosmetic item(s) are permanent. Equip them in My profile.`,p.image);
   return {ok:true,message:p.rewards?`${p.name} delivered once. No payment was required.`:p.supporter?`${p.name} granted for 30 days. $${p.cash.toLocaleString("en-US")} and ${p.xp.toLocaleString("en-US")} XP delivered once. No payment was required.`:`${p.name} granted. ${missing.length} permanent cosmetic item(s) unlocked. No payment was required.`,image:p.image};
  });return null;
 }
 return {route,titles,themes,frames,avatars,membership,bonus};
}
