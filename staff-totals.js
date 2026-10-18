// Staff balances are reported separately from the playable world economy.
export function splitStaffTotals(rows){
 const summarize=list=>({count:list.length,cash:list.reduce((n,p)=>n+BigInt(p.cash),0n).toString(),bank:list.reduce((n,p)=>n+BigInt(p.bank),0n).toString(),xp:list.reduce((n,p)=>n+BigInt(p.xp),0n).toString()});
 return {owner:summarize(rows.filter(p=>p.role==='owner')),admin:summarize(rows.filter(p=>p.role==='admin')),combined:summarize(rows.filter(p=>['owner','admin'].includes(p.role)))};
}
