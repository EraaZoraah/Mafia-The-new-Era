import {MAX_CASH} from './money.js';
export function handValue(cards){let value=cards.reduce((n,c)=>n+(c%13===0?11:Math.min(c%13+1,10)),0),aces=cards.filter(c=>c%13===0).length;while(value>21&&aces-->0)value-=10;return value;}
const MAX=MAX_CASH,MIN_BET=1000,MAX_BET=1000000;
export function installCasino(db,{supporterBonus=()=>1,transaction,clock,fail,settleRaw,available,draw,log}){
 const q=(s,...v)=>db.prepare(s).get(...v),all=(s,...v)=>db.prepare(s).all(...v),run=(s,...v)=>db.prepare(s).run(...v);
 db.exec(`CREATE TABLE IF NOT EXISTS casino_rounds(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),game TEXT NOT NULL,stake INTEGER NOT NULL,state TEXT NOT NULL,status TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,payout INTEGER NOT NULL DEFAULT 0,paid INTEGER NOT NULL DEFAULT 0,outcome TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS casino_one_open ON casino_rounds(user_id) WHERE status='active' OR paid=0;
 CREATE TABLE IF NOT EXISTS casino_requests(user_id INTEGER REFERENCES users(id),request_key TEXT NOT NULL,payload TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(user_id,request_key));`);
 const choices=rank=>['higher','lower'].map(direction=>{const count=direction==='higher'?13-rank:rank-1;return {direction,chance:count/13,multiplier:count?12.48/count:0};});
 function view(r){if(!r)return null;const s=JSON.parse(r.state),active=r.status==='active';return {id:r.id,game:r.game,stake:r.stake,status:r.status,revision:r.revision,payout:r.payout,paid:!!r.paid,outcome:r.outcome,createdAt:r.created_at,...(r.game==='higher-lower'?{rank:s.rank,nextRank:s.nextRank??null,choices:choices(s.rank).map(c=>({...c,payout:Math.floor(r.stake*c.multiplier)}))}:{player:s.player,playerValue:handValue(s.player),dealer:active?[s.dealer[0],null]:s.dealer,dealerValue:active?null:handValue(s.dealer)})};}
 function credit(r){if(r.paid)return true;const u=q('SELECT cash FROM users WHERE id=?',r.user_id);if(u.cash+r.payout>MAX)return false;run('UPDATE users SET cash=cash+? WHERE id=?',r.payout,r.user_id);run('UPDATE casino_rounds SET paid=1 WHERE id=?',r.id);return true;}
 function finish(r,s,outcome,payout){payout+=Math.floor(Math.max(0,payout-r.stake)*(supporterBonus(r.user_id)-1));run("UPDATE casino_rounds SET state=?,status='finished',outcome=?,payout=?,revision=revision+1 WHERE id=?",JSON.stringify(s),outcome,payout,r.id);credit({...r,payout});log(r.user_id,'Casino '+r.game+': '+outcome+'. Stake $'+r.stake+'; total return $'+payout+'.');}
 function natural(r,s){const p=handValue(s.player)===21,d=handValue(s.dealer)===21;if(p||d){finish(r,s,p&&d?'Push':p?'Blackjack':'Dealer blackjack',p&&d?r.stake:p?Math.floor(r.stake*2.5):0);return true;}return false;}
 function action(user,path,b){return transaction(()=>{
  if(typeof b.requestKey!=='string'||!/^[a-zA-Z0-9_-]{12,80}$/.test(b.requestKey))fail('A valid request key is required.');
  const payload=JSON.stringify({path,game:b.game,stake:b.stake,id:b.id,revision:b.revision,move:b.move}),old=q('SELECT * FROM casino_requests WHERE user_id=? AND request_key=?',user.id,b.requestKey);if(old){if(old.payload!==payload)fail('Request key already used for another action.',409);return JSON.parse(old.result);}
  const u=settleRaw(user.id);available(u);let id;
  if(path==='/api/casino/start'){
   if(!['blackjack','higher-lower'].includes(b.game)||!Number.isSafeInteger(b.stake)||b.stake<MIN_BET||b.stake>MAX_BET)fail('Choose a game and a whole stake between $1,000 and $1,000,000.');
   if(q("SELECT 1 FROM casino_rounds WHERE user_id=? AND (status='active' OR paid=0)",user.id))fail('Finish your current round and collect its return first.',409);
   if(q('SELECT 1 FROM casino_rounds WHERE user_id=? AND created_at>?',user.id,clock()-2000))fail('Wait two seconds between new rounds.',429);
   if(u.cash<b.stake)fail('Insufficient cash.');let s;
   if(b.game==='blackjack'){const deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=draw(0,i);[deck[i],deck[j]]=[deck[j],deck[i]];}s={player:[deck.pop(),deck.pop()],dealer:[deck.pop(),deck.pop()],deck};}
   else s={rank:draw(1,13)};
   run('UPDATE users SET cash=cash-? WHERE id=?',b.stake,user.id);id=Number(run("INSERT INTO casino_rounds(user_id,game,stake,state,status,created_at) VALUES(?,?,?,?,'active',?)",user.id,b.game,b.stake,JSON.stringify(s),clock()).lastInsertRowid);
   if(b.game==='blackjack')natural(q('SELECT * FROM casino_rounds WHERE id=?',id),s);
  }else{
   if(!Number.isSafeInteger(b.id)||!Number.isSafeInteger(b.revision))fail('Invalid round.');const r=q('SELECT * FROM casino_rounds WHERE id=? AND user_id=?',b.id,user.id);if(!r)fail('Round not found.',404);if(b.revision!==r.revision)fail('This round has changed. Refresh the table.',409);id=r.id;
   if(b.move==='collect'){if(r.status!=='finished'||r.paid)fail('No unclaimed return.',409);if(!credit(r))fail('Make room in your cash wallet for the full return.',409);}
   else {if(r.status!=='active')fail('Round already finished.',409);const s=JSON.parse(r.state);
    if(r.game==='higher-lower'){const choice=choices(s.rank).find(c=>c.direction===b.move);if(!choice||!choice.chance)fail('Choose a possible higher or lower outcome.');s.nextRank=draw(1,13);const win=b.move==='higher'?s.nextRank>s.rank:s.nextRank<s.rank;finish(r,s,win?'Correct prediction':s.nextRank===s.rank?'Tie — house wins':'Incorrect prediction',win?Math.floor(r.stake*choice.multiplier):0);}
    else {if(!['hit','stand'].includes(b.move))fail('Choose hit or stand.');if(b.move==='hit')s.player.push(s.deck.pop());const p=handValue(s.player);if(p>21)finish(r,s,'Bust',0);else if(b.move==='stand'||p===21){while(handValue(s.dealer)<17)s.dealer.push(s.deck.pop());const d=handValue(s.dealer);finish(r,s,d>21?'Dealer bust':p>d?'You win':p===d?'Push':'Dealer wins',d>21||p>d?r.stake*2:p===d?r.stake:0);}else run('UPDATE casino_rounds SET state=?,revision=revision+1 WHERE id=?',JSON.stringify(s),id);}
   }
  }
  const round=view(q('SELECT * FROM casino_rounds WHERE id=?',id)),result={round,message:round.status==='finished'?round.outcome+'. Total return: $'+round.payout.toLocaleString('en-US')+(round.paid?'.':' — waiting for wallet space.'):'Your move.',image:'/images/casino-interior.png'};
  run('INSERT INTO casino_requests VALUES(?,?,?,?)',user.id,b.requestKey,payload,JSON.stringify(result));return result;
 });}
 function route(req,path,b,u){if(path==='/api/casino'&&req.method==='GET')return {minBet:MIN_BET,maxBet:MAX_BET,round:view(q("SELECT * FROM casino_rounds WHERE user_id=? ORDER BY CASE WHEN status='active' OR paid=0 THEN 0 ELSE 1 END,id DESC LIMIT 1",u.id)),history:all("SELECT id,game,stake,payout,outcome,paid,created_at FROM casino_rounds WHERE user_id=? AND status='finished' ORDER BY id DESC LIMIT 10",u.id)};if(req.method==='POST'&&['/api/casino/start','/api/casino/action'].includes(path))return action(u,path,b);return null;}
 return {route};
}
