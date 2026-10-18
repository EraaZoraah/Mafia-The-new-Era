import {DatabaseSync} from 'node:sqlite';
import {installGame} from '../../game.js';
export function fixture(t,equipped=true){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,password TEXT,role TEXT DEFAULT 'player',cash INTEGER DEFAULT 10000000000,bank INTEGER DEFAULT 0,xp INTEGER DEFAULT 1000,energy INTEGER DEFAULT 100,health INTEGER DEFAULT 100,heat INTEGER DEFAULT 0,city TEXT DEFAULT 'Test',banned INTEGER DEFAULT 0,created_at INTEGER DEFAULT 0);
 CREATE TABLE messages(id INTEGER PRIMARY KEY,sender_id INTEGER,recipient_id INTEGER,body TEXT,created_at INTEGER);
 CREATE TABLE events(id INTEGER PRIMARY KEY,user_id INTEGER,message TEXT,created_at INTEGER);
 CREATE TABLE sessions(token_hash TEXT,user_id INTEGER);
 CREATE TABLE actions(id INTEGER PRIMARY KEY,user_id INTEGER,kind TEXT,available_at INTEGER,UNIQUE(user_id,kind));
 CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT);INSERT INTO settings VALUES('crime_multiplier','1');
 INSERT INTO users(id,username,role) VALUES(1,'DonOne','owner'),(2,'MemberOne','player'),(3,'DonTwo','player'),(4,'Outsider','player');`);
 let time=Date.UTC(2026,9,14,12),dice=0,high=false,big=9999,bribe=9999;
 const q=(sql,...args)=>db.prepare(sql).get(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 const callbacks={bribeRoll:()=>bribe,bigScoreRoll:()=>big,hash:()=>'',log:(id,message)=>run('INSERT INTO events(user_id,message,created_at) VALUES(?,?,?)',id,message,time),json:(_res,status,body)=>({status,body}),roll:()=>typeof dice==='function'?dice():dice,draw:(min,max)=>typeof high==='function'?high(min,max):high?max:min,clock:()=>time};
 let game=installGame(db,callbacks);
 run('INSERT INTO families(id,name,leader_id,created_at,treasury) VALUES(1,?,?,?,?),(2,?,?,?,?)','Family One',1,time-7200000,10000000000,'Family Two',3,time-7200000,10000000000);
 db.exec("INSERT INTO family_members(user_id,family_id) VALUES(1,1),(2,1),(3,2)");
 if(equipped){for(const id of [1,2,3,4]){run("UPDATE armory_accounts SET ammo=100000 WHERE scope='personal' AND owner_id=?",id);run("INSERT INTO armory_weapons VALUES('personal',?,'sovereign-arsenal',1)",id);}for(const id of [1,2]){run("INSERT INTO armory_accounts VALUES('family',?,100000)",id);run("INSERT INTO armory_weapons VALUES('family',?,'sovereign-arsenal',1)",id);}}
 const call=(path,body,id=1)=>game.route({method:body===undefined?'GET':'POST',url:'/api/'+path},null,'/api/'+path.split('?')[0],body||{},q('SELECT * FROM users WHERE id=?',id));
 return {db,q,run,call,get game(){return game},settle:id=>game.settle(id),tick:()=>game.tick(),advance:ms=>{time+=ms},dice:n=>{dice=n},bribe:n=>{bribe=n},big:n=>{big=n},high:b=>{high=b},reset:()=>{game=installGame(db,callbacks)},time:()=>time};
}
