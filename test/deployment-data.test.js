import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {checkExistingDatabase} from '../docker/check-data.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'mafia-deploy-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  mkdirSync(path.join(root, 'data'));
  return {root, file: path.join(root, 'data', 'mafia.sqlite')};
}
test('deployment guard rejects missing, empty and invalid databases without initializing a world', t => {
  const {root, file} = fixture(t);
  assert.throws(() => checkExistingDatabase(root));
  writeFileSync(file, '');
  assert.throws(() => checkExistingDatabase(root), /empty/);
  writeFileSync(file, 'not sqlite');
  assert.throws(() => checkExistingDatabase(root));
  assert.equal(readFileSync(file, 'utf8'), 'not sqlite');
});
test('deployment guard requires accounts and preserves saved credentials and progress', t => {
  const {root, file} = fixture(t);
  const db = new DatabaseSync(file);
  db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY, password TEXT, cash INTEGER, bank INTEGER, xp INTEGER)');
  assert.throws(() => checkExistingDatabase(root), /saved accounts/);
  db.exec("INSERT INTO users VALUES(1,'saved-hash',12345,6789,321)");
  const before = db.prepare('SELECT * FROM users').all();
  db.close();
  const bytes = readFileSync(file);
  checkExistingDatabase(root);
  checkExistingDatabase(root);
  assert.deepEqual(readFileSync(file), bytes);
  const verify = new DatabaseSync(file, {readOnly: true});
  try { assert.deepEqual(verify.prepare('SELECT * FROM users').all(), before); } finally { verify.close(); }
});
