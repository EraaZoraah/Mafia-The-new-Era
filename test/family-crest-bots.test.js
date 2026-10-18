import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('bots choose crests from live server options rather than a stale list',()=>{const source=readFileSync(new URL('../bot-autonomy.js',import.meta.url),'utf8');assert.ok(source.includes("o=get('family/dashboard').options"));assert.ok(source.includes('crest:pick(o.crests)'));});
