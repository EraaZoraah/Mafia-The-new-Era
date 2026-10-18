import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {localizeGameData} from '../public/data-locale.js';
import {gameKnowledge} from '../game-knowledge.js';
import {generatedLanguageKeys} from '../public/generated-language-keys.js';
import {dutch} from '../public/i18n.js';
test('Dutch handles real account, catalog and feature DTOs without translating player identities',t=>{
 const f=fixture(t);for(const path of ['catalog','art','vehicles','armory','production','family/dashboard','employees','daily','achievements','shop','news','calendar','notifications','casino','casino-extra','underworld','support','investments','airport']){const r=f.call(path);assert.ok(r&&r.status<500,path);if(r.status===200)assert.doesNotThrow(()=>localizeGameData(path,r.body,'nl'),path);}
 const user=f.q('SELECT * FROM users WHERE id=1'),profile=f.game.profile(user),me=localizeGameData('me',{user:{...user,...profile},events:[]},'nl');assert.equal(me.user.username,'DonOne');assert.equal(me.user.rank,profile.rank);
});
test('all generated result patterns and shared Luca facts have Dutch resources',()=>{
 for(const key of generatedLanguageKeys)assert.ok(Object.hasOwn(dutch,key),key);const en=gameKnowledge(),nl=gameKnowledge('nl');assert.equal(en.length,nl.length);for(let i=0;i<en.length;i++)assert.notEqual(nl[i].text,en[i].text,en[i].title);
});
test('Luca explains condition and vehicle auction rules in both languages',t=>{
 const f=fixture(t);for(const lang of ['en','nl']){const r=f.game.route({method:'GET',url:'/api/guide?q=Pristine%20vehicle%20condition%20auction&lang='+lang},null,'/api/guide',{},f.q('SELECT * FROM users WHERE id=1'));assert.equal(r.status,200);const text=JSON.stringify(r.body);assert.match(text,/Pristine/i);assert.match(text,/3%/);}
});
