import {createECDH,ECDH} from 'node:crypto';
const services=['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns.windows.com','notify.windows.com'];
export function validPushSubscription(s){try{const u=new URL(s.endpoint);const point=Buffer.from(s.keys?.p256dh||'','base64url');if(point.length!==65||point[0]!==4)return false;ECDH.convertKey(point,'prime256v1');return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&services.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))&&typeof s.keys?.p256dh==='string'&&/^[\w-]{86,88}$/.test(s.keys.p256dh)&&typeof s.keys?.auth==='string'&&/^[\w-]{22,24}$/.test(s.keys.auth)&&s.endpoint.length<2048}catch{return false}}
export function installPush(db,{clock=Date.now,blockedMillis=()=>0,earnsIncome=()=>true,send,env=process.env}={}){
 const q=(s,...a)=>db.prepare(s).get(...a),all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec(`CREATE TABLE IF NOT EXISTS push_devices(endpoint TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),subscription TEXT NOT NULL,personal INTEGER NOT NULL,family INTEGER NOT NULL,income INTEGER NOT NULL,locale TEXT NOT NULL,created_at INTEGER NOT NULL,income_stamp INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS push_queue(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),kind TEXT NOT NULL,created_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);`);
 const ready=!!(send||(env.PUSH_ENABLED==='true'&&env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY&&/^mailto:|^https:\/\//.test(env.VAPID_SUBJECT||'')));
 function notice(id,title,_message,image){let kind;if(['You were attacked','An attack was repelled','Critical condition — coma','Backfire resolved'].includes(title))kind='personal';else if(image==='/images/scene-families.jpg'&&/raid|attack|war declared|enemy war operation|territory|sabotage|assault/i.test(title))kind='family';if(kind&&q('SELECT 1 FROM push_devices WHERE user_id=? AND '+kind+'=1',id))run('INSERT INTO push_queue(user_id,kind,created_at) VALUES(?,?,?)',id,kind,clock())}
 function route(method,path,body,u){if(!path.startsWith('/api/push'))return null;
  if(method==='GET'&&path==='/api/push')return {ready,publicKey:ready?env.VAPID_PUBLIC_KEY:null};
  if(method!=='POST')throw new Error('Method not allowed.');
  if(!validPushSubscription(body.subscription))throw new Error('Invalid push subscription.');const endpoint=body.subscription.endpoint,owner=q('SELECT user_id FROM push_devices WHERE endpoint=?',endpoint);
  if(owner&&owner.user_id!==u.id)throw new Error('Disable notifications for the previous account on this device first.');
  if(path==='/api/push/remove'){run('DELETE FROM push_devices WHERE endpoint=? AND user_id=?',endpoint,u.id);return {ok:true}}
  if(path!=='/api/push/save')throw new Error('Unknown push action.');
  if(!ready)throw new Error('Push notifications are not configured on this server.');
  if(!owner&&q('SELECT COUNT(*) n FROM push_devices WHERE user_id=?',u.id).n>=5)throw new Error('Maximum five notification devices per account.');
  const p=body.preferences;if(!p||!['personal','family','income'].every(k=>typeof p[k]==='boolean'))throw new Error('Choose notification preferences.');
  run(`INSERT INTO push_devices(endpoint,user_id,subscription,personal,family,income,locale,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET subscription=excluded.subscription,personal=excluded.personal,family=excluded.family,income=excluded.income,locale=excluded.locale`,endpoint,u.id,JSON.stringify({endpoint,keys:body.subscription.keys}),+p.personal,+p.family,+p.income,body.locale==='nl'?'nl':'en',clock());return {ok:true};
 }
 let busy=false;
 async function deliver(device,kind){const nl=device.locale==='nl',copy={personal:nl?'Er is een aanval op je speler gemeld. Bekijk je status.':'An attack on your player was reported. Check your status.',family:nl?'Er is vijandige activiteit tegen je familie gemeld.':'Hostile activity involving your family was reported.',income:nl?'Je passieve inkomen zit bijna aan de limiet van 24 uur.':'Your passive income is approaching its 24-hour limit.'};const payload=JSON.stringify({title:'Mafia: The New Era',body:copy[kind],url:kind==='family'?'/#families':'/#dashboard',tag:'mafia-'+kind});
  try{if(send)await send(JSON.parse(device.subscription),payload);else{const {default:webpush}=await import('web-push');await webpush.sendNotification(JSON.parse(device.subscription),payload,{TTL:3600,timeout:10000,vapidDetails:{subject:env.VAPID_SUBJECT,publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY}})}return true}catch(e){if([404,410].includes(e.statusCode))run('DELETE FROM push_devices WHERE endpoint=?',device.endpoint);return false}
 }
 async function tick(){if(!ready||busy)return;busy=true;try{
  run('DELETE FROM push_queue WHERE created_at<? OR attempts>=3',clock()-3600000);
  for(const n of all('SELECT * FROM push_queue ORDER BY id LIMIT 50')){const devices=all('SELECT d.* FROM push_devices d JOIN users u ON u.id=d.user_id WHERE d.user_id=? AND u.banned=0 AND d.'+n.kind+'=1',n.user_id);let ok=true;for(const d of devices)if(!await deliver(d,n.kind))ok=false;if(ok)run('DELETE FROM push_queue WHERE id=?',n.id);else run('UPDATE push_queue SET attempts=attempts+1 WHERE id=?',n.id)}
  for(const d of all('SELECT d.*,u.income_claim_at,u.prison_until,u.hospital_until FROM push_devices d JOIN users u ON u.id=d.user_id WHERE d.income=1 AND u.banned=0 AND u.income_claim_at>0 AND d.income_stamp<>u.income_claim_at')){
   if(d.prison_until>clock()||d.hospital_until>clock())continue;
   if(!earnsIncome(d.user_id))continue;
   const elapsed=clock()-d.income_claim_at-blockedMillis(d.user_id,d.income_claim_at,clock());if(elapsed>=23*3600000&&await deliver(d,'income'))run('UPDATE push_devices SET income_stamp=? WHERE endpoint=?',d.income_claim_at,d.endpoint);
  }
 }finally{busy=false}}
 return {route,notice,tick,ready};
}
export function generatePushKeys(){const key=createECDH('prime256v1');key.generateKeys();return {publicKey:key.getPublicKey().toString('base64url'),privateKey:key.getPrivateKey().toString('base64url')}}
