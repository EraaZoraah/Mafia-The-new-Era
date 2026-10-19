import {MAX_CASH} from './money.js';
import {stolenVehicles,vehicleSaleValue,vehicleCondition} from './vehicle-catalog.js';
export function installVehicleAuctions(db,{clock,fail,warehouses,occupied,notify}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS vehicle_auctions(id INTEGER PRIMARY KEY,vehicle_id INTEGER NOT NULL REFERENCES vehicle_loot(id),seller_id INTEGER NOT NULL REFERENCES users(id),reserve INTEGER NOT NULL,listing_fee INTEGER NOT NULL,ends_at INTEGER NOT NULL,original_end INTEGER NOT NULL,bid INTEGER NOT NULL DEFAULT 0,bidder_id INTEGER REFERENCES users(id),state TEXT NOT NULL DEFAULT 'open');CREATE UNIQUE INDEX IF NOT EXISTS vehicle_auction_active ON vehicle_auctions(vehicle_id) WHERE state='open';CREATE TABLE IF NOT EXISTS vehicle_refunds(user_id INTEGER PRIMARY KEY REFERENCES users(id),amount INTEGER NOT NULL DEFAULT 0);`);
 const nextBid=a=>a.bid?Number((BigInt(a.bid)*105n+99n)/100n):a.reserve;
 const locked=id=>!!q("SELECT 1 FROM vehicle_auctions WHERE vehicle_id=? AND state='open'",id);
 const reserved=id=>q("SELECT COUNT(*) n FROM vehicle_auctions WHERE bidder_id=? AND state='open'",id).n;
 function credit(id,amount){const old=q('SELECT amount FROM vehicle_refunds WHERE user_id=?',id)?.amount||0;const cash=q('SELECT cash FROM users WHERE id=?',id).cash,paid=Math.min(MAX_CASH-cash,amount+old);run('UPDATE users SET cash=cash+? WHERE id=?',paid,id);run('INSERT INTO vehicle_refunds VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET amount=excluded.amount',id,old+amount-paid);}
 function settle(){for(const a of all("SELECT * FROM vehicle_auctions WHERE state='open' AND ends_at<=?",clock())){
  if(a.bidder_id){if(BigInt(q('SELECT amount FROM vehicle_refunds WHERE user_id=?',a.seller_id)?.amount||0)+BigInt(a.bid)>BigInt(MAX_CASH))continue;const fee=Number(BigInt(a.bid)*3n/100n);credit(a.seller_id,a.bid-fee);if(q("SELECT 1 FROM sqlite_master WHERE name='race_vehicle_state'")){run('DELETE FROM race_vehicle_state WHERE user_id=? AND car_key=?',a.bidder_id,'s:'+a.vehicle_id);run('UPDATE race_vehicle_state SET user_id=? WHERE user_id=? AND car_key=?',a.bidder_id,a.seller_id,'s:'+a.vehicle_id);}run("UPDATE vehicle_loot SET user_id=?,state='stored' WHERE id=?",a.bidder_id,a.vehicle_id);run("UPDATE vehicle_auctions SET state='sold' WHERE id=?",a.id);notify(a.bidder_id,'Vehicle auction won','Your vehicle is in your warehouse.',stolenVehicles.find(c=>c.id===q('SELECT vehicle_id FROM vehicle_loot WHERE id=?',a.vehicle_id).vehicle_id).image);notify(a.seller_id,'Vehicle auction sold','Net proceeds: $'+(a.bid-fee)+'.','/images/banner-auction-house-v3.png');}else run("UPDATE vehicle_auctions SET state='unsold' WHERE id=?",a.id);
 }for(const r of all('SELECT * FROM vehicle_refunds WHERE amount>0'))credit(r.user_id,0);}
 const listingFee=row=>Math.min(250000,Math.max(500,Math.ceil(vehicleSaleValue(stolenVehicles.find(c=>c.id===row.vehicle_id),row.city,clock(),row.value_multiplier,row.condition_stars)*.0025)));
 function board(id){return {auctions:all("SELECT a.*,u.username seller,v.vehicle_id model,v.city,v.condition_stars FROM vehicle_auctions a JOIN vehicle_loot v ON v.id=a.vehicle_id JOIN users u ON u.id=a.seller_id WHERE a.state='open' ORDER BY a.ends_at").map(a=>({...a,name:stolenVehicles.find(c=>c.id===a.model).name,image:stolenVehicles.find(c=>c.id===a.model).image,condition:vehicleCondition(a.condition_stars),nextBid:nextBid(a)})),auctionHistory:all("SELECT id,state,bid,ends_at FROM vehicle_auctions WHERE state<>'open' ORDER BY ends_at DESC LIMIT 10"),auctionCredit:q('SELECT amount FROM vehicle_refunds WHERE user_id=?',id)?.amount||0,reservedBays:reserved(id)};}
 function action(path,body,id){
  if(['/api/vehicles/auction/list','/api/vehicles/auction/bid'].includes(path)&&(!Number.isSafeInteger(body.id)||body.id<1))fail('Choose a valid vehicle or auction.');
  if(path==='/api/vehicles/auction/list'){
   const row=q("SELECT * FROM vehicle_loot WHERE id=? AND user_id=? AND state='stored'",body.id,id);if(!row||locked(body.id))fail('Store an unlisted vehicle before auctioning it.',409);
   if(!Number.isSafeInteger(body.reserve)||body.reserve<1||body.reserve>MAX_CASH||![6,12,24].includes(body.hours))fail('Choose a positive minimum price and a 6, 12 or 24 hour auction.');
   if(q("SELECT COUNT(*) n FROM vehicle_auctions WHERE seller_id=? AND state='open'",id).n>=5)fail('You may have five active vehicle auctions.',409);
   const fee=listingFee(row);if(body.maxFee!==undefined&&fee>body.maxFee)fail('Listing quote changed. Refresh before confirming.',409);if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',fee,id,fee).changes)fail('Insufficient cash.');
   const end=clock()+body.hours*3600000,r=run('INSERT INTO vehicle_auctions(vehicle_id,seller_id,reserve,listing_fee,ends_at,original_end) VALUES(?,?,?,?,?,?)',row.id,id,body.reserve,fee,end,end);return {ok:true,id:Number(r.lastInsertRowid),cost:fee,message:'Vehicle listed. The listing fee is non-refundable; successful sales incur 3% commission.'};
  }
  if(path==='/api/vehicles/auction/bid'){
   const a=q("SELECT * FROM vehicle_auctions WHERE id=? AND state='open' AND ends_at>?",body.id,clock());if(!a)fail('Auction has ended.',409);if(a.seller_id===id||a.bidder_id===id)fail('You cannot bid on your own auction or raise your own leading bid.',409);
   if(!Number.isSafeInteger(body.amount)||body.amount<nextBid(a)||body.amount>MAX_CASH)fail('Bid is below the next minimum or above the money limit.');
   if(occupied(id)+reserved(id)>=warehouses(id,'vehicle')*20)fail('Buy a vehicle warehouse with a free bay before bidding.',409);
   const held=all("SELECT bid FROM vehicle_auctions WHERE bidder_id=? AND state='open'",id).reduce((n,r)=>n+BigInt(r.bid),0n)+BigInt(q('SELECT amount FROM vehicle_refunds WHERE user_id=?',id)?.amount||0);if(held+BigInt(body.amount)>BigInt(MAX_CASH))fail('Your auction escrow limit has been reached.',409);
   if(!run('UPDATE users SET cash=cash-? WHERE id=? AND cash>=?',body.amount,id,body.amount).changes)fail('Insufficient cash.');if(a.bidder_id)credit(a.bidder_id,a.bid);
   run('UPDATE vehicle_auctions SET bid=?,bidder_id=?,ends_at=? WHERE id=?',body.amount,id,Math.min(a.original_end+1800000,Math.max(a.ends_at,clock()+120000)),a.id);return {ok:true,message:'Bid placed. Cash and a warehouse bay are reserved until you win or are outbid.'};
  }
  return null;
 }
 return {settle,locked,reserved,board,action,listingFee};
}
