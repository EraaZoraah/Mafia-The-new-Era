import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {skins} from '../skins.js';
import {shopProducts} from '../shop.js';
const style={theme:'gold',emblem:'crown',banner:'skyline',bio:'',title:''};
test('skin entitlement gates selection, matching frames remain interchangeable, and legacy portraits migrate on read',t=>{
 const f=fixture(t);assert.equal(skins.length,22);assert.equal(skins.filter(s=>!s.cents&&!s.ownerOnly).length,6);assert.equal(skins.filter(s=>s.cents===399).length,12);assert.equal(skins.filter(s=>s.cents===599).length,2);skins.forEach((s,i)=>assert.equal(s.gender,i%2?'female':'male'));
 assert.equal(f.call('profile/settings',{...style,avatar:'godfather'},2).status,400);
 const b={recipient:'MemberOne',product:'skin-godfather',key:'skin-grant-test-0001',reason:'Skin test'};assert.equal(f.call('admin/shop/grant',b).status,200);assert.equal(f.call('admin/shop/grant',b).status,200);
 assert.equal(f.call('profile/settings',{...style,avatar:'godfather',frame:'skin-godfather'},2).status,200);f.reset();assert.equal(f.call('profiles/2',undefined,2).body.player.appearance.skin.id,'godfather');
 assert.equal(f.call('profile/settings',{...style,avatar:'street-fixer',frame:'skin-godfather'},2).status,200);assert.equal(f.call('profile/settings',{...style,avatar:'godmother'},2).status,400);
 assert.equal(f.call('admin/shop/grant',{...b,product:'complete-collection',key:'skin-grant-complete'}).status,200);assert.equal(f.call('profile/settings',{...style,avatar:'godmother'},2).status,400);
 assert.ok(shopProducts.filter(p=>['champagne','midnight','velvet','laurel','platinum','artdeco'].includes(p.id)).every(p=>p.cents===199));
});
test('consumable grants are audited, idempotent and reject overflow atomically',t=>{
 const f=fixture(t);f.run('UPDATE users SET cash=5000,xp=0,energy=0 WHERE id=2');const b={recipient:'MemberOne',product:'energy-refill',key:'supply-grant-test-01',reason:'Supply test'};
 assert.equal(f.call('admin/shop/grant',b,2).status,403);assert.equal(f.call('admin/shop/grant',b).status,200);assert.equal(f.call('admin/shop/grant',b).status,200);assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,500);
 f.run('UPDATE users SET energy=1000000000 WHERE id=2');assert.equal(f.call('admin/shop/grant',{...b,key:'supply-grant-test-02'}).status,409);assert.equal(f.q('SELECT COUNT(*) n FROM shop_grants').n,1);f.run('UPDATE users SET energy=500 WHERE id=2');
 f.run('UPDATE users SET cash=1000000000000000 WHERE id=2');assert.equal(f.call('admin/shop/grant',{...b,product:'cash-reserve',key:'supply-grant-test-03'}).status,409);
 f.run('UPDATE users SET cash=5000 WHERE id=2');assert.equal(f.call('admin/shop/grant',{...b,product:'cash-reserve',key:'supply-grant-test-04'}).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,25005000);
});
test('Owner and Admin personal balances and XP are excluded from world totals for both staff roles',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=3");f.run('UPDATE users SET cash=id*100,bank=id*10,xp=id*1000');
 for(const staffId of [1,3]){const d=f.call('admin/population',undefined,staffId).body;assert.equal(d.staff.owner.cash,'100');assert.equal(d.staff.admin.cash,'300');assert.equal(d.staff.combined.xp,'4000');assert.equal(d.playerCash,'600');assert.equal(d.playerBank,'60');assert.equal(d.totalXp,'6000');assert.equal(d.money,(600n+60n+BigInt(d.familyTreasury)).toString());
 const e=f.call('admin/economy',undefined,staffId).body;assert.equal(e.totals.players.count,2);assert.equal(e.totals.players.cash,'600');assert.equal(e.totals.players.xp,'6000');assert.equal(e.staff.combined.cash,'400');}
 assert.equal(f.call('admin/population',undefined,2).status,403);assert.equal(f.call('admin/economy',undefined,2).status,403);
});
