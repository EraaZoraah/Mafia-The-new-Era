import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {menu} from '../public/navigation.js';
import {renderNavigation} from '../public/navigation-ui.js';
import {staffChanges,renderStaffChanges} from '../public/staff-changes.js';
import {silentNotification} from '../public/feedback.js';
import {fixture} from './helpers/game-fixture.js';
import {gameKnowledge} from '../game-knowledge.js';

test('staff summaries show changed fields only, including keyed collections',()=>{
 assert.deepEqual(staffChanges({cash:{before:10,after:20},bank:{before:40,after:40}}),[{field:'cash',before:10,after:20}]);
 const diff=staffChanges({section:'employees',before:[{item_id:'runner',quantity:2,income_at:1}],after:[{item_id:'runner',quantity:3,income_at:2}]});assert.deepEqual(diff,[{field:'employees.runner.quantity',before:2,after:3}]);
 assert.deepEqual(staffChanges({before:{family:{name:'A',treasury:10}},after:{family:{name:'A',treasury:25}}}),[{field:'family.treasury',before:10,after:25}]);
 assert.deepEqual(staffChanges({investment:{before:{principal:100,rate_bps:800},after:{principal:100,rate_bps:700}},note:'No cash moved'}),[{field:'investment.rate_bps',before:800,after:700}]);
 const esc=s=>String(s).replaceAll('<','&lt;').replaceAll('>','&gt;');const html=renderStaffChanges({cash:{before:100,after:200},email:{before:'old',after:'<script>'}},esc);assert.match(html,/Cash:/);assert.match(html,/\$200/);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('before'));
});
test('saving full staff form records only actual changed fields',t=>{
 const f=fixture(t),u=f.q('SELECT * FROM users WHERE id=2');
 assert.equal(f.call('admin/player',{id:2,changes:{cash:u.cash+123,bank:u.bank,xp:u.xp,health:u.health,familyId:1,familyRole:'member',possessions:[],cooldowns:[],revokeSessions:false,selected_title:''}}).status,200);
 const audit=JSON.parse(f.q('SELECT details FROM owner_audit WHERE target_id=2 ORDER BY id DESC LIMIT 1').details);
 assert.deepEqual(Object.keys(audit),['cash']);assert.equal(staffChanges(audit).length,1);
});
test('receiving respect updates standing without a popup; old notices are quiet, attacks stay visible',t=>{
 const f=fixture(t);const before=f.q('SELECT respect_received FROM users WHERE id=2').respect_received;
 assert.equal(f.call('respect/give',{target:'MemberOne'}).status,200);
 assert.equal(f.q('SELECT respect_received FROM users WHERE id=2').respect_received,before+1);
 assert.equal(f.q("SELECT COUNT(*) n FROM player_notifications WHERE user_id=2 AND title='Respect received'").n,0);
 assert.equal(silentNotification({title:'Respect received'}),true);assert.equal(silentNotification({title:'You were attacked'}),false);
});
test('navigation keeps all routes unique, staff protected, artwork present and Luca aligned',()=>{
 const entries=menu.flatMap(x=>Array.isArray(x)?[x]:x.items),ids=entries.map(x=>x[0]);assert.equal(ids.length,new Set(ids).size);
 for(const id of ids)assert.ok(existsSync(new URL('../public/icons/menu-'+id+'.svg',import.meta.url)),id);
 const markup=renderNavigation({user:{role:'player'},tab:'airport',openGroups:new Set(['city'])});assert.ok(!markup.includes('data-tab="admin"'));assert.ok(!markup.includes('data-tab="tickets"'));assert.match(markup,/data-menu-group="city"[^>]* open/);assert.match(markup,/data-tab="airport"[^>]*aria-current="page"/);
 const staffMarkup=renderNavigation({user:{role:'admin'},tab:'admin'});assert.match(staffMarkup,/Admin Panel/);assert.match(staffMarkup,/data-tab="tickets"[^>]*>[\s\S]*?<span class="ticket-label">Support tickets<\/span>/); // Count updates reuse this label instead of appending a duplicate.

 const knowledge=gameKnowledge();for(const id of ids.filter(x=>!['admin','tickets'].includes(x)))assert.ok(knowledge.some(k=>k.tab===id),id);
 const groups=menu.filter(x=>x.items);for(const g of groups)assert.ok(existsSync(new URL('../public/icons/menu-'+g.id+'.svg',import.meta.url)));
 const newIcons=['family-hub','logistics','community'].map(id=>readFileSync(new URL('../public/icons/menu-'+id+'.svg',import.meta.url),'utf8'));assert.equal(new Set(newIcons).size,3);
});
test('armory staff edits summarize only changed ammunition and weapon quantities',t=>{
 const f=fixture(t),before=f.call('admin/logistics?scope=personal&id=2').body;
 const weapons=f.db.prepare("SELECT weapon_id id,quantity FROM armory_weapons WHERE scope='personal' AND owner_id=2").all();
 assert.equal(f.call('admin/logistics',{scope:'personal',targetId:2,ammo:before.ammo+1,weapons}).status,200);
 const audit=JSON.parse(f.q('SELECT details FROM owner_audit WHERE target_id=2 ORDER BY id DESC LIMIT 1').details);
 assert.deepEqual(staffChanges(audit),[{field:'ammo',before:before.ammo,after:before.ammo+1}]);
});
