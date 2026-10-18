import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
test('all browser and server modules parse before serving the game',()=>{
 for(const folder of ['', 'public/'])for(const name of readdirSync(new URL(folder,root)).filter(n=>n.endsWith('.js'))){
  const file=fileURLToPath(new URL(folder+name,root));
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(result.status,0,`${folder}${name}: ${result.stderr||result.error||''}`);
 }
});
