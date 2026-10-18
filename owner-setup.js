import {hashPasswordSync,validPassword} from './auth-security.js';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const db=new DatabaseSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'data','mafia.sqlite'));
const [,,username,password]=process.argv;
if(!username||!/^[a-zA-Z0-9_]{3,20}$/.test(username)||!validPassword(password)){console.error('Usage: node owner-setup.js USERNAME "strong-password-of-at-least-15-characters"');process.exit(1)}
const u=db.prepare('SELECT id FROM users WHERE username=?').get(username);if(!u){console.error('Register the account through the website first.');process.exit(1)}
const hashed=hashPasswordSync(password);
db.prepare("UPDATE users SET role='owner',password=? WHERE id=?").run(hashed,u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);console.log('Owner assigned. Sign in again with your new password.');
