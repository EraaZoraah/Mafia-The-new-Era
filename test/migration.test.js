import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {installGame} from '../game.js';

test('legacy possessions migrate without losing wallets, ownership or accrual timestamps',()=>{
  const db=new DatabaseSync(':memory:');
  try{
    db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE users(id INTEGER PRIMARY KEY,xp INTEGER,cash INTEGER,bank INTEGER,energy INTEGER,health INTEGER);
      CREATE TABLE messages(id INTEGER PRIMARY KEY,recipient_id INTEGER);
      CREATE TABLE events(id INTEGER PRIMARY KEY,user_id INTEGER);
      CREATE TABLE possessions(user_id INTEGER REFERENCES users(id),category TEXT CHECK(category IN ('business','car','home')),item_id TEXT,acquired_at INTEGER,income_at INTEGER,PRIMARY KEY(user_id,category,item_id));
      INSERT INTO users VALUES(1,8000,123456,654321,75,90);
      INSERT INTO possessions VALUES(1,'car','fiat500',1000000,1000000);
      INSERT INTO possessions VALUES(1,'business','coffee',2000000,3000000);`);
    const callbacks={hash:()=>'',log:()=>{},json:()=>true};
    installGame(db,callbacks);
    installGame(db,callbacks);
    assert.deepEqual({...db.prepare('SELECT cash,bank,xp FROM users WHERE id=1').get()},{cash:123456,bank:654321,xp:8000});
    const asset=db.prepare("SELECT * FROM possessions WHERE item_id='coffee'").get();
    assert.equal(asset.income_at,3000000);
    assert.equal(asset.acquired_at,2000000);
    assert.equal(asset.income_remainder,0);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM possessions').get().n,2);
    db.prepare('INSERT INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(?,?,?,?,?)').run(1,'jet','swift',4000000,4000000);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  }finally{db.close();}
});

test('premium five-category migration preserves quantities and fractional income on repeated startup',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,xp INTEGER,cash INTEGER,bank INTEGER,energy INTEGER,health INTEGER);
   CREATE TABLE messages(id INTEGER PRIMARY KEY,recipient_id INTEGER); CREATE TABLE events(id INTEGER PRIMARY KEY,user_id INTEGER);
   CREATE TABLE possessions(user_id INTEGER,category TEXT CHECK(category IN ('business','car','home','helicopter','jet')),item_id TEXT,acquired_at INTEGER,income_at INTEGER,income_remainder INTEGER,PRIMARY KEY(user_id,category,item_id));
   INSERT INTO users VALUES(1,1000,1000,0,100,100);
   INSERT INTO possessions VALUES(1,'business','coffee',10,20,123456);`);
  const callbacks={hash:()=>'',log:()=>{},json:()=>true};installGame(db,callbacks);installGame(db,callbacks);
  const row=db.prepare('SELECT * FROM possessions').get();assert.equal(row.quantity,1);assert.equal(row.income_remainder,12345600);assert.equal(row.income_at,20);
  db.prepare('UPDATE possessions SET quantity=3').run();installGame(db,callbacks);assert.equal(db.prepare('SELECT quantity FROM possessions').get().quantity,3);
 }finally{db.close()}
});
