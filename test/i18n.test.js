import test from 'node:test';
import assert from 'node:assert/strict';
import {createTranslator,dutch,languages,activeLanguage} from '../public/i18n.js';
import {menu} from '../public/navigation.js';
import {createRulesUI} from '../public/rules-ui.js';
import {ranks} from '../progression.js';

test('Dutch has a translation for every navigation entry, including staff and groups',()=>{
 const entries=menu.flatMap(entry=>Array.isArray(entry)?[entry]:[[entry.id,entry.label],...entry.items]);
 for(const [id,label] of [...entries,['admin','Admin Panel']]){
  const source=label.replace(/^[^A-Za-z]+/,'');
  assert.ok(Object.hasOwn(dutch,source),`${id}: ${source}`);
  assert.ok(dutch[source].trim());
 }
});
test('translations preserve rank names, unknown player content and literal replacement values',()=>{
 const nl=createTranslator('nl'),en=createTranslator('en');
 for(const rank of ranks)assert.equal(nl(rank.name),rank.name);
 const name='The $& Bellavita <crew>';
 assert.equal(nl('Next: {rank}',{rank:name}),'Volgende: '+name);
 assert.equal(en('Next: {rank}',{rank:name}),'Next: '+name);
 assert.equal(nl('Private message written by a player'),'Private message written by a player');
 assert.equal(nl('{xp} XP to go',{xp:123}),'Nog 123 XP');
 assert.equal(nl('Next: {rank}'),'Volgende: {rank}');
 assert.equal(createTranslator('fr')('Cash'),'Cash');
 for(const code of ['fr','de','es'])assert.equal(languages[code].ready,false);
 assert.throws(()=>createTranslator('__proto__'),RangeError);
});
test('English remains default and reviewed Dutch is selectable',()=>{
 assert.equal(activeLanguage,'en');assert.equal(languages.en.ready,true);assert.equal(languages.nl.ready,true);
 const en=createTranslator('en');for(const key of Object.keys(dutch))assert.equal(en(key),key);
});

test('Dutch FAQ coverage follows the current authoritative questions and answers',()=>{for(const pair of createRulesUI({}).questions)for(const source of pair)assert.ok(Object.hasOwn(dutch,source),source);});

test('Dutch strings retain interpolation fields from their English keys',()=>{
 const fields=s=>[...s.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m=>m[1]).sort();
 for(const [source,translation] of Object.entries(dutch))assert.deepEqual(fields(translation),fields(source),source);
});
