import {accessSync, constants, statSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function checkExistingDatabase(root) {
  const folder = path.join(root, 'data');
  const file = path.join(folder, 'mafia.sqlite');
  if (!statSync(file).isFile() || statSync(file).size === 0) throw new Error('Missing or empty mafia.sqlite');
  accessSync(folder, constants.R_OK | constants.W_OK | constants.X_OK);
  accessSync(file, constants.R_OK | constants.W_OK);
  const db = new DatabaseSync(file, {readOnly: true});
  try {
    if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('SQLite quick_check failed');
    if (db.prepare('SELECT COUNT(*) AS count FROM users').get().count === 0) throw new Error('Expected saved accounts in users');
  } finally {
    db.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const required = process.env.REQUIRE_EXISTING_DATABASE ?? 'true';
    if (!['true', 'false'].includes(required)) throw new Error('REQUIRE_EXISTING_DATABASE must be true or false');
    if (required === 'true') checkExistingDatabase(fileURLToPath(new URL('../', import.meta.url)));
  } catch (error) {
    console.error(`Refusing to start: ${error.message}. Check the existing data bind mount and restore a verified backup if necessary. Never disable this guard for a production upgrade.`);
    process.exitCode = 1;
  }
}
