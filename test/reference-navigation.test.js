import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationSections,menu} from '../public/navigation.js';
import {navigationMatches,renderNavigation} from '../public/navigation-ui.js';
import {readFileSync} from 'node:fs';
import {createTranslator} from '../public/i18n.js';
test('reference layout has Overview, Your world and Extras sections with all routes exactly once',()=>{
 assert.deepEqual(navigationSections.map(s=>s.label),['Overview','Your world','Extras & staff']);
 assert.deepEqual(navigationSections[0].items.map(x=>x[0]),['dashboard','daily','bulletins','messages']);
 assert.deepEqual(navigationSections[1].items.map(x=>x.label),['My character','Crimes & missions','My empire','My family','Money & trading','The city','Help & information']);
 const expected=['admin','tickets','bulletins','achievements','dashboard','profile','marriage','inventory','employees','armory','business','home','garage','warehouses','car','helicopter','jet','yacht','families','family-chat','family-plans','rivals','seasons','family-assets','family-territory','family-armory','family-safehouses','family-compounds','family-fleet','family-upgrades','daily','missions','art-market','team-missions','bounties','shipments','combat','production','security','airport','bank','crypto','investments','auction-house','transfers','circuit','casino','directory','family-directory','underworld','ranks','respect','hospital','prison','boutique','messages','referrals','support','policy','rules','faq'];
 const actual=menu.flatMap(x=>Array.isArray(x)?[x[0]]:x.items.map(x=>x[0]));assert.deepEqual([...actual].sort(),[...expected].sort());assert.equal(actual.length,new Set(actual).size);
 const city=menu.find(x=>x.id==='city').items.map(x=>x[0]);assert.equal(city.indexOf('circuit')+1,city.indexOf('casino'));
});
test('page search is escaped, bilingual labels exist and staff results stay role-scoped',()=>{
 assert.equal(navigationMatches('Casino','CASÍNO'),true);assert.equal(navigationMatches('My empire','city'),false);
 const markup=renderNavigation({user:{role:'player'},tab:'profile',query:'"><img src=x>'});assert.ok(markup.includes('&lt;img'));assert.ok(!markup.includes('<img src=x>'));assert.ok(!markup.includes('data-tab="admin"'));assert.ok(!markup.includes('data-tab="tickets"'));
 const nl=createTranslator('nl');for(const label of [...navigationSections.map(s=>s.label),...navigationSections[1].items.map(x=>x.label),'Find a page','Find a page…','Clear page search','No matching pages.'])assert.notEqual(nl(label),label,label);
 for(const path of ['public/navigation-ui.js','public/icons/menu-character.svg','public/icons/menu-search-pages.svg'])assert.ok(readFileSync(new URL('../'+path,import.meta.url)).length);
});
import {gameKnowledge} from '../game-knowledge.js';
test('Luca indexes current English and Dutch category paths without staff destinations',()=>{
 for(const [lang,section] of [['en','My empire'],['nl','Mijn imperium']]){
  const knowledge=gameKnowledge(lang);assert.ok(knowledge.some(k=>k.tab==='warehouses'&&k.text.includes(section)&&k.text.includes('→')));
  assert.ok(!knowledge.some(k=>['admin','tickets'].includes(k.tab)));
 }
});
