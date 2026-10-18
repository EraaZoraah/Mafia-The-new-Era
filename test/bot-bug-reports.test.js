import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {installBots} from '../bot-players.js';
import {createTranslator,activeLocale} from '../public/i18n.js';
test('bots file one real internal-error ticket per route, exclude support recursion and do not report normal validation',t=>{
 const f=fixture(t);for(const id of [2,3,4])f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(?,'builder',0)",id);
 f.run("INSERT INTO bot_action_stats VALUES(2,'production/start',1,0,500,?)",f.time());f.run("INSERT INTO bot_action_stats VALUES(3,'production/start',1,0,500,?)",f.time());f.run("INSERT INTO bot_action_stats VALUES(4,'support/create',1,0,500,?)",f.time());
 const bots=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>a,call:(id,path,body)=>f.call(path,body,id)});bots.step(2);bots.step(3);bots.step(4);
 assert.equal(f.q("SELECT COUNT(*) n FROM support_tickets WHERE category='bug' AND subject='Bot server error: production/start'").n,1);assert.equal(f.q("SELECT COUNT(*) n FROM support_tickets WHERE subject LIKE '%support/create%'").n,0);
 const ticket=f.q("SELECT * FROM support_tickets WHERE category='bug'");assert.ok(ticket);assert.equal(f.call('support',undefined,1).status,200);
});
test('language changes never alter dollar currency or numerical punctuation',()=>{
 assert.equal(activeLocale,'en-US');const nl=createTranslator('nl');assert.ok(nl('Family creation costs $1,000,000.').includes('$1,000,000'));assert.equal(nl('The Godfather'),'The Godfather');
});
