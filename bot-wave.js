import {randomBytes,randomInt} from 'node:crypto';
import {hashPasswordSync} from './auth-security.js';
import {installBotSchema} from './bot-players.js';
export const waveKey='additional-mafia-50-2026-10-16';
export function addBotWave(db,{clock=Date.now,random=randomInt,hash=hashPasswordSync}={}){
 installBotSchema(db);const q=(s,...a)=>db.prepare(s).get(...a),run=(s,...a)=>db.prepare(s).run(...a);
 if(q('SELECT 1 FROM bot_meta WHERE key=?',waveKey))return {added:[],alreadyApplied:true};
 if(!q("SELECT 1 FROM users WHERE role='owner'"))throw Error('An Owner account is required before adding the bot wave.');
 const first=['Adriano','Brando','Cesare','Dario','Ettore','Fabrizio','Gabriele','Leandro','Massimo','Nicolò','Orlando','Raffaele','Tommaso','Vittorio','Valerio','Alessandra','Bianca','Carlotta','Daniela','Eleonora','Fiorella','Ginevra','Ludovica','Marcella','Violetta'];
 // Use ASCII account names, matching the existing bot profile-validation rules.
 first[first.indexOf('Nicolò')]='Nicolo';
 const last=['Sorrentino','Castellano','Carbone','Dangelo','Esposito','Giordano','Montanari','Palmieri','Testa','Vescovi','Orsini','Pellegrini','Amato','DeSantis','Ferretti'];
 const now=clock(),added=[];db.exec('BEGIN IMMEDIATE');
 try{for(let n=0;n<first.length*last.length&&added.length<50;n++){
  const username=first[n%first.length]+' '+last[(Math.floor(n/first.length)+n*7)%last.length];if(q('SELECT 1 FROM users WHERE username=?',username))continue;
  const secret=randomBytes(48).toString('hex'),email='bot-wave-'+randomBytes(12).toString('hex')+'@mafia.invalid';
  const id=Number(run("INSERT INTO users(username,email,password,role,cash,bank,xp,energy,health,city,created_at,energy_at,health_at) VALUES(?,?,?,'player',5000,0,0,100,100,'New York',?,?,?)",username,email,hash(secret),now,now,now).lastInsertRowid);
  const personality=['builder','leader','trader','enforcer','gambler'][added.length%5],activity=[40,65,90,120,150][random(0,5)];
  run('INSERT INTO bot_players(user_id,personality,next_at,activity) VALUES(?,?,?,?)',id,personality,now+random(0,8*3600000),activity);added.push({id,username,personality,activity});
 }if(added.length!==50)throw Error('Could not allocate fifty unique names.');run('INSERT INTO bot_meta VALUES(?,?)',waveKey,JSON.stringify(added));db.exec('COMMIT');return {added,alreadyApplied:false};
 }catch(e){db.exec('ROLLBACK');throw e}
}

