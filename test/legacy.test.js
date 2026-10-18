import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {SEASON_LENGTH} from '../legacy.js';
import {crimes} from '../catalog.js';

test('Big Score has an exact 5% boundary, succeeds, triples rewards and XP, and spends supplies once',t=>{
 const f=fixture(t),c=crimes[0];f.big(499);f.dice(9999);const offer=f.call('catalog').body.crimes.find(x=>x.id===c.id),xp=f.q('SELECT xp FROM users WHERE id=1').xp,ammo=f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo;
 const result=f.call('action',{kind:c.id});assert.equal(result.status,200);assert.equal(result.body.bigScore,true);assert.equal(result.body.success,true);assert.equal(result.body.xp,c.xp*3);assert.equal(result.body.reward,(offer.payout.baseMin+offer.payout.bonusMin)*3);assert.equal(f.q('SELECT xp FROM users WHERE id=1').xp,xp+c.xp*3);assert.equal(f.q("SELECT ammo FROM armory_accounts WHERE scope='personal' AND owner_id=1").ammo,ammo-result.body.ammoUsed);
 assert.equal(f.call('action',{kind:c.id}).status,429);assert.equal(f.q('SELECT COUNT(*) n FROM crime_big_scores').n,1);f.advance(c.cooldown+1);f.big(500);f.dice(0);assert.equal(f.call('action',{kind:c.id}).body.bigScore,false);
 assert.ok(f.call('achievements').body.milestones.find(x=>x.id==='big-score').earnedAt);
});
test('Big Score respects cash and XP ceilings and cannot bypass eligibility',t=>{
 const f=fixture(t),c=crimes[0];f.big(0);f.run('UPDATE users SET cash=999999999999999,xp=999999999999 WHERE id=1');const r=f.call('action',{kind:c.id});assert.equal(r.body.reward,1);assert.equal(r.body.xp,1);assert.equal(f.q('SELECT xp,cash FROM users WHERE id=1').xp,1000000000000);
 f.advance(c.cooldown+1);f.run('UPDATE users SET energy=0,energy_at=? WHERE id=1',f.time());assert.equal(f.call('action',{kind:c.id}).status,429);assert.equal(f.q('SELECT COUNT(*) n FROM crime_big_scores').n,1);
});
test('intro achievements persist and expose only earned themes and titles',t=>{
 const f=fixture(t);const settings={theme:'onyx',emblem:'crown',banner:'skyline',bio:'',title:''};assert.equal(f.call('profile/settings',settings).status,400);
 f.run("INSERT INTO operation_history(user_id,kind,success,created_at) VALUES(1,'joint assault',1,?)",f.time());const data=f.call('achievements').body.milestones;assert.ok(data.find(x=>x.id==='first-team').earnedAt);assert.equal(f.call('profile/settings',{...settings,title:'achievement:first-team'}).status,200);
 f.run("DELETE FROM operation_history WHERE user_id=1 AND kind='joint assault'");assert.equal(f.call('profile/settings',settings).status,200);f.reset();const p=f.call('profiles/1').body;assert.ok(p.player.achievements.some(x=>x.id==='first-team'));assert.ok(p.options.themes.includes('onyx'));assert.ok(p.options.titles.some(x=>x.id==='achievement:first-team'));assert.equal(f.call('profile/settings',{...settings,title:'achievement:crime-100'}).status,403);
});
test('family respect is once per player per UTC day even after changing families',t=>{
 const f=fixture(t);assert.equal(f.call('family/respect/give',{},4).status,403);assert.equal(f.call('family/respect/give',{},2).status,200);assert.equal(f.call('family/respect').body.respect.total,1);assert.equal(f.call('family/respect/give',{},2).status,409);
 f.run('UPDATE family_members SET family_id=2 WHERE user_id=2');assert.equal(f.call('family/respect/give',{},2).status,409);f.advance(86400000);assert.equal(f.call('family/respect/give',{},2).status,200);assert.equal(f.call('family/respect',undefined,3).body.respect.total,1);
});
test('seasons archive earned trophies once, score wars, keep assets and restart persistently',t=>{
 const f=fixture(t);f.run("INSERT INTO family_assets VALUES(1,'territory-block',1)");const d=f.call('seasons').body;assert.equal(d.current.ends_at-d.current.starts_at,SEASON_LENGTH);assert.equal(f.call('family/war/declare',{familyId:2}).status,200);assert.equal(f.call('family/raid',{familyId:2}).body.success,true);assert.equal(f.call('family/war/surrender',{},3).status,200);
 const cash=f.q('SELECT treasury FROM families WHERE id=1').treasury;const ranking=f.call('seasons').body.ranking;assert.equal(ranking.find(x=>x.familyId===1).points,26);
 f.advance(d.current.ends_at-f.time());const next=f.call('seasons').body;assert.equal(next.current.id,2);assert.equal(next.ranking.find(x=>x.familyId===1).points,0);assert.equal(next.history[0].results[0].trophy,'Gold crown');assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,cash+100000000+4800000);assert.equal(f.q("SELECT quantity FROM family_assets WHERE family_id=1 AND item_id='territory-block'").quantity,1);
 f.reset();assert.equal(f.call('seasons').body.history[0].results.length,1);assert.equal(f.q('SELECT COUNT(*) n FROM family_season_results').n,1);f.advance(SEASON_LENGTH);assert.equal(f.call('seasons').body.history[0].results.length,0);
});
test('world chat validates messages, retries, rate limits and staff moderation authority',t=>{
 const f=fixture(t),b={text:'Hello <img src=x onerror=alert(1)>',key:'world-chat-request-001'};assert.equal(f.call('world-chat/send',b,2).status,200);assert.equal(f.call('world-chat/send',b,2).status,200);assert.equal(f.call('world-chat').body.messages.length,1);assert.equal(f.call('world-chat').body.messages[0].body,b.text);assert.equal(f.call('world-chat/send',{...b,key:'world-chat-request-002'},2).status,429);assert.equal(f.call('world-chat/hide',{id:1},2).status,403);assert.equal(f.call('world-chat/hide',{id:1}).status,200);assert.equal(f.call('world-chat').body.messages[0].body,'[Message removed by staff]');
 f.run("UPDATE users SET role='admin' WHERE id=3");assert.equal(f.call('world-chat/send',{text:'Owner announcement',key:'world-chat-request-owner'}).status,200);assert.equal(f.call('world-chat/hide',{id:2},3).status,403);assert.equal(f.call('world-chat/send',{text:'x'.repeat(1001),key:'world-chat-request-long'},4).status,400);
});
test('directory includes all eligible players through pagination and treats wildcard input literally',t=>{
 const f=fixture(t);for(let n=5;n<=40;n++)f.run('INSERT INTO users(id,username) VALUES(?,?)',n,'Visitor'+n);const a=f.call('directory').body,b=f.call('directory?page=2').body;assert.equal(a.total,40);assert.equal(a.players.length,30);assert.equal(b.players.length,10);assert.equal(new Set([...a.players,...b.players].map(p=>p.id)).size,40);assert.equal(f.call('directory?search=%25').body.total,0);assert.equal(f.call('directory?page=-1').status,400);f.run('UPDATE users SET banned=1 WHERE id=2');assert.equal(f.call('directory').body.total,39);
});
