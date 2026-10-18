import {MAX_CASH,MAX_XP} from './money.js';
export const artCatalog=[
 ['canal-nocturne','Canal Nocturne','painting',250000,45],['marble-muse','Marble Muse','sculpture',450000,35],
 ['imperial-clock','Imperial Mantel Clock','antique',700000,25],['sapphire-vase','Sapphire Porcelain Vase','antique',950000,20],
 ['golden-harbor','The Golden Harbor','painting',1600000,15],['bronze-stallion','Bronze Stallion','sculpture',2400000,12],
 ['royal-astrolabe','Royal Astrolabe','antique',4000000,8],['velvet-portrait','Portrait in Velvet','painting',6500000,5],
 ['obsidian-emperor','Obsidian Emperor','sculpture',10000000,3],['dynasty-cabinet','Dynasty Cabinet','antique',18000000,2],
 ['midnight-masterpiece','Midnight Masterpiece','painting',35000000,1],['diamond-phoenix','Diamond Phoenix','sculpture',60000000,1],
 ['silver-compass', 'Silver Navigator Compass', 'antique', 180000, 38],
 ['renaissance-sketch', 'Renaissance Architectural Sketch', 'painting', 600000, 28],
 ['amber-violin', 'Amber Concert Violin', 'antique', 1100000, 18],
 ['jade-dragon', 'Jade Dragon', 'sculpture', 3200000, 10],
 ['onyx-chess-set', 'Onyx Royal Chess Set', 'antique', 850000, 24],
 ['venetian-mirror', 'Venetian Mirror', 'antique', 2000000, 13],
 ['celestial-globe', 'Celestial Globe', 'antique', 5500000, 7],
 ['ruby-imperial-egg', 'Ruby Imperial Egg', 'antique', 8000000, 5],
 ['crystal-moon', 'Crystal Moon', 'sculpture', 10000000, 4],
 ['gilded-lion', 'Gilded Lion', 'sculpture', 12000000, 3],
 ['sultan-manuscript', 'The Sultan Manuscript', 'antique', 22000000, 2],
 ['storm-at-sea', 'Storm at Sea', 'painting', 28000000, 2],
 ['platinum-crown', 'Platinum Crown', 'antique', 50000000, 1]
].map(([id,name,kind,value,weight])=>({id,name,kind,value,weight,image:'/images/art-'+id+'.png'}));
const orderedArt=[...artCatalog].sort((a,b)=>a.value-b.value);
export const artLootPools=[orderedArt.slice(0,7),orderedArt.slice(7,13),orderedArt.slice(13,19),orderedArt.slice(19,25)].map(pool=>pool.map((a,i)=>Object.assign(a,{weight:2**(pool.length-i-1)})));
export const artHeists=[
 {id:'gallery',name:'After-hours Gallery',xp:500,energy:25,ammo:80,tier:1,fee:25000,chance:.72,cooldown:3600000,rewardXp:100},
 {id:'estate',name:'Collector’s Estate',xp:50000,energy:45,ammo:200,tier:2,fee:180000,chance:.57,cooldown:7200000,rewardXp:500},
 {id:'museum',name:'The Midnight Exhibition',xp:500000,energy:70,ammo:500,tier:3,fee:1200000,chance:.42,cooldown:14400000,rewardXp:1500},
 {id:'treasury',name:'The Sovereign Collection',xp:1500000,energy:90,ammo:900,tier:3,fee:3000000,chance:.32,cooldown:21600000,rewardXp:3000}
].map((h,i)=>({...h,loot:artLootPools[i]}));
export const artCrownJewels=['diamond-phoenix','platinum-crown'];
export const AUCTION_COMMISSION=.08;
export const artHeistChance=(h,xp)=>Math.min(.9,h.chance+Math.min(.12,Math.log10(xp+1)*.015));
export function installArtMarket(db,{clock,transaction,fail,settleRaw,available,consume,inventory,promote,rewardBonus=()=>1,draw,roll,log,notify,arrest,offerBribe}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS art_objects(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),spec_id TEXT NOT NULL,authentic INTEGER NOT NULL,condition INTEGER NOT NULL,estimated_value INTEGER NOT NULL,appraised INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL DEFAULT 'collection',created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS art_auctions(id INTEGER PRIMARY KEY,object_id INTEGER NOT NULL REFERENCES art_objects(id),seller_id INTEGER NOT NULL REFERENCES users(id),reserve INTEGER NOT NULL,ends_at INTEGER NOT NULL,original_end INTEGER NOT NULL,bid INTEGER NOT NULL DEFAULT 0,bidder_id INTEGER REFERENCES users(id),state TEXT NOT NULL DEFAULT 'open');
 CREATE TABLE IF NOT EXISTS art_heist_cooldowns(user_id INTEGER PRIMARY KEY REFERENCES users(id),until_at INTEGER NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS art_one_open_object ON art_auctions(object_id) WHERE state='open';
 CREATE TABLE IF NOT EXISTS art_refunds(user_id INTEGER PRIMARY KEY REFERENCES users(id),amount INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS art_due ON art_auctions(state,ends_at);`);
 db.exec(`CREATE TABLE IF NOT EXISTS art_theft_history(object_id INTEGER PRIMARY KEY REFERENCES art_objects(id),user_id INTEGER NOT NULL REFERENCES users(id),spec_id TEXT NOT NULL);`);
 db.exec('CREATE TABLE IF NOT EXISTS art_history_meta(key TEXT PRIMARY KEY)');
 // Recover only documented heist provenance. Old collection ownership alone is not proof of theft.
 if(!q("SELECT 1 FROM art_history_meta WHERE key='theft-v1'")){if(all("PRAGMA table_info(events)").some(c=>c.name==='message'))for(const a of artCatalog)run("INSERT OR IGNORE INTO art_theft_history SELECT o.id,e.user_id,o.spec_id FROM art_objects o JOIN events e ON e.message='Recovered artwork #'||o.id||': '||? WHERE o.spec_id=?",a.name,a.id);run("INSERT INTO art_history_meta VALUES('theft-v1')");}
 const spec=o=>artCatalog.find(a=>a.id===o.spec_id),safe=o=>({...o,authentic:o.appraised?!!o.authentic:undefined,estimated_value:o.appraised?o.estimated_value:undefined,marketEstimate:Math.floor(spec(o).value*o.condition/100),...spec(o),id:o.id,serial:'ART-'+String(o.id).padStart(8,'0'),appraisalCost:Math.ceil(spec(o).value*.04)});
 function credit(id,n){if(!run('UPDATE users SET cash=cash+? WHERE id=? AND cash<=?',n,id,MAX_CASH-n).changes)fail('Not enough wallet space to settle this auction.',409)}
 function refund(id,n){const cash=q('SELECT cash FROM users WHERE id=?',id).cash,paid=Math.min(n,Math.max(0,MAX_CASH-cash));if(paid)credit(id,paid);if(n>paid)run('INSERT INTO art_refunds(user_id,amount) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET amount=amount+excluded.amount',id,n-paid);}
 function bonuses(id){const n=q("SELECT COUNT(DISTINCT spec_id) n FROM art_objects WHERE user_id=? AND state='collection' AND appraised=1 AND authentic=1",id).n;return {unique:n,income:Math.min(.03,Math.floor(n/3)*.01),title:n>=9?'Patron of the Underworld':n>=6?'Private Curator':n>=3?'Art Collector':null};}
 function settle(){return transaction(()=>{for(const r of all('SELECT * FROM art_refunds WHERE amount>0')){const paid=Math.min(r.amount,Math.max(0,MAX_CASH-q('SELECT cash FROM users WHERE id=?',r.user_id).cash));if(paid){credit(r.user_id,paid);run('UPDATE art_refunds SET amount=amount-? WHERE user_id=?',paid,r.user_id);}}for(const a of all("SELECT * FROM art_auctions WHERE state='open' AND ends_at<=? ORDER BY id",clock())){
   if(!a.bidder_id){run("UPDATE art_auctions SET state='unsold' WHERE id=?",a.id);run("UPDATE art_objects SET state='collection' WHERE id=?",a.object_id);notify(a.seller_id,'Auction ended without bids','Your artwork has returned to your collection.','/images/page-art-market.png');continue;}
   settleRaw(a.seller_id);settleRaw(a.bidder_id);
   const fee=Number(BigInt(a.bid)*8n/100n),payout=a.bid-fee;
   // A full wallet delays settlement without losing bidder escrow or the artwork.
   if(q('SELECT cash FROM users WHERE id=?',a.seller_id).cash>MAX_CASH-payout)continue;
   credit(a.seller_id,payout);run("UPDATE art_objects SET user_id=?,state='collection' WHERE id=?",a.bidder_id,a.object_id);run("UPDATE art_auctions SET state='sold' WHERE id=?",a.id);
   log(a.seller_id,'Art auction #'+a.id+': received $'+payout+' after $'+fee+' commission.');notify(a.seller_id,'Artwork sold','Auction #'+a.id+' paid $'+payout+' after commission.','/images/page-art-market.png');notify(a.bidder_id,'Auction won','Your winning artwork is now in your collection.','/images/page-art-market.png');
  }});}
 function board(id){settle();const u=q('SELECT * FROM users WHERE id=?',id),a=inventory('personal',id);return {serverTime:clock(),commission:AUCTION_COMMISSION,refundCredit:q('SELECT amount FROM art_refunds WHERE user_id=?',id)?.amount||0,bonus:bonuses(id),heists:artHeists.map(h=>({...h,loot:h.loot.map(x=>({id:x.id,name:x.name,value:x.value,image:x.image,probability:x.weight/h.loot.reduce((n,y)=>n+y.weight,0)})),successChance:artHeistChance(h,u.xp),rewardXp:Math.floor(h.rewardXp*rewardBonus(id)),available:u.xp>=h.xp&&u.energy>=h.energy&&u.cash>=h.fee&&a.ammo>=h.ammo&&a.tier>=h.tier&&u.health>=10&&Math.max(u.prison_until,u.hospital_until)<=clock()})),cooldownUntil:q('SELECT until_at FROM art_heist_cooldowns WHERE user_id=?',id)?.until_at||0,collection:all("SELECT * FROM art_objects WHERE user_id=? AND state='collection' ORDER BY id DESC",id).map(safe),auctions:all("SELECT a.*,u.username seller,v.username bidder FROM art_auctions a JOIN users u ON u.id=a.seller_id LEFT JOIN users v ON v.id=a.bidder_id WHERE a.state='open' ORDER BY a.ends_at").map(a=>({...a,object:safe(q('SELECT * FROM art_objects WHERE id=?',a.object_id)),nextBid:a.bid?Math.ceil(a.bid*1.05):a.reserve})),history:all("SELECT id,bid,state,ends_at FROM art_auctions WHERE (seller_id=? OR bidder_id=?) AND state<>'open' ORDER BY id DESC LIMIT 10",id,id)};}
 function route(req,path,b,user){if(!path.startsWith('/api/art'))return null;return transaction(()=>{
  settle();if(req.method==='GET'&&path==='/api/art')return board(user.id);if(req.method!=='POST')fail('Method not allowed.',405);const u=settleRaw(user.id);available(u);
  if(path==='/api/art/heist'){
   const h=artHeists.find(x=>x.id===b.kind);if(!h)fail('Choose an art heist.');if(u.xp<h.xp||u.energy<h.energy)fail('Insufficient XP or energy for this heist.',409);if((q('SELECT until_at FROM art_heist_cooldowns WHERE user_id=?',u.id)?.until_at||0)>clock())fail('Your art crew is still on cooldown.',429);
   if(q("SELECT COUNT(*) n FROM art_objects WHERE user_id=? AND state IN ('collection','auction')",u.id).n+q("SELECT COUNT(*) n FROM art_auctions WHERE bidder_id=? AND state='open'",u.id).n>=100)fail('Your collection is full. Sell an artwork first.',409);
   consume(u.id,'personal',h.ammo,h.tier);if(!run('UPDATE users SET cash=cash-?,energy=energy-? WHERE id=? AND cash>=? AND energy>=?',h.fee,h.energy,u.id,h.fee,h.energy).changes)fail('Insufficient cash or energy.',409);
   run('INSERT INTO art_heist_cooldowns VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET until_at=excluded.until_at',u.id,clock()+h.cooldown);
   const success=roll()<Math.round(artHeistChance(h,u.xp)*10000);
   if(!success){let bribe=null;if(roll()<3500){arrest(u.id,Math.ceil(h.energy/5));bribe=offerBribe(u.id,{label:h.name,referenceCash:h.fee*2});}log(u.id,'Art heist failed: '+h.name);return {ok:true,success:false,cost:h.fee,bribe,message:'The art heist failed. Your stake and supplies were lost.',image:bribe?.image||'/images/outcome-failed.png'};}
   const pool=h.loot;let ticket=draw(1,pool.reduce((n,x)=>n+x.weight,0));const a=pool.find(x=>(ticket-=x.weight)<=0)||pool.at(-1),authentic=roll()>=1200,condition=draw(65,100),value=Math.floor(a.value*condition/100*(authentic?1:.08));
   const xp=Math.floor(h.rewardXp*rewardBonus(u.id));run('UPDATE users SET xp=MIN(?,xp+?) WHERE id=?',MAX_XP,xp,u.id);promote(u.id);
   const result=run('INSERT INTO art_objects(user_id,spec_id,authentic,condition,estimated_value,created_at) VALUES(?,?,?,?,?,?)',u.id,a.id,authentic?1:0,condition,value,clock());run('INSERT INTO art_theft_history VALUES(?,?,?)',result.lastInsertRowid,u.id,a.id);log(u.id,'Recovered artwork #'+result.lastInsertRowid+': '+a.name);return {ok:true,success:true,xp,object:safe(q('SELECT * FROM art_objects WHERE id=?',result.lastInsertRowid)),message:'A unique artwork recovered. Appraise it before trading.',image:a.image};
  }
  if(path==='/api/art/appraise'||path==='/api/art/list'){
   if(!Number.isSafeInteger(b.id))fail('Choose an artwork.');const o=q("SELECT * FROM art_objects WHERE id=? AND user_id=? AND state='collection'",b.id,u.id);if(!o)fail('Artwork unavailable.',409);const a=spec(o);
   if(path.endsWith('/appraise')){if(o.appraised)fail('This artwork is already appraised.',409);const fee=Math.ceil(a.value*.04);if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',fee,u.id,fee).changes)fail('Insufficient cash.');run('UPDATE art_objects SET appraised=1 WHERE id=?',o.id);return {ok:true,cost:fee,message:o.authentic?'Authentic artwork certified.':'The appraisal revealed a reproduction.',image:a.image};}
   if(!o.appraised)fail('Appraise the artwork before listing it.');if(![6,12,24].includes(b.hours)||!Number.isSafeInteger(b.reserve)||b.reserve<Math.max(1,Math.floor(o.estimated_value*.25))||b.reserve>o.estimated_value*3)fail('Choose 6, 12 or 24 hours and a reserve between 25% and 300% of appraised value.');
   if(q("SELECT COUNT(*) n FROM art_auctions WHERE seller_id=? AND state='open'",u.id).n>=5)fail('Maximum five active listings.',409);
   // Each serial is listed once; unsold pieces can be listed again.
   const end=clock()+b.hours*3600000;run('INSERT INTO art_auctions(object_id,seller_id,reserve,ends_at,original_end) VALUES(?,?,?,?,?)',o.id,u.id,b.reserve,end,end);run("UPDATE art_objects SET state='auction' WHERE id=?",o.id);return {ok:true,message:'Artwork listed. Bids are held in escrow; commission is 8%.',image:a.image};
  }
  if(path==='/api/art/bid'){
   if(!Number.isSafeInteger(b.id)||!Number.isSafeInteger(b.amount))fail('Choose a valid bid.');const a=q("SELECT * FROM art_auctions WHERE id=? AND state='open' AND ends_at>?",b.id,clock());if(!a)fail('Auction closed.',409);if(a.seller_id===u.id||a.bidder_id===u.id)fail('You cannot bid against yourself.',409);
   const min=a.bid?Number((BigInt(a.bid)*105n+99n)/100n):a.reserve;if(b.amount<min||b.amount>MAX_CASH)fail('Bid below the current minimum.',409);
   if(q("SELECT COUNT(*) n FROM art_objects WHERE user_id=? AND state IN ('collection','auction')",u.id).n+q("SELECT COUNT(*) n FROM art_auctions WHERE bidder_id=? AND state='open'",u.id).n>=100)fail('Reserve collection space before bidding.',409);
   const reserved=q("SELECT COALESCE(SUM(bid),0) n FROM art_auctions WHERE bidder_id=? AND state='open'",u.id).n+(q('SELECT amount FROM art_refunds WHERE user_id=?',u.id)?.amount||0);if(reserved>MAX_CASH-b.amount)fail('Reserved bids and refund credit have reached the account limit.',409);
   if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',b.amount,u.id,b.amount).changes)fail('Insufficient cash.');if(a.bidder_id)refund(a.bidder_id,a.bid);
   const end=a.ends_at-clock()<120000?Math.min(a.original_end+1800000,clock()+120000):a.ends_at;run('UPDATE art_auctions SET bid=?,bidder_id=?,ends_at=? WHERE id=?',b.amount,u.id,end,a.id);if(a.bidder_id)notify(a.bidder_id,'You were outbid','Your previous bid has been refunded.','/images/page-art-market.png');return {ok:true,message:'Bid reserved. You will be refunded automatically if outbid.',image:'/images/page-art-market.png'};
  }fail('Unknown art action.',404);
 });}
 return {route,settle,bonuses,board};
}
