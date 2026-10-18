import {familyAssets,career} from './empire-catalog.js';
import {MAX_CASH} from './money.js';

export function familyHourlyIncome(db,id){
 const q=(s,...v)=>db.prepare(s).get(...v);
  const family=q('SELECT drugs_xp,guns_xp FROM families WHERE id=?',id);if(!family)return 0;
  const base=db.prepare('SELECT item_id,quantity FROM family_assets WHERE family_id=?').all(id).reduce((sum,a)=>sum+(familyAssets.find(x=>x.id===a.item_id)?.income||0)*a.quantity,0);
  const level=Math.max(career('drugs',family.drugs_xp).level,career('guns',family.guns_xp).level);
  return Math.floor(base*(1+(level-1)*.05));
}

export function installTerritoryIncome(db,{clock,transaction}){
 db.exec('CREATE TABLE IF NOT EXISTS family_income_clock(family_id INTEGER PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,updated_at INTEGER NOT NULL,remainder INTEGER NOT NULL DEFAULT 0)');
 const q=(s,...v)=>db.prepare(s).get(...v),run=(s,...v)=>db.prepare(s).run(...v);
 const hourly=id=>familyHourlyIncome(db,id);
 function settle(){return transaction(()=>{
  const now=clock();
  for(const f of db.prepare('SELECT id,treasury FROM families').all()){
   const last=q('SELECT * FROM family_income_clock WHERE family_id=?',f.id);
   if(!last){run('INSERT INTO family_income_clock VALUES(?,?,0)',f.id,now);continue}
   const elapsed=Math.max(0,Math.min(86400000,now-last.updated_at));
   const units=BigInt(hourly(f.id))*BigInt(elapsed)+BigInt(last.remainder);
   const amount=Math.min(MAX_CASH-f.treasury,Number(units/3600000n));
   if(amount>0)run('UPDATE families SET treasury=treasury+? WHERE id=?',amount,f.id);
   run('UPDATE family_income_clock SET updated_at=?,remainder=? WHERE family_id=?',now,Number(units%3600000n),f.id);
  }
 })}
 settle();return {settle,hourly};
}
