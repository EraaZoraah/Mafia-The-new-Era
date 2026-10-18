import {scrypt, scryptSync, randomBytes, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt),options={N:65536,r:8,p:2,maxmem:96*1024*1024};
export const validPassword=p=>typeof p==='string'&&p.length>=15&&p.length<=128;
export function hashPasswordSync(p){const salt=randomBytes(16).toString('hex');return 'v2:'+salt+':'+scryptSync(p,salt,64,options).toString('hex')}
export async function hashPassword(p){const salt=randomBytes(16).toString('hex');return 'v2:'+salt+':'+(await derive(p,salt,64,options)).toString('hex')}
const dummy='v2:'+'0'.repeat(32)+':'+'0'.repeat(128);
export async function verifyPassword(p,stored){
 const valid=typeof stored==='string'&&/^(?:v2:)?[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored);
 const parts=(valid?stored:dummy).split(':'),modern=parts.length===3,salt=parts[modern?1:0],expected=parts[modern?2:1];
 const bounded=typeof p==='string'&&p.length<=128,actual=await derive(bounded?p:'invalid',salt,64,modern?options:{});
 return valid&&bounded&&timingSafeEqual(actual,Buffer.from(expected,'hex'));
}
export function installAuthSecurity(db,{clock=Date.now}={}){
 db.exec(`CREATE TABLE IF NOT EXISTS auth_limits(key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS security_log(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),event TEXT NOT NULL,network_hash TEXT NOT NULL,created_at INTEGER NOT NULL);`);
 let active=0;
 const hash=s=>createHash('sha256').update(s).digest('hex');
 const network=req=>hash(req.socket.remoteAddress||'unknown'); // Never trust client-supplied forwarding headers.
 function consume(key,max,window){const time=clock();db.prepare('DELETE FROM auth_limits WHERE expires<=?').run(time);const row=db.prepare('SELECT * FROM auth_limits WHERE key=?').get(key);if(row&&row.attempts>=max)return Math.ceil((row.expires-time)/1000);db.prepare('INSERT INTO auth_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').run(key,time+window);return 0}
 function limit(req,kind,identity){let wait=consume(kind+':ip:'+network(req),kind==='register'?10:50,kind==='register'?3600000:900000);if(!wait&&kind==='login')wait=consume('login:identity:'+hash(identity),10,900000);return wait}
 const record=(req,event,id=null)=>db.prepare('INSERT INTO security_log(user_id,event,network_hash,created_at) VALUES(?,?,?,?)').run(id,event,network(req),clock());
 async function work(fn){if(active>=2)throw Object.assign(Error('Sign-in service is busy. Please try again shortly.'),{status:429});active++;try{return await fn()}finally{active--}}
 return {limit,record,work,clear:identity=>db.prepare('DELETE FROM auth_limits WHERE key=?').run('login:identity:'+hash(identity))};
}
