"""Read-only receipt coverage audit. Does not install or migrate game code."""
from pathlib import Path
import sqlite3,json
root=Path(__file__).resolve().parent.parent
db=sqlite3.connect((root/'data/mafia.sqlite').as_uri()+'?mode=ro',uri=True)
db.execute('PRAGMA query_only=ON')
for user_id,name in db.execute("SELECT id,username FROM users WHERE role='owner'"):
 rows=db.execute('SELECT payload,result FROM logistics_requests WHERE actor_id=? ORDER BY rowid DESC',(user_id,)).fetchall()
 count,total,recoverable=0,0,0;used={}
 for payload,result in rows:
  b,r=json.loads(payload),json.loads(result)
  if b.get('path')=='/api/armory/buy' and b.get('scope','personal')=='personal' and b.get('kind')=='weapon':
   count+=1;total+=r.get('cost',0)
   held=db.execute("SELECT quantity FROM armory_weapons WHERE scope='personal' AND owner_id=? AND weapon_id=?",(user_id,b.get('item'))).fetchone()
   quantity=r.get('quantity',0);n=used.get(b.get('item'),0)
   if held and quantity>0 and n+quantity<=held[0]:recoverable+=r.get('cost',0);used[b.get('item')]=n+quantity
 print(json.dumps(dict(username=name,personalWeaponReceipts=count,documentedPaid=total,recoverableForCurrentHoldings=recoverable)))
db.close()
