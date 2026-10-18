"""Prepare the explicitly authorized private starter snapshot; never modify live data."""
from pathlib import Path
import sqlite3,json,os
root=Path(__file__).resolve().parent.parent
source=(root/'data'/'mafia.sqlite').resolve()
target=(root/'starter-data'/'mafia.sqlite').resolve()
assert source.parent==root/'data' and target.parent==root/'starter-data'
target.parent.mkdir(exist_ok=True)
temporary=target.with_name('mafia-next.sqlite')
src=sqlite3.connect(source.as_uri()+'?mode=ro',uri=True)
dst=sqlite3.connect(temporary)
src.backup(dst)
tables={r[0] for r in dst.execute("SELECT name FROM sqlite_master WHERE type='table'")}
removed=[]
for table in ['sessions','auth_limits','security_log','push_devices','push_queue']:
 if table in tables:
  dst.execute('DELETE FROM "'+table+'"');removed.append(table)
if 'settings' in tables:
 for key, in dst.execute('SELECT key FROM settings').fetchall():
  if any(word in key.lower() for word in ['secret','token','password','vapid','smtp','paypal','salt']):dst.execute('DELETE FROM settings WHERE key=?',(key,))
dst.commit()
assert dst.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert not dst.execute('PRAGMA foreign_key_check').fetchall()
counts={role:count for role,count in dst.execute('SELECT role,COUNT(*) FROM users GROUP BY role')}
bots=dst.execute('SELECT COUNT(*) FROM bot_players').fetchone()[0] if 'bot_players' in tables else 0
assert counts.get('owner',0)>=1
assert 'sessions' not in tables or dst.execute('SELECT COUNT(*) FROM sessions').fetchone()[0]==0
dst.execute('VACUUM');dst.close();src.close()
os.replace(temporary,target)
print(json.dumps({'snapshot':str(target.relative_to(root)),'roles':counts,'bots':bots,'cleared':removed,'integrity':'ok','liveDatabaseModified':False}))
