import test from 'node:test';
import assert from 'node:assert/strict';
import {dutch,french,german,languages,createTranslator,activeLocale} from '../public/i18n.js';
import {rankNames} from '../public/rank-names.js';
import {localizeGameData} from '../public/data-locale.js';
import {translateGenerated} from '../public/generated-locale.js';
import {fixture} from './helpers/game-fixture.js';
import {gameKnowledge} from '../game-knowledge.js';

for(const [language,dictionary] of [['fr',french],['de',german]]){
 test(language+' covers all controlled resources, interpolation fields and unchanged rank names',()=>{
  assert.equal(languages[language].ready,true);const t=createTranslator(language);
  for(const key of Object.keys(dutch))assert.ok(Object.hasOwn(dictionary,key),key);
  const slots=s=>[...s.matchAll(/\{[A-Za-z][A-Za-z0-9_]*\}/g)].map(m=>m[0]).sort();
  for(const [key,value] of Object.entries(dictionary))assert.deepEqual(slots(value),slots(key),key);
  for(const rank of rankNames)assert.equal(t(rank),rank);
  assert.equal(activeLocale,'en-US');
  assert.ok(translateGenerated('Beta referral starter bonus: $25000000.',language).includes('$25000000'));
  assert.ok(translateGenerated('Qualified beta referral #7: $50000000.',language).includes('$50000000'));
 });
 test(language+' localizes real feature results without changing player data or numeric balances',t=>{
  const f=fixture(t);
  for(const path of ['catalog','art','vehicles','armory','production','family/dashboard','employees','daily','achievements','shop','news','calendar','notifications','casino','casino-extra','underworld','support','investments','airport']){
   const r=f.call(path);assert.ok(r&&r.status<500,path);if(r.status===200)assert.doesNotThrow(()=>localizeGameData(path,r.body,language),path);
  }
  const data={players:[{id:2,username:'Cash',rank:'The Godfather',cash:123456,biography:'Bank'}],messages:[{body:'Buy MAX'}],family:{id:9,name:'Private jets'}};
  assert.deepEqual(localizeGameData('directory',data,language),data);
  const en=gameKnowledge(),localized=gameKnowledge(language);assert.equal(localized.length,en.length);
  localized.forEach((row,i)=>assert.notEqual(row.text,en[i].text,en[i].title));
 });
 test(language+' Luca understands live-market, custody and language questions',t=>{
  const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=1");
  const question=language==='fr'?'Quelle drogue est la plus rentable à produire ?':'Welche Droge ist am besten für die Produktion?';
  const ask=()=>f.call('guide?q='+encodeURIComponent(question)+'&lang='+language).body;
  const reply=ask();assert.equal(reply.language,language);assert.ok(reply.market.bestMarket);
  assert.ok(reply.answer.includes(Math.floor(reply.market.bestMarket.productionCost).toLocaleString('en-US')));
  assert.doesNotMatch(reply.answer,/Best market combination|Live market comparison|freight truck/);
  f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);
  assert.match(ask().answer,language==='fr'?/détenu|libération|détention/i:/festgehalten|Freilassung|inhaftiert|Haft/i);
  const explanation=f.call('guide?q='+encodeURIComponent(language==='fr'?'langue française':'Sprache Deutsch')+'&lang='+language).body;
  assert.equal(explanation.language,language);assert.match(explanation.answer,/FR/);assert.match(explanation.answer,/DE/);
 });
}
