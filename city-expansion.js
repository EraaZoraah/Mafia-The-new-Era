import {MAX_CASH,MAX_XP} from './money.js';
import {randomInt} from 'node:crypto';
import {isStaff} from './staff.js';
import {releaseNotes} from './release-notes.js';
const MAX=MAX_CASH,STEP=300000;
// Ordinary moves, occasional shocks and rare rallies; never a negative quote.
export function nextCryptoPrice(price,base,draw=randomInt){
 const event=draw(0,1000);
 const basisPoints=event<5?draw(10000,20001):event<25?draw(-6500,-2499):event<100?draw(-2500,3501):draw(-600,601);
 return Math.max(Math.max(1,Math.floor(base*.01)),Math.min(base*20,Math.round(price*(1+basisPoints/10000))));
}
export const employees=[
 ['runner','Street Runner',100000,2800,1,1000000000,0],
 ['driver','Personal Chauffeur',500000,0,0,1,2],
 ['bookkeeper','Bookkeeper',1500000,41667,0,1,0],
 ['broker','Underworld Broker',5000000,138889,0,1,0],
 ['guard','Elite Personal Bodyguard',15000000,0,25000,6,0],
 ['director','Operations Leaders',50000000,1388889,10000,6,0]
].map(([id,name,price,income,power,limit,respectPerDay])=>({id,name,price,income,power,limit,respectPerDay,image:'/images/employee-'+id+'.png'}));
export const coins=['Omerta','Vendetta','Sovereign','Nightfall','Vesper','Onyx','Crown','Silk','Harbor','Cipher','Ember','Ghost','Vault','Aureus','Raven'].map((name,i)=>({id:name.toLowerCase(),name,symbol:['OMR','VEN','SOV','NGT','VSP','ONX','CRW','SLK','HBR','CPH','EMB','GHO','VLT','AUR','RVN'][i],base:[250,500,1000,2500,5000,10000,25000,50000,100000,750,7500,15000,75000,150000,250000][i]}));
export const breakoutRanks=['Lookout','Lockpicker','Getaway Rookie','Inside Contact','Escape Driver','Tunnel Scout','Cellblock Runner','Prison Fixer','Extraction Specialist','Escape Planner','Crew Coordinator','Breakout Captain','Mastermind','Ghost Operator','The Liberator'].map((name,i)=>({name,level:i+1,xp:Math.round(100*i**1.8),chanceBonus:i*.025}));
export const breakoutCareer=xp=>{const rank=breakoutRanks.findLast(r=>xp>=r.xp)||breakoutRanks[0];return {...rank,xp,next:breakoutRanks[rank.level]||null}};
export function installCityExpansion(db,{passiveSupporter=()=>1,marriageBonus=()=>1,transaction,clock,fail,settleRaw,available,benefits,promote,log,blockedMillis,supporterBonus}){
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 db.exec(`CREATE TABLE IF NOT EXISTS employees(user_id INTEGER REFERENCES users(id),item_id TEXT,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 4),income_at INTEGER NOT NULL,remainder REAL NOT NULL DEFAULT 0,PRIMARY KEY(user_id,item_id));
 CREATE TABLE IF NOT EXISTS crypto_prices(coin TEXT PRIMARY KEY,price INTEGER NOT NULL,epoch INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS crypto_history(coin TEXT,epoch INTEGER,price INTEGER,PRIMARY KEY(coin,epoch));
 CREATE TABLE IF NOT EXISTS crypto_wallet(user_id INTEGER REFERENCES users(id),coin TEXT,quantity INTEGER NOT NULL CHECK(quantity>=0),basis INTEGER NOT NULL,PRIMARY KEY(user_id,coin));
 CREATE TABLE IF NOT EXISTS expansion_requests(user_id INTEGER REFERENCES users(id),key TEXT,payload TEXT,result TEXT,PRIMARY KEY(user_id,key));
 CREATE TABLE IF NOT EXISTS gift_batches(id INTEGER PRIMARY KEY,actor_id INTEGER REFERENCES users(id),message TEXT,rewards TEXT,created_at INTEGER);
 CREATE TABLE IF NOT EXISTS gift_receipts(user_id INTEGER REFERENCES users(id),batch_id INTEGER REFERENCES gift_batches(id),claimed_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,batch_id));
 CREATE TABLE IF NOT EXISTS release_announcements(release_id TEXT PRIMARY KEY,bulletin_id INTEGER REFERENCES bulletins(id));
 CREATE TABLE IF NOT EXISTS news_seen(user_id INTEGER REFERENCES users(id),token TEXT,PRIMARY KEY(user_id,token));`);
 // Migrate limits without retaining surplus employees.
 if(!q("SELECT sql FROM sqlite_master WHERE name='employees'").sql.includes('100000'))transaction(()=>db.exec(`CREATE TABLE employees_v2(user_id INTEGER REFERENCES users(id),item_id TEXT,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 100000),income_at INTEGER NOT NULL,remainder REAL NOT NULL DEFAULT 0,PRIMARY KEY(user_id,item_id));INSERT INTO employees_v2 SELECT * FROM employees;DROP TABLE employees;ALTER TABLE employees_v2 RENAME TO employees;`));
 if(!q("SELECT sql FROM sqlite_master WHERE name='employees'").sql.includes('1000000000'))transaction(()=>{
  const hasRespect=all('PRAGMA table_info(employees)').some(x=>x.name==='respect_remainder');
  db.exec(`CREATE TABLE employees_v3(user_id INTEGER REFERENCES users(id),item_id TEXT,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 1000000000),income_at INTEGER NOT NULL,remainder REAL NOT NULL DEFAULT 0,respect_remainder REAL NOT NULL DEFAULT 0,PRIMARY KEY(user_id,item_id));INSERT INTO employees_v3 SELECT user_id,item_id,quantity,income_at,remainder,${hasRespect?'respect_remainder':'0'} FROM employees;DROP TABLE employees;ALTER TABLE employees_v3 RENAME TO employees;`);
 });
 if(!all('PRAGMA table_info(employees)').some(x=>x.name==='respect_remainder'))db.exec('ALTER TABLE employees ADD COLUMN respect_remainder REAL NOT NULL DEFAULT 0');
 for(const e of employees)run('UPDATE employees SET quantity=MIN(quantity,?) WHERE item_id=?',e.limit,e.id);
 if(!all('PRAGMA table_info(users)').some(x=>x.name==='breakout_xp'))db.exec('ALTER TABLE users ADD COLUMN breakout_xp INTEGER NOT NULL DEFAULT 0');
 function publish(){const owner=q("SELECT id FROM users WHERE role='owner' AND banned=0 AND deleted_at=0 ORDER BY id LIMIT 1");if(!owner)return;transaction(()=>{for(const n of releaseNotes.filter(n=>n.announce)){if(q('SELECT 1 FROM release_announcements WHERE release_id=?',n.id))continue;const r=run("INSERT INTO bulletins(author_id,kind,title,body,status,starts_at,ends_at,popup,updated_at) VALUES(?,'announcement',?,?,'published',?,?,0,?)",owner.id,'New features · '+n.title,n.items.map(x=>'• '+x).join('\n'),clock(),clock()+28*86400000,clock());run('INSERT INTO release_announcements VALUES(?,?)',n.id,Number(r.lastInsertRowid));}})}
 function stats(id){return all('SELECT * FROM employees WHERE user_id=?',id).reduce((s,r)=>{const e=employees.find(e=>e.id===r.item_id);if(e){s.power+=e.power*r.quantity;s.income+=e.income*r.quantity;s.value+=e.price*r.quantity;s.count+=r.quantity}return s},{power:0,income:0,value:0,count:0})}
 function accrue(id,time,multiplier,window={from:time-86400000,to:time}){let earned=0;for(const r of all('SELECT * FROM employees WHERE user_id=?',id)){const e=employees.find(e=>e.id===r.item_id);if(!e)continue;const from=Math.max(r.income_at,window.from),end=Math.max(from,window.to),active=Math.max(0,end-from-blockedMillis(id,from,end)),respectActive=Math.max(0,time-r.income_at-blockedMillis(id,r.income_at,time));const n=active/3600000*e.income*r.quantity*marriageBonus(id)*passiveSupporter(id,from,end)+r.remainder;earned+=Math.floor(n);if(e.respectPerDay){const respect=Math.min(86400000,respectActive)/86400000*e.respectPerDay*r.quantity+r.respect_remainder;run('UPDATE users SET respect_received=MIN(?,respect_received+?) WHERE id=?',MAX_XP,Math.floor(respect),id);run('UPDATE employees SET respect_remainder=? WHERE user_id=? AND item_id=?',respect%1,id,r.item_id);}run('UPDATE employees SET income_at=?,remainder=? WHERE user_id=? AND item_id=?',time,n%1,id,r.item_id)}return earned}
 db.exec("CREATE TABLE IF NOT EXISTS crypto_trade_history(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),coin TEXT NOT NULL,side TEXT NOT NULL,quantity INTEGER NOT NULL,amount INTEGER NOT NULL,basis INTEGER NOT NULL,created_at INTEGER NOT NULL)");
 db.exec("CREATE TABLE IF NOT EXISTS portfolio_migrations(id TEXT PRIMARY KEY)");
 if(!q("SELECT 1 FROM portfolio_migrations WHERE id='crypto-receipts-v1'"))transaction(()=>{
  for(const user of all('PRAGMA table_info(events)').some(c=>c.name==='message')?all('SELECT id FROM users'):[]){
   if(q('SELECT 1 FROM crypto_trade_history WHERE user_id=? LIMIT 1',user.id))continue;
   const rows=all("SELECT message,created_at FROM events WHERE user_id=? AND message LIKE 'Crypto %' ORDER BY created_at,id",user.id),wallet=new Map(),records=[];let valid=rows.length>0;
   for(const row of rows){const m=row.message.match(/^Crypto (buy|sell) (\d+) ([A-Z]+) for \$(\d+)$/),coin=m&&coins.find(c=>c.symbol===m[3]);if(!coin){valid=false;break;}const quantity=Number(m[2]),amount=Number(m[4]),w=wallet.get(coin.id)||{quantity:0,basis:0};let basis=amount;if(m[1]==='buy'){w.quantity+=quantity;w.basis+=amount;}else {if(quantity>w.quantity){valid=false;break;}basis=quantity===w.quantity?w.basis:Math.floor(w.basis*quantity/w.quantity);w.quantity-=quantity;w.basis-=basis;}wallet.set(coin.id,w);records.push([user.id,coin.id,m[1],quantity,amount,basis,row.created_at]);}
   if(valid)for(const coin of coins){const actual=q('SELECT quantity,basis FROM crypto_wallet WHERE user_id=? AND coin=?',user.id,coin.id)||{quantity:0,basis:0},w=wallet.get(coin.id)||{quantity:0,basis:0};if(actual.quantity!==w.quantity||actual.basis!==w.basis){valid=false;break;}}
   if(valid)for(const r of records)run('INSERT INTO crypto_trade_history(user_id,coin,side,quantity,amount,basis,created_at) VALUES(?,?,?,?,?,?,?)',...r);
  }
  run("INSERT INTO portfolio_migrations VALUES('crypto-receipts-v1')");
 });
 function cryptoPerformance(id){const a=q("SELECT COALESCE(SUM(amount-basis),0) profit,COALESCE(SUM(basis),0) basis,COUNT(*) trades FROM crypto_trade_history WHERE user_id=? AND side='sell'",id);return {...a,margin:a.basis?a.profit/a.basis*100:0};}
 db.exec('CREATE TABLE IF NOT EXISTS crypto_market_migrations(id TEXT PRIMARY KEY)');
 if(!q("SELECT 1 FROM crypto_market_migrations WHERE id='five-minute-v1'"))transaction(()=>{
  // Preserve old prices and timestamps, rather than simulate months of extra ticks.
  const history=all('SELECT coin,epoch,price FROM crypto_history');
  db.exec('UPDATE crypto_prices SET epoch=epoch*2; DELETE FROM crypto_history;');
  for(const h of history)run('INSERT INTO crypto_history VALUES(?,?,?)',h.coin,h.epoch*2,h.price);
  run("INSERT INTO crypto_market_migrations VALUES('five-minute-v1')");
 });
 function market(){const epoch=Math.floor(clock()/STEP);for(const c of coins){let p=q('SELECT * FROM crypto_prices WHERE coin=?',c.id);if(!p){run('INSERT INTO crypto_prices VALUES(?,?,?)',c.id,c.base,epoch);run('INSERT OR IGNORE INTO crypto_history VALUES(?,?,?)',c.id,epoch,c.base);continue}for(let n=Math.max(p.epoch+1,epoch-287);n<=epoch;n++){p.price=nextCryptoPrice(p.price,c.base);run('INSERT OR IGNORE INTO crypto_history VALUES(?,?,?)',c.id,n,p.price)}if(p.epoch<epoch)run('UPDATE crypto_prices SET price=?,epoch=? WHERE coin=?',p.price,epoch,c.id)}run('DELETE FROM crypto_history WHERE epoch<?',epoch-288);return coins.map(c=>{const p=q('SELECT * FROM crypto_prices WHERE coin=?',c.id),previous=q('SELECT price FROM crypto_history WHERE coin=? AND epoch<? ORDER BY epoch DESC LIMIT 1',c.id,epoch)?.price||p.price;return {...c,...p,buy:Math.ceil(p.price*1.01),sell:Math.floor(p.price*.99),change:(p.price/previous-1)*100}})}
 const tokens=()=>[...releaseNotes.map(n=>'release:'+n.id),...all("SELECT id,revision FROM bulletins WHERE status='published' AND starts_at<=? AND ends_at>?",clock(),clock()).map(b=>'bulletin:'+b.id+':'+b.revision)];
 function once(user,path,b,fn){return transaction(()=>{if(typeof b.key!=='string'||!/^[-\w]{16,80}$/.test(b.key))fail('A request key is required.');const payload=JSON.stringify({path,...b}),old=q('SELECT * FROM expansion_requests WHERE user_id=? AND key=?',user.id,b.key);if(old){if(old.payload!==payload)fail('Request key reused for another action.',409);return JSON.parse(old.result)}const result=fn();run('INSERT INTO expansion_requests VALUES(?,?,?,?)',user.id,b.key,payload,JSON.stringify(result));return result})}
 function route(req,path,b,u){
  if(path==='/api/news'&&req.method==='GET'){const current=tokens();return {notes:releaseNotes,tokens:current,unread:current.some(t=>!q('SELECT 1 FROM news_seen WHERE user_id=? AND token=?',u.id,t))}}
  if(path==='/api/news/read'&&req.method==='POST')return transaction(()=>{if(!Array.isArray(b.tokens)||b.tokens.length>1000)fail('Invalid news receipt.');const valid=new Set(tokens());for(const token of b.tokens)if(valid.has(token))run('INSERT OR IGNORE INTO news_seen VALUES(?,?)',u.id,token);return {ok:true}});
  if(path==='/api/employees'&&req.method==='GET')return {items:employees.map(e=>({...e,quantity:q('SELECT quantity FROM employees WHERE user_id=? AND item_id=?',u.id,e.id)?.quantity||0})),stats:stats(u.id),multiplier:marriageBonus(u.id)*passiveSupporter(u.id,clock()-1,clock())};
  if(path==='/api/crypto'&&req.method==='GET')return transaction(()=>({performance:cryptoPerformance(u.id),coins:market(),wallet:all('SELECT * FROM crypto_wallet WHERE user_id=?',u.id),nextUpdate:(Math.floor(clock()/STEP)+1)*STEP,limit:100000000,history:all('SELECT * FROM crypto_history ORDER BY epoch DESC LIMIT 180')}));
  if(path==='/api/gifts'&&req.method==='GET')return {gifts:all('SELECT b.* FROM gift_batches b JOIN gift_receipts r ON r.batch_id=b.id WHERE r.user_id=? AND r.claimed_at=0 ORDER BY b.id',u.id).map(g=>({...g,rewards:JSON.parse(g.rewards)}))};
  if(req.method!=='POST'||!['/api/crypto/trade','/api/employees/hire','/api/admin/gifts','/api/gifts/collect'].includes(path))return null;
  return once(u,path,b,()=>{
   if(path==='/api/admin/gifts'){
    if(!isStaff(u))fail('Only Owner and Admin can send gifts.',403);
    const limits={cash:1000000000,xp:10000000,energy:1000,ammo:1000000,drugs_xp:1000000,guns_xp:1000000,breakout_xp:1000000,respect_received:1000};
    if(!b.rewards||typeof b.rewards!=='object'||Array.isArray(b.rewards)||Object.keys(b.rewards).some(k=>!Object.hasOwn(limits,k)))fail('Choose valid rewards.');
    for(const [k,v] of Object.entries(b.rewards))if(!Number.isSafeInteger(v)||v<0||v>limits[k])fail('Invalid '+k+' reward.');
    if(!Object.values(b.rewards).some(v=>v>0)||typeof b.message!=='string'||!b.message.trim()||b.message.length>500)fail('Enter a message and at least one reward.');
    const id=Number(run('INSERT INTO gift_batches(actor_id,message,rewards,created_at) VALUES(?,?,?,?)',u.id,b.message.trim(),JSON.stringify(b.rewards),clock()).lastInsertRowid);
    run('INSERT INTO gift_receipts(user_id,batch_id) SELECT id,? FROM users WHERE banned=0 AND deleted_at=0',id);
    const count=q('SELECT COUNT(*) n FROM gift_receipts WHERE batch_id=?',id).n;
    run('INSERT INTO owner_audit(actor_id,target_id,details,created_at) VALUES(?,?,?,?)',u.id,u.id,JSON.stringify({complimentaryGift:id,count,rewards:b.rewards}),clock());return {ok:true,message:'Complimentary gift reserved for '+count+' players.'};
   }
   const user=settleRaw(u.id);available(user);
   if(path==='/api/gifts/collect'){
    if(!Number.isSafeInteger(b.id))fail('Choose a gift.');const g=q('SELECT b.*,r.claimed_at FROM gift_batches b JOIN gift_receipts r ON r.batch_id=b.id WHERE b.id=? AND r.user_id=?',b.id,u.id);if(!g)fail('Gift not found.',404);if(g.claimed_at)return {ok:true,message:'Already collected.'};const rewards=JSON.parse(g.rewards);
    for(const [k,v] of Object.entries(rewards)){if(k==='ammo'){const ammo=q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=?",u.id)?.ammo||0;if(ammo+v>1000000)fail('Make room for the full ammunition gift first. Your gift is saved.',409);run("UPDATE armory_accounts SET ammo=ammo+? WHERE scope='personal' AND owner_id=?",v,u.id)}else if(k==='energy')run('UPDATE users SET energy=MAX(energy,MIN(?,energy+?)) WHERE id=?',benefits(u.id).energyMax,v,u.id);else {if(user[k]+v>(k==='cash'?MAX:MAX_XP))fail('Make room for the full '+k+' gift first.',409);run('UPDATE users SET '+k+'='+k+'+? WHERE id=?',v,u.id)}}
    run('UPDATE gift_receipts SET claimed_at=? WHERE user_id=? AND batch_id=?',clock(),u.id,b.id);promote(u.id,user.xp);log(u.id,'Collected Complimentary gift #'+b.id);return {ok:true,message:'Complimentary gift collected. Energy is restored up to your maximum.',image:'/images/premium-shop-v4.png'};
   }
   if(path==='/api/employees/hire'){
    const e=employees.find(e=>e.id===b.item),have=q('SELECT quantity FROM employees WHERE user_id=? AND item_id=?',u.id,b.item||'')?.quantity||0;if(!e||!Number.isSafeInteger(b.quantity)||b.quantity<1||b.quantity+have>e.limit)fail('Choose a quantity within this employee type limit.');const cost=e.price*b.quantity;if(user.cash<cost)fail('Insufficient cash.');run('UPDATE users SET cash=cash-? WHERE id=?',cost,u.id);run('INSERT INTO employees(user_id,item_id,quantity,income_at) VALUES(?,?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET quantity=quantity+excluded.quantity',u.id,e.id,b.quantity,clock());log(u.id,'Hired '+b.quantity+' '+e.name+' for $'+cost);return {ok:true,cost,message:'Your new employees provide their listed income, Power or respect benefits.',image:e.image};
   }
   const c=market().find(c=>c.id===b.coin);if(!c||!['buy','sell'].includes(b.side)||!Number.isSafeInteger(b.quantity)||b.quantity<1||b.quantity>100000000)fail('Choose a coin, side and whole quantity.');if(b.epoch!==c.epoch)fail('The five-minute quote changed. Refresh prices.',409);const w=q('SELECT * FROM crypto_wallet WHERE user_id=? AND coin=?',u.id,c.id)||{quantity:0,basis:0};let amount,realizedBasis=0;
   if(b.side==='buy'){amount=c.buy*b.quantity;if(amount>100000000||w.basis+amount>100000000)fail('Maximum cost basis is $100 million per coin.');if(amount>user.cash)fail('Insufficient cash.');run('UPDATE users SET cash=cash-? WHERE id=?',amount,u.id);run('INSERT INTO crypto_wallet VALUES(?,?,?,?) ON CONFLICT(user_id,coin) DO UPDATE SET quantity=quantity+excluded.quantity,basis=basis+excluded.basis',u.id,c.id,b.quantity,amount)}
   else {if(w.quantity<b.quantity)fail('Insufficient coins.');const basis=b.quantity===w.quantity?w.basis:Math.floor(w.basis*b.quantity/w.quantity),gross=c.sell*b.quantity;realizedBasis=basis;amount=gross+Math.floor(Math.max(0,gross-basis)*(supporterBonus(u.id)-1));if(user.cash+amount>MAX)fail('Make room in your cash wallet.');run('UPDATE crypto_wallet SET quantity=quantity-?,basis=basis-? WHERE user_id=? AND coin=?',b.quantity,basis,u.id,c.id);run('UPDATE users SET cash=cash+? WHERE id=?',amount,u.id)}
   run('INSERT INTO crypto_trade_history(user_id,coin,side,quantity,amount,basis,created_at) VALUES(?,?,?,?,?,?,?)',u.id,c.id,b.side,b.quantity,amount,b.side==='buy'?amount:realizedBasis,clock());log(u.id,'Crypto '+b.side+' '+b.quantity+' '+c.symbol+' for $'+amount);return {ok:true,message:b.side==='buy'?'Coins added to your wallet.':'Coins sold; proceeds added to cash.',[b.side==='buy'?'cost':'payout']:amount,image:'/images/scene-bank.jpg'};
  });
 }
 return {route,stats,accrue,publish};
}
