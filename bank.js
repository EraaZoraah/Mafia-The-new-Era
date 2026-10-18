import {MAX_CASH} from './money.js';
// One atomic wallet move, shared by HTTP players and autonomous players.
export function bankMove(db,id,{amount,type},log){
 if(!Number.isSafeInteger(amount)||amount<=0||!['deposit','withdraw'].includes(type))throw Object.assign(Error('Invalid transaction'),{status:400});
 const deposit=type==='deposit',r=db.prepare(deposit?'UPDATE users SET cash=cash-?,bank=bank+? WHERE id=? AND cash>=? AND bank+?<=?':'UPDATE users SET bank=bank-?,cash=cash+? WHERE id=? AND bank>=? AND cash+?<=?').run(amount,amount,id,amount,amount,MAX_CASH);
 if(!r.changes)throw Object.assign(Error('Insufficient funds'),{status:400});
 log(id,`${deposit?'Deposited':'Withdrawn'}: $${amount}`);return {ok:true};
}
