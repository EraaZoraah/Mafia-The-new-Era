import test from 'node:test';
import assert from 'node:assert/strict';
import {localizeGameData} from '../public/data-locale.js';
import {translateGenerated} from '../public/generated-locale.js';
import {dutch,createTranslator} from '../public/i18n.js';
import {generatedLanguageKeys} from '../public/generated-language-keys.js';
import {rankNames} from '../public/rank-names.js';
test('generated result and validation messages have reviewed Dutch resources',()=>{
 for(const key of generatedLanguageKeys)assert.ok(Object.hasOwn(dutch,key),key);
 assert.equal(translateGenerated('Crime failed. Arrested for 15 minutes.','nl'),'Misdaad mislukt. Gearresteerd voor 15 minuten.');
 assert.equal(translateGenerated('Car theft: success · $1200 earned, including extra loot (+500 XP).','nl'),'Autodiefstal: geslaagd · $1200 verdiend, inclusief extra buit (+500 XP).');
 for(const name of rankNames)assert.equal(translateGenerated(name,'nl'),name);
});
test('catalog localization preserves account names, private content, identifiers and gameplay enums',()=>{
 const data={catalog:[{id:'coffee',category:'business',name:'Neighborhood coffeeshop',price:120000},{id:'canal-nocturne',name:'Canal Nocturne'}],family:{id:1,name:'Neighborhood coffeeshop'},users:[{id:1,username:'Street crime',name:'Car theft'}],messages:[{body:'Crime succeeded.',sender:'The Godfather'}]};
 const nl=localizeGameData('catalog',data,'nl');assert.equal(nl.catalog[0].name,'Buurtcoffeeshop');assert.equal(nl.catalog[0].category,'business');assert.equal(nl.catalog[1].name,'Grachtennocturne');assert.deepEqual(nl.family,data.family);assert.deepEqual(nl.users,data.users);assert.deepEqual(nl.messages,data.messages);assert.equal(data.catalog[0].name,'Neighborhood coffeeshop');assert.equal(localizeGameData('catalog',data,'en'),data);
 const player='Car theft';assert.equal(translateGenerated(player+' gave you respect. Your respect rank and bonuses have been updated.','nl'),player+' gaf je respect. Je respectrang en bonussen zijn bijgewerkt.');
});
test('authored announcements stay unchanged while trusted system announcements are localized',()=>{
 const text='Welcome to the Mafia: The New Era beta',body='The first family season begins. Write the first chapter of city history.';
 const data={entries:[{id:1,title:text,body,systemKind:''},{id:2,title:'Family season 3 — a new crown awaits',body,systemKind:'season'}]};
 const nl=localizeGameData('bulletins',data,'nl');assert.equal(nl.entries[0].title,text);assert.equal(nl.entries[0].body,body);assert.equal(nl.entries[1].title,'Familieseizoen 3 — een nieuwe kroon wacht');assert.match(nl.entries[1].body,/eerste familieseizoen/);
});

test('partial catalog records without names never crash Dutch account refresh',()=>{assert.doesNotThrow(()=>localizeGameData('me',{possessions:[{id:'fiat-500',quantity:1}]},'nl'));});
