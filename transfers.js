import {MAX_CASH} from './money.js';
// Atomic, idempotent gifts between existing player accounts.
export function installTransfers(db,{transaction,settleRaw,benefits,log,fail,notify}){
 const q=(sql,...a)=>db.prepare(sql).get(...a),run=(sql,...a)=>db.prepare(sql).run(...a),all=(sql,...a)=>db.prepare(sql).all(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS player_transfers(id INTEGER PRIMARY KEY,sender_id INTEGER NOT NULL REFERENCES users(id),recipient_id INTEGER NOT NULL REFERENCES users(id),recipient_name TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('cash','energy')),amount INTEGER NOT NULL CHECK(amount>0),request_key TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(sender_id,request_key));CREATE INDEX IF NOT EXISTS transfers_recipient ON player_transfers(recipient_id,id);`);
 function route(method,path,body,user){
  if(path!=='/api/transfers')return null;
  if(method==='GET')return {history:all('SELECT t.id,t.sender_id,t.recipient_id,t.kind,t.amount,t.created_at,s.username sender,r.username recipient FROM player_transfers t JOIN users s ON s.id=t.sender_id JOIN users r ON r.id=t.recipient_id WHERE t.sender_id=? OR t.recipient_id=? ORDER BY t.id DESC LIMIT 30',user.id,user.id)};
  if(method!=='POST')fail('Method not allowed',405);
  if(!['cash','energy'].includes(body.kind)||!Number.isSafeInteger(body.amount)||body.amount<1||body.amount>(body.kind==='energy'?1000:MAX_CASH)||typeof body.recipient!=='string'||! /^[a-zA-Z0-9_][a-zA-Z0-9_ ]{2,23}$/.test(body.recipient)||typeof body.requestKey!=='string'||! /^[a-zA-Z0-9_-]{16,80}$/.test(body.requestKey))fail('Choose a player, transfer type and positive whole amount.');
  return transaction(()=>{
   const prior=q('SELECT * FROM player_transfers WHERE sender_id=? AND request_key=?',user.id,body.requestKey);
   if(prior){if(prior.kind!==body.kind||prior.amount!==body.amount||prior.recipient_name!==body.recipient)fail('This transfer reference has already been used.',409);return {ok:true,id:prior.id,duplicate:true};}
   const target=q('SELECT id FROM users WHERE username=? AND banned=0',body.recipient);if(!target||target.id===user.id)fail('Choose another active player.');
   const now=Date.now(),sender=settleRaw(user.id,now),recipient=settleRaw(target.id,now),field=body.kind;
   const senderCap=field==='energy'?benefits(sender.id).energyMax:MAX_CASH,recipientCap=field==='energy'?benefits(recipient.id).energyMax:MAX_CASH;
   if(sender[field]<body.amount)fail('Not enough '+(field==='cash'?'cash':'energy')+'.',409);
   if(recipient[field]+body.amount>recipientCap)fail('The recipient can receive at most '+(recipientCap-recipient[field])+' more '+(field==='cash'?'cash':'energy')+'.',409);
   run('UPDATE users SET '+field+'='+field+'-? WHERE id=?',body.amount,sender.id);
   run('UPDATE users SET '+field+'='+field+'+? WHERE id=?',body.amount,recipient.id);
   // A full reserve has no stored regeneration time. Partial reserves keep their fractional tick.
   if(field==='energy'){if(sender.energy>=senderCap)run('UPDATE users SET energy_at=? WHERE id=?',now,sender.id);if(recipient.energy+body.amount===recipientCap)run('UPDATE users SET energy_at=? WHERE id=?',now,recipient.id);}
   const id=Number(run('INSERT INTO player_transfers(sender_id,recipient_id,recipient_name,kind,amount,request_key,created_at) VALUES(?,?,?,?,?,?,?)',sender.id,recipient.id,body.recipient,field,body.amount,body.requestKey,now).lastInsertRowid);
   const amount=field==='cash'?'$'+body.amount:body.amount+' energy';log(sender.id,'Sent '+amount+' to '+recipient.username+'.');log(recipient.id,'Received '+amount+' from '+sender.username+'.');notify(recipient.id,'Transfer received','Received '+amount+' from '+sender.username+'.','/images/scene-bank.jpg');return {ok:true,id,duplicate:false};
  });
 }
 return {route};
}
