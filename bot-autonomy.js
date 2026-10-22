import {investmentLimit} from './investments.js';
import {musclePackages} from './empire-catalog.js';

// Every personality can choose every domain. Preferences affect frequency, never permission.
export const botDomains=['circuit','art','crimes','pvp','supplies','assets','employees','shipments','family-assets','team-missions','marriage','crypto','respect','chat','mystery','territory','rewards','banking','casino','lottery','investments','freight','vehicles','appearance','recruitment','leadership','diplomacy','war','planning','bounties','care','transfers','security','communication','community','travel','exploration'];
export const botBoundaries={staff:'Bots remain ordinary players; no staff grants, resets or settings.',payments:'No real-money checkout or fabricated premium ownership.',identity:'Scheduling represents sessions; bots never change login credentials or create accounts.',support:'Only genuine repeated server errors produce a deduplicated bug ticket; no invented accusations.',social:'Unsolicited invitations, transfers and destructive family management target bots. Replies to humans disclose automation.'};

export function autonomousMove(c,domain){
 const {id,u,family,db,get,act,pick,random,clock,profile}=c;
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),now=clock(),manager=family&&(family.leader_id===id||family.family_role==='capo'),don=family?.leader_id===id;
 const peers=()=>all("SELECT u.* FROM users u JOIN bot_players b ON b.user_id=u.id WHERE u.id<>? AND u.role='player' AND u.banned=0 AND u.deleted_at=0 AND b.enabled=1",id);
 const otherFamilies=()=>all("SELECT f.* FROM families f JOIN bot_players b ON b.user_id=f.leader_id JOIN users u ON u.id=f.leader_id WHERE f.id<>? AND u.role='player' AND u.banned=0 AND u.deleted_at=0",family?.id||0);
 const memory=key=>q('SELECT * FROM bot_decisions WHERE user_id=? AND domain=?',id,key);
 const remember=(key,ms)=>db.prepare('INSERT INTO bot_decisions(user_id,domain,next_at) VALUES(?,?,?) ON CONFLICT(user_id,domain) DO UPDATE SET next_at=excluded.next_at').run(id,key,now+ms);
 const send=(p,b={})=>{act(p,b);return true};
 const sporadic=(key,ms,fn)=>{if((memory(key)?.next_at||0)>now)return false;const done=fn();if(done)remember(key,ms);return done};
 switch(domain){
 case 'circuit':{
  const b=get('circuit');if(!b||b.pending||b.profile.next_at>now||u.energy<8||u.health<10)return false;
  const cars=b.cars.filter(c=>!c.locked);const worn=cars.find(c=>c.wear>=30&&c.repairCost<u.cash*.02);if(worn)return send('circuit/workshop',{car:worn.key,kind:'repair',maxCost:worn.repairCost});
  const car=pick(cars.filter(c=>c.wear<80&&c.fee<u.cash*.02));if(!car){if(!cars.length){const shop=get('catalog')?.catalog||[],garage=shop.find(c=>c.category==='garage'&&!c.storageKind&&c.quantity<c.limit&&c.nextPrice<u.cash*.1);if(garage&&!q("SELECT 1 FROM possessions WHERE user_id=? AND category='garage' AND item_id NOT IN ('vehicle-warehouse','production-warehouse')",id))return send('assets/buy',{category:'garage',id:garage.id,quantity:1});const basic=shop.find(c=>c.category==='car'&&!c.quantity&&c.nextPrice<u.cash*.02);if(basic&&q("SELECT 1 FROM possessions WHERE user_id=? AND category='garage' AND item_id NOT IN ('vehicle-warehouse','production-warehouse')",id))return send('assets/buy',{category:'car',id:basic.id,quantity:1});}return false;}
  const tune=car.tune<car.maxTune&&car.tuneCost<u.cash*.001&&random(0,5)===0;if(tune)return send('circuit/workshop',{car:car.key,kind:'tune',maxCost:car.tuneCost});
  const mechanic=u.cash>car.fee*100&&!!random(0,3),choice={car:car.key,strategy:pick(['clean','clean','balanced','aggressive']),setup:pick(['street','speed','endurance']),mechanic};
  const lobby=b.lobbies.find(r=>r.class===car.class&&Math.abs(r.rating-car.rating)<=80&&!r.member);if(lobby)return send('circuit/join',{...choice,raceId:lobby.id,maxCost:lobby.fee+(mechanic?car.mechanicCost:0)});
  if(b.soloRewardsLeft&&random(0,3)){const best=b.recommendation;return send('circuit/solo',{...choice,...(best?{car:best.car,route:best.route,setup:best.setup,strategy:best.strategy,mechanic:false,maxCost:best.cost}:{route:pick(b.routes).id,maxCost:car.fee+(mechanic?car.mechanicCost:0)})});}
  return sporadic('race-lobby',3600000,()=>send('circuit/create',{...choice,route:pick(b.routes).id,capacity:pick([2,3,4]),maxCost:car.fee+(mechanic?car.mechanicCost:0)}));
 }
 case 'art':{
  const b=get('art');if(!b)return false;
  const raw=b.collection.find(o=>!o.appraised&&o.appraisalCost<=u.cash*.08);if(raw)return send('art/appraise',{id:raw.id});
  const duplicate=b.collection.find(o=>o.appraised&&b.collection.filter(x=>x.spec_id===o.spec_id).length>1),list=duplicate||((b.bonus.unique>=6||u.cash<1000000)?pick(b.collection.filter(o=>o.appraised)):null);
  if(list&&b.auctions.filter(a=>a.seller_id===id).length<5)return send('art/list',{id:list.id,reserve:Math.max(1,Math.floor(list.estimated_value*.8)),hours:pick([6,12,24])});
  const bid=b.auctions.find(a=>a.seller_id!==id&&a.bidder_id!==id&&a.object.authentic&&a.nextBid<=u.cash*.04&&a.nextBid<a.object.estimated_value*.85&&!b.collection.some(o=>o.spec_id===a.object.spec_id));if(bid)return send('art/bid',{id:bid.id,amount:bid.nextBid});
  const a=get('armory'),h=pick(b.heists.filter(h=>h.xp<=u.xp&&h.energy<=u.energy&&h.ammo<=a.ammo&&h.tier<=a.tier&&h.fee<=u.cash*.05));return h&&b.cooldownUntil<=now?send('art/heist',{kind:h.id}):false;
 }
 case 'crimes':{
  const a=get('armory'),board=get('catalog'),cd=all('SELECT kind,available_at FROM actions WHERE user_id=?',id);
  const job=pick(board?.crimes.filter(j=>!j.locked&&j.requiredXp<=u.xp&&j.energy<=u.energy&&j.supplies.tier<=a.tier&&j.supplies.ammo<=a.ammo&&!cd.some(c=>c.kind===j.id&&c.available_at>now))||[]);return job?send('action',{kind:job.id}):false;
 }
 case 'pvp':{
  const a=get('armory'),board=get('catalog'),targets=get('players')?.players.filter(p=>p.xp>=500&&p.protected_until<=now&&p.hospital_until<=now&&!q("SELECT 1 FROM users WHERE id=? AND (role<>'player' OR prison_until>?)",p.id,now)&&!q('SELECT 1 FROM family_members a JOIN family_members b ON a.family_id=b.family_id WHERE a.user_id=? AND b.user_id=?',id,p.id));
  const target=pick(targets||[]),job=pick(board?.pvpActions.filter(j=>j.energy<=u.energy&&j.supplies.ammo<=a.ammo&&j.supplies.tier<=a.tier)||[]);
  return u.xp>=500&&target&&job?send('pvp',{target:target.username,kind:job.id,...(job.id==='liquidate'?{rounds:Math.min(10000,Math.max(60,Math.floor(a.ammo*.05))),anonymous:u.cash>50e6&&!!random(0,2)}:{})}):false;
 }
 case 'supplies':{
  const scope=manager&&random(0,2)?'family':'personal',a=get('armory?scope='+scope),funds=scope==='family'?family.treasury:u.cash;if(!a)return false;
  if(a.ammo<1000){const quantity=Math.min(10000,a.ammoMax-a.ammo,Math.floor(funds*.05/a.ammoPrice));if(quantity>0)return send('armory/buy',{scope,kind:'ammo',quantity});}
  const w=pick(a.weapons.filter(w=>w.quantity<10000&&w.price<funds*.02));return w?send('armory/buy',{scope,kind:'weapon',item:w.id,quantity:1}):false;
 }
 case 'assets':{
  const v=get('vehicles'),item=pick(get('catalog')?.catalog.filter(a=>a.quantity<a.limit&&a.nextPrice<u.cash*.15&&(a.category!=='car'||v.garages.used<v.garages.capacity))||[]);return item?send('assets/buy',{category:item.category,id:item.id,quantity:1}):false;
 }
 case 'employees':{
  const e=pick(get('employees')?.items.filter(e=>e.quantity<e.limit&&e.price<u.cash*.02)||[]);return e?send('employees/hire',{item:e.id,quantity:Math.min(e.limit-e.quantity,Math.max(1,Math.min(1000,Math.floor(u.cash*.02/e.price))))}):false;
 }
 case 'shipments':{
  const e=get('empire'),a=get('armory'),shared=family?get('armory?scope=family'):null;
  const offers=e?.shipments.filter(s=>{const arm=s.scope==='family'?shared:a;return !s.locked&&s.energy<=u.energy&&s.personalCost<u.cash*.15&&s.familyCost<(family?.treasury||0)+(s.scope==='personal'?1:0)&&arm&&s.supplies.tier<=arm.tier&&s.supplies.ammo<=arm.ammo&&!e.cooldowns.some(c=>c.kind==='shipment:'+s.kind&&c.available_at>now)});
  const s=pick(offers||[]);return s?send('shipments/run',{kind:s.kind,scope:s.scope,tier:s.id}):false;
 }
 case 'family-assets':{
  if(!manager)return false;const f=get('family')?.family;if(!f)return false;const extension=get('compound/upgrades'),upgrade=extension?.compound?pick(extension.upgrades.filter(x=>!x.owned&&x.price<f.treasury*.1)):null;if(upgrade)return send('compound/upgrade',{upgrade:upgrade.id});
  const item=pick(f.assets.filter(a=>a.category!=='Territory'&&!a.upgradeBlocked&&a.quantity<a.limit&&a.nextPrice<f.treasury*.15));return item?send('family/buy',{id:item.id,quantity:1}):false;
 }
 case 'team-missions':{
  const board=get('team-missions'),a=get('armory');if(!board)return false;const eligible=m=>u.xp>=m.requiredXp&&u.energy>=m.energy&&u.cash>=m.fee&&a.tier>=m.tier&&a.ammo>=m.ammo;
  const own=board.lobbies.find(l=>l.members.some(m=>m.id===id));if(own){if(!eligible(own.spec))return send('team-missions/leave',{id:own.id});if(own.canLaunch&&own.members.length===own.spec.size)return send('team-missions/launch',{id:own.id});return false;}
  if(board.cooldown>now)return false;const lobby=pick(board.lobbies.filter(l=>l.members.length<l.spec.size&&eligible(l.spec)));if(lobby)return send('team-missions/join',{id:lobby.id});const m=pick(board.missions.filter(eligible));return m?send('team-missions/create',{mission:m.id}):false;
 }
 case 'marriage':return sporadic('marriage-choice',86400000,()=>{
  const m=get('marriage');if(!m)return false;const invite=m.invitations.find(i=>i.recipient_id===id);if(invite)return send('marriage/respond',{id:invite.id,action:!m.marriage&&random(0,5)?'accept':'decline'});
  if(m.marriage){const p=peers().find(p=>p.id===m.marriage.spouse_id);return p&&p.last_seen<now-30*86400000?send('marriage/divorce',{confirm:true}):false;}
  const partner=pick(peers().filter(p=>!q('SELECT 1 FROM marriage_members WHERE user_id=?',p.id)&&!q("SELECT 1 FROM marriage_invites WHERE sender_id=? AND recipient_id=? AND status='pending' AND expires_at>?",id,p.id,now)));return partner&&u.cash>20e6?send('marriage/invite',{target:partner.username}):false;
 });
 case 'crypto':{
  const x=get('crypto'),coin=pick(x?.coins||[]);if(!coin)return false;const w=x.wallet.find(w=>w.coin===coin.id),sell=w?.quantity&&(coin.sell*w.quantity>w.basis*1.02||u.cash<1e5||random(0,4)===0),quantity=sell?Math.max(1,Math.floor(w.quantity/2)):Math.min(100,Math.floor(Math.min(u.cash*.005,x.limit-(w?.basis||0))/coin.buy));return quantity>0?send('crypto/trade',{coin:coin.id,side:sell?'sell':'buy',quantity,epoch:coin.epoch}):false;
 }
 case 'respect':{
  if(family&&random(0,2)&&!q('SELECT 1 FROM family_respect_gifts WHERE user_id=? AND day=?',id,new Date(now).toISOString().slice(0,10)))return send('family/respect/give');
  const given=get('respect')?.givenToday||[];if(given.length>=5)return false;const target=pick(peers().filter(p=>!given.some(g=>g.username===p.username)));return target?send('respect/give',{target:target.username}):false;
 }
 case 'chat':return false; // Public/family chat is human-only.
 case 'mystery':{
  const m=get('mystery')?.offer;return m?send('mystery/resolve',{id:m.id,choice:random(0,5)?'accept':'decline'}):false;
 }
 case 'territory':{
  if(!manager)return false;const home=get('family/map'),city=pick(home?.cities||[]);if(!city)return false;const map=get('family/map?city='+encodeURIComponent(city.name));
  if(map.ownedInCity>=20)return false;const p=pick(map.plots.filter(p=>!p.owner_id&&p.price<family.treasury*.1));return p?send('family/map/buy',{city:city.name,plotId:p.id}):false;
 }
 case 'rewards':{
  const gift=get('gifts')?.gifts[0];if(gift)return send('gifts/collect',{id:gift.id});
  const earned=get('achievements')?.milestones.find(m=>m.earnedAt&&!m.xpClaimed);if(earned)return send('achievements/claim',{milestone:earned.id});
  const daily=get('daily'),job=daily?.jobs.find(j=>!j.claimed&&j.progress>=j.target);if(job)return send('daily/claim',{day:daily.day,job:job.id});
  const b=get('bounties');if(b?.pending)return send('bounties/collect');
  const p=profile(u);if(p.promotion)return send('promotion/ack',{id:p.promotion.id});
  const title=p.benefits.titles.at(-1);if(title&&title.id!==u.selected_title)return send('title',{title:title.id});
  const news=get('news');if(news?.unread)return send('news/read',{tokens:news.tokens});
  const event=get('calendar');if(event?.active&&!event.seen)return send('calendar/ack',{id:event.id});
  const notification=get('notifications')?.notifications?.[0];if(notification)return send('notifications/ack',{id:notification.id});
  return sporadic('income',3600000,()=>send('income/claim'));
 }
 case 'banking':
  if(u.cash<100000&&u.bank>0)return send('bank',{type:'withdraw',amount:Math.min(u.bank,1000000)});
  if(u.cash>1000000&&u.bank<u.cash*.25)return send('bank',{type:'deposit',amount:Math.floor(u.cash*.1)});return false;
 case 'casino':{
  const table=get('casino'),r=table?.round;
  if(r?.status==='active')return send('casino/action',{id:r.id,revision:r.revision,move:r.game==='blackjack'?(r.playerValue<16?'hit':'stand'):pick(r.choices.filter(x=>x.chance>0)).direction});
  if(r&&!r.paid)return send('casino/action',{id:r.id,revision:r.revision,move:'collect'});
  const extra=get('casino-extra'),e=extra?.round;
  if(e?.status==='active')return send('casino-extra/draw',{id:e.id,hold:e.cards.map((card,i)=>({i,rank:card%13})).filter(c=>e.cards.filter(card=>card%13===c.rank).length>=2).map(c=>c.i)});
  if(e&&!e.paid)return send('casino-extra/collect',{id:e.id});
  if(u.cash<100000)return false;const game=pick(['blackjack','higher-lower','slots','roulette','poker','safe']);
  return ['blackjack','higher-lower'].includes(game)?send('casino/start',{game,stake:1000}):send('casino-extra/play',{game,stake:1000,bet:pick(['red','black','even','odd']),code:String(random(0,100)).padStart(2,'0')});
 }
 case 'lottery':{
  const x=get('casino-extra');if(x?.prizes[0])return send('lottery/collect',{day:x.prizes[0].day});
  if(x?.lottery&&u.cash>1e6&&x.lottery.tickets<3)return send('lottery/buy',{day:x.lottery.day,quantity:1});return false;
 }
 case 'investments':{
  const accounts=get('investments')?.accounts.filter(a=>a.canManage)||[];
  for(const a of accounts){const p=a.positions.find(p=>p.matures_at<=now);if(p)return send('investments/claim',{scope:a.scope,id:p.id});}
  const limit=get('investments')?.limit||investmentLimit;const a=pick(accounts.filter(a=>a.available>1e6&&a.activePrincipal<limit)),quote=pick(a?.quotes||[]);
  return a&&quote?send('investments/open',{scope:a.scope,amount:Math.min(limit-a.activePrincipal,Math.floor(a.available*.05)),hours:quote.hours,rateBps:quote.rateBps}):false;
 }
 case 'freight':{
  const scope=manager&&random(0,2)?'family':'personal',p=get('production?scope='+scope);if(!p)return false;
  const budget=scope==='family'?family.treasury:u.cash,batch=p.batches.find(b=>b.remaining===0&&!(b.arrives_at>now));
  if(batch){const routes=(batch.destinations||[]).flatMap(d=>(d.routes||[]).map(r=>({...r,city:d.city,saleValue:r.saleValue??d.saleValue}))).filter(r=>r.cost<budget*.1&&(r.saleValue||0)*(1-r.risk)-r.cost>batch.saleValue);
   const preferred=batch.saleChoices?.best,route=preferred&&random(0,3)!==0?(preferred.mode==='local'?null:preferred):pick(routes);return route?send('production/ship',{scope,id:batch.id,city:route.city,mode:route.mode,quoteEpoch:p.quoteEpoch}):send('production/sell',{scope,id:batch.id,quoteEpoch:p.quoteEpoch});}
  if(!p.storage.capacity&&budget>45e6)return send(scope==='personal'?'assets/buy':'family/buy',scope==='personal'?{id:'production-warehouse',category:'garage'}:{id:'warehouse-production-family',quantity:1});
  const product=(random(0,3)?p.products.find(x=>x.bestChoice):null)||pick(p.products.filter(x=>!x.locked)),terms=product?.terms.filter(t=>t.cost<budget*.02)||[],term=terms.find(t=>t.hours===product?.recommendation?.hours)||pick(terms),room=p.storage.capacity-p.storage.used;
  if(product&&term&&p.batches.length<5&&room>0){const own=p.batches.filter(b=>b.drug_id===product.id).reduce((n,b)=>n+b.units,0),units=Math.min(1000-own,room,Math.max(1,Math.floor(budget*.02/term.cost)));if(units>0)return send('production/start',{scope,product:product.id,hours:term.hours,units,quoteEpoch:p.quoteEpoch});}return false;
 }
 case 'vehicles':{
  const v=get('vehicles');if(!v)return false;
  const pending=v.entries.find(e=>e.state==='pending');if(pending){const replacement=pick(v.entries.filter(e=>e.state==='stored'&&!e.auctioned));return v.used<v.capacity?send('vehicles/store',{id:pending.id}):replacement&&random(0,2)?send('vehicles/store',{id:pending.id,replaceId:replacement.id}):send('vehicles/sell',{id:pending.id});}
  const bid=v.auctions?.find(a=>a.seller_id!==id&&a.bidder_id!==id&&a.nextBid<u.cash*.01);if(bid&&v.used<v.capacity&&random(0,2))return send('vehicles/auction/bid',{id:bid.id,amount:bid.nextBid});
  const car=pick(v.entries.filter(e=>e.state==='stored'&&!e.auctioned));if(car&&random(0,3)===0&&car.listingFee<u.cash*.01&&(v.auctions?.filter(a=>a.seller_id===id).length||0)<5)return send('vehicles/auction/list',{id:car.id,reserve:Math.max(1,Math.floor(car.saleValue*.85)),hours:pick([6,12,24]),maxFee:car.listingFee});if(car){const routes=car.destinations.flatMap(d=>d.routes.map(r=>({...r,city:d.city,net:d.saleValue*(1-r.risk)-r.cost}))).filter(r=>r.cost<u.cash*.05&&r.net>car.saleValue*1.03).sort((a,b)=>b.net-a.net);
   return routes[0]?send('vehicles/ship',{id:car.id,city:routes[0].city,mode:routes[0].mode}):send('vehicles/sell',{id:car.id});}
  const cars=v.garages.garages.flatMap(g=>g.cars).concat(v.garages.unassigned);if(cars.length&&u.cash<50000)return send('vehicles/car/sell',{itemId:pick(cars).id});return false;
 }
 case 'appearance':return sporadic('appearance',7*86400000,()=>{
  const p=get('profiles/'+id);if(!p?.options)return false;const o=p.options,a=p.player.appearance;
  return send('profile/settings',{theme:pick(o.themes),emblem:pick(o.emblems),banner:pick(o.banners).id,bio:'Building my empire, one move at a time.',avatar:pick(o.avatars).id,frame:pick(o.frames),title:pick(o.titles)?.id||''});
 });
 case 'recruitment':{
  const board=get('family/dashboard');if(!family){const invite=pick(board?.invites||[]);if(invite)return send('families/join',{id:invite.family_id});const fs=get('families')?.families.filter(f=>f.members<f.capacity&&f.mode!=='invite');const f=pick(fs||[]);return f?send('families/join',{id:f.id}):false;}
  if(!manager)return false;const request=board?.family?.requests.find(r=>r.kind==='application'&&peers().some(p=>p.id===r.user_id));if(request)return send('family/respond',{userId:request.user_id,decision:board.family.members.length<board.family.capacity?'accept':'decline'});
  return sporadic('recruitment',86400000,()=>{const p=pick(peers().filter(p=>!q('SELECT 1 FROM family_members WHERE user_id=?',p.id)&&!q("SELECT 1 FROM family_recruitment WHERE user_id=? AND family_id=? AND kind='invite'",p.id,family.id)));return p&&board.family.members.length<board.family.capacity?send('family/invite',{target:p.username}):false});
 }
 case 'leadership':return sporadic('leadership',7*86400000,()=>{
  if(!family)return false;const board=get('family/dashboard')?.family,ownBots=board?.members.filter(m=>peers().some(p=>p.id===m.id))||[];
  if(manager){const recruit=pick(ownBots.filter(m=>m.nextRole&&(don||m.nextRole!=='capo')));if(recruit)return send('family/role',{userId:recruit.id,role:recruit.nextRole});
   const inactive=ownBots.find(m=>q('SELECT last_seen FROM users WHERE id=?',m.id)?.last_seen<now-30*86400000);if(inactive)return send('family/kick',{userId:inactive.id});
   const capo=pick(ownBots.filter(m=>m.family_role==='Capo'));if(don&&capo&&random(0,10)===0)return send('family/transfer-don',{userId:capo.id});
   const pref=board.preferences,o=get('family/dashboard').options;return send('family/preferences',{mode:pick(o.modes),theme:pick(o.themes),crest:pick(o.crests),motto:'Loyalty builds an empire.',banner:pick(o.covers).id,...(don&&ownBots.length===board.members.length&&board.renameCount<3&&q('SELECT treasury FROM families WHERE id=?',family.family_id||family.id)?.treasury>10000000&&random(0,100)===0?{name:board.name.replace(/ Dynasty [123]$/,'')+' Dynasty '+(board.renameCount+1)}:{})});}
  if(board&&board.members.length>2&&random(0,20)===0)return send('family/leave');return false;
 });
 case 'diplomacy':return sporadic('diplomacy',86400000,()=>{
  if(!don)return false;const d=get('family/alliances'),incoming=d?.alliances.find(a=>a.status==='pending'&&a.requested_by!==family.id);if(incoming)return send('family/alliance',{familyId:incoming.a===family.id?incoming.b:incoming.a,action:random(0,5)?'accept':'decline'});
  const active=d?.alliances.filter(a=>a.status==='accepted')||[];if(active.length>2&&random(0,10)===0){const a=pick(active);return send('family/alliance',{familyId:a.a===family.id?a.b:a.a,action:'end'});}
  const f=pick(otherFamilies().filter(f=>!d?.alliances.some(a=>[a.a,a.b].includes(f.id))&&!q("SELECT 1 FROM family_wars WHERE status='active' AND ends_at>? AND ((attacker_id=? AND defender_id=?) OR (attacker_id=? AND defender_id=?))",now,family.id,f.id,f.id,family.id)));return f?send('family/alliance',{familyId:f.id,action:'request'}):false;
 });
 case 'war':{
  if(!family||u.xp<500)return false;const view=get('family/rivals');if(!view)return false;
  const team=all("SELECT * FROM war_teams WHERE family_id=? AND status='recruiting' AND expires_at>?",family.id,now)[0];if(team){const joined=q('SELECT 1 FROM war_team_members WHERE team_id=? AND user_id=?',team.id,id),n=q('SELECT COUNT(*) n FROM war_team_members WHERE team_id=?',team.id).n;
   const supplies=get('armory?scope=family');if(joined&&(u.energy<35||supplies.ammo<50||supplies.tier<1))return send('family/war/team/leave',{teamId:team.id});
   if(!joined&&n<5)return send('family/war/team/join',{teamId:team.id});if(joined&&manager&&n>=2)return send('family/war/team/launch',{teamId:team.id});if(manager&&team.expires_at<now+60000)return send('family/war/team/cancel',{teamId:team.id});return false;}
  const w=q("SELECT * FROM family_wars WHERE status='active' AND ends_at>? AND (attacker_id=? OR defender_id=?)",now,family.id,family.id);
  if(!w){const f=pick(otherFamilies().filter(f=>!q("SELECT 1 FROM family_alliances WHERE status IN ('pending','accepted') AND a=? AND b=?",Math.min(f.id,family.id),Math.max(f.id,family.id))));return don&&f&&family.treasury>20e6?send('family/war/declare',{familyId:f.id}):false;}
  const target=w.attacker_id===family.id?w.defender_id:w.attacker_id;if(don&&family.treasury<1e6)return send('family/war/surrender');
  if(family.raid_until>now||u.energy<45)return false;const choice=random(0,4);
  if(manager&&choice===0)return send('family/war/team/create',{familyId:target});
  if(manager&&choice===1){const map=get('family/map?city='+encodeURIComponent(u.city));const plot=pick(map?.plots.filter(p=>p.owner_id===target&&p.recoveryUntil<=now&&p.protectedUntil<=now)||[]);if(plot&&map.capture?.captured<10&&map.capture.attemptUntil<=now&&map.capture.successUntil<=now)return send('family/war/capture',{familyId:target,plotId:plot.id,city:u.city});}
  return manager&&choice===2?send('family/war/sabotage',{familyId:target}):send('family/raid',{familyId:target});
 }
 case 'planning':{
  if(!family)return false;const v=get('family/plans');const plan=v?.plans.find(p=>p.status==='planned');
  if(plan){const joined=plan.members.some(m=>m.id===id);if(joined&&u.energy<35)return send('family/plans/leave',{id:plan.id});
   if(plan.scheduled_at>now&&!joined)return send('family/plans/join',{id:plan.id});
   if(manager&&plan.scheduled_at<now){const war=q("SELECT 1 FROM family_wars WHERE status='active' AND ends_at>? AND ((attacker_id=? AND defender_id=?) OR (attacker_id=? AND defender_id=?))",now,family.id,plan.target_id,plan.target_id,family.id);
    if(!war)return send('family/plans/status',{id:plan.id,status:'cancelled'});
    const path=plan.kind==='capture'?'family/war/capture':plan.kind==='sabotage'?'family/war/sabotage':plan.kind==='joint assault'?'family/war/team/create':'family/raid';
    const r=act(path,{familyId:plan.target_id,city:plan.city,plotId:plan.plot_id});if(r.status<300)act('family/plans/status',{id:plan.id,status:'completed'});return true;}
   if(manager&&plan.scheduled_at>now&&u.energy<35)return send('family/plans/save',{id:plan.id,targetId:plan.target_id,kind:plan.kind,city:plan.city,plotId:plan.plot_id,scheduledAt:now+3600000,notes:'Rescheduled to replenish supplies.'});return false;}
  return manager?sporadic('planning',86400000,()=>{const target=pick(otherFamilies().filter(f=>!q("SELECT 1 FROM family_alliances WHERE status='accepted' AND a=? AND b=?",Math.min(f.id,family.id),Math.max(f.id,family.id))));return target?send('family/plans/save',{targetId:target.id,kind:pick(['raid','sabotage','joint assault']),city:u.city,scheduledAt:now+1800000,notes:'Gather supplies and volunteer before the planned operation.'}):false}):false;
 }
 case 'bounties':{
  const b=get('bounties');if(b?.pending)return send('bounties/collect');
  const target=pick(peers().filter(p=>p.xp>=500&&p.prison_until<=now&&p.hospital_until<=now&&!q('SELECT 1 FROM family_members a JOIN family_members b ON a.family_id=b.family_id WHERE a.user_id=? AND b.user_id=?',id,p.id)));
  const bounty=b?.bounties.find(b=>b.targetId===target?.id),ammo=get('armory');if(bounty&&ammo?.tier>=3&&ammo.ammo>=60&&u.energy>=40)return send('pvp',{target:target.username,kind:'liquidate',rounds:Math.min(10000,Math.max(60,Math.floor(ammo.ammo*.05))),anonymous:u.cash>50e6&&!!random(0,2)});
  return u.xp>=500&&u.cash>50e6&&target?sporadic('bounty-post',7*86400000,()=>send('bounties/post',{target:target.username,amount:Math.floor(u.cash*.005)})):false;
 }
 case 'care':{
  const v=get('custody'),stay=pick(v?.stays.filter(s=>peers().some(p=>p.id===s.user_id))||[]);if(stay){const same=family&&q('SELECT 1 FROM family_members WHERE family_id=? AND user_id=?',family.id,stay.user_id),scope=manager&&same?'family':'personal',funds=scope==='family'?family.treasury:u.cash;
   if(stay.cost<funds*.02)return send('custody/pay',{id:stay.id,source:scope==='family'?'family':'personal',maxCost:stay.cost});
   if(stay.kind==='prison'&&u.energy>=40&&funds>40e6)return send('custody/breakout',{id:stay.id,scope});}
  return sporadic('justice',86400000,()=>{const target=pick(peers().filter(p=>p.xp>=500&&p.prison_until<=now&&p.hospital_until<=now&&p.justice_protected_until<=now&&(!family||!q('SELECT 1 FROM family_members WHERE family_id=? AND user_id=?',family.id,p.id))));return u.xp>=500&&u.cash>25e6&&target?send('custody/report',{target:target.username,hours:1,anonymous:!!random(0,2)}):false});
 }
 case 'transfers':return sporadic('transfer',86400000,()=>{const p=pick(peers().filter(p=>family&&q('SELECT 1 FROM family_members WHERE family_id=? AND user_id=?',family.id,p.id)));if(!p)return false;if(u.energy>80&&p.energy<40)return send('transfers',{recipient:p.username,kind:'energy',amount:10});if(u.cash>2e6&&p.cash<u.cash*.05)return send('transfers',{recipient:p.username,kind:'cash',amount:Math.floor(u.cash*.001)});return false});
 case 'security':{
  const a=get('armory'),rounds=Math.min(10000,Math.floor((a?.ammo||0)*.05));if(a?.tier>=3&&rounds!==(u.backfire_rounds||0))return send('player/backfire',{rounds});
  if(u.cash>1e6&&u.protected_until<=now&&u.heat>50)return send('protection');
  if(u.muscle_until<=now&&u.cash>10e6){const pack=pick(musclePackages.filter(p=>p.price<u.cash*.02));if(pack)return send('security/muscle',{package:pack.id});}
  if(manager&&family.guard_until<=now&&family.treasury>10e6)return send('family/guards');return false;
 }
 case 'communication':return sporadic('social',86400000,()=>{
  const inbox=get('inbox'),thread=inbox?.threads.find(t=>t.unread);if(thread){get('conversation?id='+thread.peer.id);act('conversation/read',{peerId:thread.peer.id,lastId:thread.last.id});return send('messages',{recipient:thread.peer.username,message:peers().some(p=>p.id===thread.peer.id)?'Supplies first, then we make our next move.':'I am an automated game character. You can invite me to team missions or interact through my profile.'});}
  const p=pick(peers());return p?send('messages',{recipient:p.username,message:'Ready to build an empire? Check the team mission board.'}):false;
 });
 case 'community':{
  const support=get('support'),unread=support?.tickets.find(t=>t.player_unread);if(unread){const ticket=get('support/ticket?id='+unread.id);if(ticket?.replies.at(-1)?.author_id!==id&&ticket.ticket.status!=='closed')return send('support/reply',{id:unread.id,body:'Thank you. This automated character will continue using the normal player actions; the original report contains the failing route.'});return true;}
  const noisy=get('inbox')?.threads.find(t=>t.unread>10&&peers().some(p=>p.id===t.peer.id));if(noisy)return sporadic('controls',86400000,()=>send('player-controls',{target:noisy.peer.username,blocked:noisy.unread>30,muted:true}));
  const control=pick(support?.controls.filter(c=>c.blocked||c.muted)||[]);if(control)return sporadic('controls',86400000,()=>send('player-controls',{target:control.username,blocked:false,muted:false}));
  // A real persisted internal error can be reported, never an invented player accusation.
  const error=q("SELECT path FROM bot_action_stats WHERE user_id=? AND last_status>=500 AND path NOT LIKE 'support/%' ORDER BY last_at DESC LIMIT 1",id);if(error&&!q("SELECT 1 FROM support_tickets WHERE category='bug' AND subject=? AND created_at>?",('Bot server error: '+error.path).slice(0,100),now-7*86400000))return sporadic('bug-report',7*86400000,()=>send('support/create',{category:'bug',subject:('Bot server error: '+error.path).slice(0,100),body:'A normal player action returned a server error at '+error.path+'. Please review the server logs.',target:''}));return false;
 }
 case 'travel':{
  const a=get('airport');if(!a?.hasJet||a.cooldown>now)return false;const destinations=a.destinations.filter(d=>d.city!==u.city&&d.cost<u.cash*.02);const d=u.heat>=50?destinations.sort((a,b)=>a.heat-b.heat)[0]:pick(destinations);return d?send('airport/fly',{city:d.city}):false;
 }
 case 'exploration':{
  const page=pick(['directory','underworld','seasons','statistics','player/progress','bulletins','shop','family/respect','world-chat','guide?q=best%20next%20move']);return !!get(page);
 }
 default:return false;
 }
}
