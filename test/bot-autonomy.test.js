import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {installBots} from '../bot-players.js';
import {botDomains} from '../bot-autonomy.js';
import {botCapabilities,botCommandBoundaries,botReadOnlyRoutes} from '../bot-capabilities.js';
import {readFileSync,readdirSync} from 'node:fs';
import {addBotWave} from '../bot-wave.js';
function setup(t){
 const f=fixture(t);for(const id of [2,3,4])f.run("INSERT INTO bot_players(user_id,personality,next_at) VALUES(?,'builder',0)",id);
 f.run("UPDATE users SET cash=1000000000,xp=50000,city='New York',energy=1000 WHERE id>1");
 let seed=711;const random=(a,b)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return a+seed%(b-a)};
 const requests=[],bots=installBots(f.db,f.game,{clock:f.time,random,call:(id,path,body)=>{const r=f.call(path,body,id);requests.push({id,path,status:r?.status,error:r?.body?.error});return r}});
 return {...f,bots,requests};
}
test('every registered gameplay command has an autonomous caller; staff and payments are excluded',()=>{
 const source=['../bot-players.js','../bot-autonomy.js'].map(n=>readFileSync(new URL(n,import.meta.url),'utf8')).join('\n');
 for(const command of Object.values(botCapabilities).flat())assert.ok(source.includes("'"+command+"'"),command);
 assert.ok(Object.values(botCapabilities).flat().length>=85);
 assert.ok(!Object.values(botCapabilities).flat().some(p=>p.startsWith('admin/')||p==='shop/checkout'));
 assert.ok(botCommandBoundaries['shop/checkout']);
});
test('every server route is classified so new gameplay cannot silently miss bot support',()=>{
 const root=new URL('../',import.meta.url),covered=new Set([...Object.values(botCapabilities).flat(),...Object.keys(botCommandBoundaries),...botReadOnlyRoutes]),missing=[];
 for(const file of readdirSync(root).filter(f=>f.endsWith('.js'))){
  const source=readFileSync(new URL(file,root),'utf8');for(const [,path] of source.matchAll(/['"]\/api\/([a-z][a-z0-9/-]*)['"]/g)){
   if(path.startsWith('admin')||path.endsWith('/'))continue;
   if(!covered.has(path))missing.push(file+': '+path);
  }
 }
 assert.deepEqual(missing,[],'New routes need a bot strategy or explicit classification');
});
test('every autonomy domain can run for every personality through ordinary handlers',t=>{
 const f=setup(t),owner=f.q('SELECT cash,xp,role FROM users WHERE id=1');
 for(let round=0;round<15;round++)for(const id of [2,3,4])for(const domain of botDomains){
  assert.doesNotThrow(()=>f.bots.step(id,{domain}),`${id}/${domain}`);f.advance(61000);
 }
 assert.deepEqual(f.requests.filter(r=>r.status>=500||r.status===undefined),[]);
 assert.deepEqual(f.q('SELECT cash,xp,role FROM users WHERE id=1'),owner);
 assert.equal(f.db.prepare('PRAGMA foreign_key_check').all().length,0);
 assert.equal(f.q('SELECT COUNT(*) n FROM users WHERE cash<0 OR bank<0 OR energy<0').n,0);
 assert.ok(f.q('SELECT COUNT(DISTINCT path) n FROM bot_action_stats WHERE successes>0').n>=15);
 t.diagnostic('Successful autonomous commands: '+f.db.prepare('SELECT DISTINCT path FROM bot_action_stats WHERE successes>0 ORDER BY path').all().map(r=>r.path).join(', '));
});
test('all fifty new bots can evaluate every gameplay domain at their own rank and resources',t=>{
 const f=setup(t),wave=addBotWave(f.db,{clock:f.time,random:a=>a,hash:()=> 'isolated-non-login-hash'}),owner=f.q('SELECT cash,xp,role FROM users WHERE id=1');
 for(const bot of wave.added)for(const domain of botDomains)assert.doesNotThrow(()=>f.bots.step(bot.id,{domain}),bot.username+'/'+domain);
 assert.deepEqual(f.requests.filter(r=>r.status>=500||r.status===undefined),[]);
 assert.deepEqual(f.q('SELECT cash,xp,role FROM users WHERE id=1'),owner);
 assert.equal(f.q("SELECT COUNT(*) n FROM users WHERE role='owner'").n,1);
});
test('banking and casino bots use real debits, collect returns and finish active hands',t=>{
 const f=setup(t),before=f.q('SELECT cash,bank FROM users WHERE id=2');f.bots.step(2,{domain:'banking'});
 const after=f.q('SELECT cash,bank FROM users WHERE id=2');assert.equal(after.cash+after.bank,before.cash+before.bank);assert.ok(after.bank>0);
 assert.equal(f.call('casino/start',{game:'blackjack',stake:1000,requestKey:'autonomy-blackjack'},2).status,200);
 for(let i=0;i<10;i++){f.bots.step(2,{domain:'casino'});f.advance(3000)}
 assert.ok(f.q("SELECT COUNT(*) n FROM casino_rounds WHERE user_id=2 AND status='finished'").n>0);
 assert.equal(f.call('bank',{type:'withdraw',amount:-1},2).status,400);
});
test('release quotes include maxCost; bots can pay their own bail from cash and bank',t=>{
 const f=setup(t);assert.equal(f.call('custody/report',{target:'MemberOne',hours:1},3).status,200);
 const before=f.q('SELECT cash+bank n FROM users WHERE id=2').n;f.bots.step(2);
 assert.equal(f.q('SELECT prison_until FROM users WHERE id=2').prison_until,0);assert.ok(f.q('SELECT cash+bank n FROM users WHERE id=2').n<before);
});
test('profile editing sends only permitted fields and uses unlocked cosmetics',t=>{
 const f=setup(t);f.bots.step(2,{domain:'appearance'});
 assert.equal(f.q('SELECT last_status FROM bot_players WHERE user_id=2').last_status,200);
 assert.ok(f.q('SELECT avatar FROM player_profiles WHERE user_id=2').avatar);
});
test('pending cars can be stored or exchanged, and completed stock is shipped or sold',t=>{
 const f=setup(t);f.call('assets/buy',{id:'vehicle-warehouse',category:'garage'},2);
 f.run("INSERT INTO vehicle_loot(user_id,vehicle_id,city,state,created_at) VALUES(2,'dacia-sandero','New York','pending',?)",f.time());
 f.bots.step(2,{domain:'vehicles'});assert.equal(f.q('SELECT state FROM vehicle_loot WHERE user_id=2').state,'stored');
 f.bots.step(2,{domain:'vehicles'});assert.ok(['sold','transit'].includes(f.q('SELECT state FROM vehicle_loot WHERE user_id=2').state));
 f.bots.step(3,{domain:'freight'});assert.ok(f.q("SELECT 1 FROM possessions WHERE user_id=3 AND item_id='production-warehouse'")||f.q("SELECT 1 FROM family_assets WHERE family_id=2 AND item_id='warehouse-production-family'"));
});
test('autonomous commanders capture through real Power rules and form a consenting joint assault',t=>{
 const f=setup(t);f.run('UPDATE family_members SET family_id=2 WHERE user_id=2');
 assert.equal(f.call('families',{name:'Third Syndicate'},4).status,201);const target=f.q('SELECT id FROM families WHERE leader_id=4').id;
 f.run('UPDATE families SET treasury=10000000000,created_at=? WHERE id=?',f.time()-7200000,target);
 for(const id of [3,4]){const p=f.call('family/map?city=New%20York',undefined,id).body.plots.find(p=>!p.owner_id);assert.equal(f.call('family/map/buy',{city:'New York',plotId:p.id},id).status,200);}
 f.advance(3600001);assert.equal(f.call('family/war/declare',{familyId:target},3).status,200);
 const capture=installBots(f.db,f.game,{clock:f.time,random:(a,b)=>b===4?1:a,call:(id,path,body)=>f.call(path,body,id)});
 capture.step(3,{domain:'war'});assert.equal(f.q('SELECT last_action FROM bot_players WHERE user_id=3').last_action,'family/war/capture');assert.equal(f.q('SELECT last_status FROM bot_players WHERE user_id=3').last_status,200);
 assert.equal(f.q('SELECT COUNT(*) n FROM city_territories WHERE owner_id=2 AND captured=1').n,1);
 f.advance(31*60000);const teams=installBots(f.db,f.game,{clock:f.time,random:a=>a,call:(id,path,body)=>f.call(path,body,id)});
 teams.step(3,{domain:'war'});teams.step(2,{domain:'war'});teams.step(3,{domain:'war'});
 assert.equal(f.q('SELECT last_action FROM bot_players WHERE user_id=3').last_action,'family/war/team/launch');assert.equal(f.q('SELECT last_status FROM bot_players WHERE user_id=3').last_status,200);
 assert.equal(f.q("SELECT COUNT(*) n FROM war_teams WHERE family_id=2 AND status='completed'").n,1);
});
test('bots handle member promotion, incoming alliance consent and gifts without staff grants',t=>{
 const f=setup(t);f.run('UPDATE family_members SET family_id=2 WHERE user_id=2');
 f.bots.step(3,{domain:'leadership'});assert.equal(f.q('SELECT family_role FROM family_members WHERE user_id=2').family_role,'soldier');
 assert.equal(f.call('family/alliance',{familyId:2,action:'request'},1).status,200);f.bots.step(3,{domain:'diplomacy'});assert.equal(f.q('SELECT status FROM family_alliances').status,'accepted');
 assert.equal(f.call('admin/gifts',{key:'autonomy-gift-key',message:'Normal gift collection',rewards:{cash:1000,xp:100}},1).status,200);
 f.bots.step(2,{domain:'rewards'});assert.equal(f.q('SELECT last_action FROM bot_players WHERE user_id=2').last_action,'gifts/collect');assert.equal(f.q('SELECT last_status FROM bot_players WHERE user_id=2').last_status,200);
 assert.equal(f.call('admin/gifts',{rewards:{cash:1},confirm:true},2).status,403);
});
