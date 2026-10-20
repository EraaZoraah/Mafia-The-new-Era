import test from 'node:test';
import assert from 'node:assert/strict';
import {spanish,dutch,languages,createTranslator,activeLocale} from '../public/i18n.js';
import {makeHtmlTranslator} from '../public/localization.js';
import {translateGenerated} from '../public/generated-locale.js';
import {localizeGameData} from '../public/data-locale.js';
import {rankNames} from '../public/rank-names.js';
import {fixture} from './helpers/game-fixture.js';
import {gameKnowledge} from '../game-knowledge.js';
const es=createTranslator('es');

test('Spanish covers existing UI resources and preserves every interpolation slot and rank',()=>{
 assert.equal(languages.es.ready,true);assert.equal(languages.fr.ready,true);assert.equal(languages.de.ready,true);
 for(const key of Object.keys(dutch))assert.ok(Object.hasOwn(spanish,key),key);
 const slots=s=>[...s.matchAll(/\{[A-Za-z][A-Za-z0-9_]*\}/g)].map(m=>m[0]).sort();
 for(const [key,value] of Object.entries(spanish))assert.deepEqual(slots(value),slots(key),key);
 for(const rank of rankNames)assert.equal(es(rank),rank);
 assert.equal(activeLocale,'en-US');assert.equal(es('Cash'),'Efectivo');assert.equal(es('Rounds'),'Balas');
 assert.ok(es('Family creation costs $1,000,000.').includes('$1,000,000'));
});

test('Spanish templates and DTOs protect account names, chat, bios and staff announcements',()=>{
 const name='Cash <img src=x>',message='Buy MAX',h=makeHtmlTranslator(es);
 const html=h`<h2>Cash</h2><span>${name}</span><p>${message}</p>`;
 assert.ok(html.includes('<h2>Efectivo</h2>'));assert.ok(html.includes(name));assert.ok(html.includes(message));
 const data={users:[{id:1,username:'Cash',rank:'The Godfather',bio:'My family'}],messages:[{body:'Bank'}],family:{id:3,name:'Daily objectives'}};
 assert.deepEqual(localizeGameData('directory',data,'es'),data);
 const news={entries:[{title:'Cash',body:'Grand Supporter',systemKind:null}]};
 assert.deepEqual(localizeGameData('bulletins',news,'es'),news);
 assert.notEqual(translateGenerated('Crime failed. Arrested for 15 minutes.','es'),'Crime failed. Arrested for 15 minutes.');
});

test('Spanish renders real feature responses without changing gameplay values',t=>{
 const f=fixture(t);
 for(const path of ['catalog','art','vehicles','armory','production','family/dashboard','employees','daily','achievements','shop','news','calendar','notifications','casino','casino-extra','underworld','support','investments','airport']){
  const r=f.call(path);assert.ok(r&&r.status<500,path);
  if(r.status===200)assert.doesNotThrow(()=>localizeGameData(path,r.body,'es'),path);
 }
 const source=f.call('armory').body,translated=localizeGameData('armory',source,'es');
 assert.equal(translated.ammo,source.ammo);
 const english=gameKnowledge(),localized=gameKnowledge('es');assert.equal(localized.length,english.length);
 for(let i=0;i<english.length;i++)assert.notEqual(localized[i].text,english[i].text,english[i].title);
});

test('Luca recognizes Spanish questions and uses live production quotes and custody restrictions',t=>{
 const f=fixture(t);f.run("UPDATE users SET city='New York' WHERE id=1");
 let r=f.call('guide?q='+encodeURIComponent('¿Qué droga es más rentable para producir?')+'&lang=es');
 assert.equal(r.status,200);assert.equal(r.body.language,'es');assert.match(r.body.answer,/almacenamiento|almacén/i);
 assert.ok(r.body.market.bestMarket);assert.ok(r.body.answer.includes(Math.floor(r.body.market.bestMarket.productionCost).toLocaleString('en-US')));
 assert.ok(!/Best market combination|Production \$|Live market comparison|medicamentos/.test(r.body.answer));
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+3600000);
 r=f.call('guide?q='+encodeURIComponent('mejor droga para producir')+'&lang=es');
 assert.match(r.body.answer,/detenid|liberaci/i);
 const language=f.call('guide?q=idioma%20espa%C3%B1ol&lang=es').body;
 assert.match(language.answer,/español \(ES\)/);assert.ok(!language.answer.includes('Spanish are Coming soon'));
});
