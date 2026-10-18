// Additive, idempotent maintenance. No player, family, balance or possessions reset.
import {DatabaseSync,backup} from 'node:sqlite';
import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
import {addBotWave,waveKey} from '../bot-wave.js';
const apply=process.argv.includes('--apply'),file=resolve(process.argv.find(a=>a.startsWith('--db='))?.slice(5)||'data/mafia.sqlite');
const db=new DatabaseSync(file,{readOnly:!apply});db.exec('PRAGMA foreign_keys=ON;PRAGMA busy_timeout=10000');
if(db.prepare("SELECT 1 FROM sqlite_master WHERE name='bot_meta'").get()&&db.prepare('SELECT 1 FROM bot_meta WHERE key=?').get(waveKey)){console.log('This wave already exists. No accounts changed.');db.close();process.exit(0)}
if(!apply){console.log('Preview: add 50 named mafia bots with varied activity. Existing players and families remain intact. Run with --apply to add this wave once.');db.close();process.exit(0)}
mkdirSync('backups',{recursive:true});const backupPath=resolve('backups/before-additive-bot-wave-'+Date.now()+'.sqlite');await backup(db,backupPath);
const before=JSON.stringify(db.prepare("SELECT * FROM users WHERE role='owner' ORDER BY id").all());
const result=addBotWave(db);if(JSON.stringify(db.prepare("SELECT * FROM users WHERE role='owner' ORDER BY id").all())!==before)throw Error('Owner invariant failed');
console.log(JSON.stringify({added:result.added.length,ownerUnchanged:true,backup:backupPath,botEngineEnabled:db.prepare("SELECT value FROM bot_meta WHERE key='enabled'").get()?.value==='true'}));db.close();
