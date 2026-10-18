import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {milestones,SEASON_LENGTH} from '../legacy.js';
import {shopProducts} from '../shop.js';
const style={theme:'gold',emblem:'crown',banner:'skyline',bio:'',title:''};
test('avatars are curated, persistent and reject remote/NSFW upload paths; new colors stay locked',t=>{
 const f=fixture(t);assert.equal(milestones.length,38);assert.equal(new Set(milestones.map(x=>x.id)).size,milestones.length);
 const d=f.call('profiles/1').body;assert.equal(d.player.appearance.avatar,'street-runner');assert.equal(d.options.avatars.length,8);
 for(const avatar of ['https://external.test/nude.jpg','../secret','portrait-13','<script>'])assert.equal(f.call('profile/settings',{...style,avatar}).status,400);
 assert.equal(f.call('profile/settings',{...style,theme:'ruby'}).status,400);
 assert.equal(f.call('profile/settings',{...style,avatar:'portrait-06'}).status,200);assert.equal(f.call('profile/settings',style).status,200);f.reset();assert.equal(f.call('profiles/1').body.player.appearance.avatar,'city-broker');
 f.run('UPDATE users SET respect_received=100 WHERE id=1');assert.equal(f.call('profile/settings',{...style,theme:'ivory',title:'achievement:respect-100'}).status,200);f.run('UPDATE users SET respect_received=0 WHERE id=1');f.reset();assert.ok(f.call('profiles/1').body.options.themes.includes('ivory'));
});
test('shop grants require staff, allow staff selves and Owner gifts, and are idempotent audited cosmetics',t=>{
 const f=fixture(t),before=f.q('SELECT cash,xp,energy FROM users WHERE id=2'),b={recipient:'MemberOne',product:'patron-pack',key:'test-grant-key-0001',reason:'Test collection'};
 assert.equal(f.call('admin/shop/grant',b,2).status,403);assert.equal(f.call('admin/shop',undefined,2).status,403);
 assert.equal(f.call('profile/settings',{...style,frame:'laurel'},2).status,400);assert.equal(f.call('profile/settings',{...style,theme:'champagne'},2).status,400);
 assert.equal(f.call('shop/checkout',{product:'patron-pack',paid:true},2).status,503);
 assert.equal(f.call('admin/shop/grant',b).status,200);assert.equal(f.call('admin/shop/grant',b).status,200);assert.equal(f.q('SELECT COUNT(*) n FROM shop_grants').n,1);assert.equal(f.q('SELECT COUNT(*) n FROM owner_audit').n,1);assert.deepEqual(f.q('SELECT cash,xp,energy FROM users WHERE id=2'),before);
 assert.equal(f.call('admin/shop/grant',{...b,recipient:'DonOne'}).status,409);
 assert.equal(f.call('profile/settings',{...style,theme:'champagne',frame:'laurel',title:'shop:title:patron'},2).status,200);f.reset();assert.equal(f.call('profiles/2').body.player.appearance.frame,'laurel');
 f.run("UPDATE users SET role='admin' WHERE id=3");assert.equal(f.call('admin/shop/grant',{...b,recipient:'DonTwo'},3).status,200);assert.equal(f.call('admin/shop/grant',{...b,recipient:'DonOne',key:'test-admin-owner-gift'},3).status,200);
 assert.equal(f.call('admin/shop/grant',{...b,product:'complete-collection',key:'test-grant-key-full'}).status,200);assert.equal(f.q('SELECT COUNT(*) n FROM shop_entitlements WHERE user_id=2').n,9);assert.equal(f.call('admin/shop/grant',{...b,key:'test-grant-key-new'}).status,409);
 assert.ok(shopProducts.every(p=>Number.isSafeInteger(p.cents)&&p.cents>0));assert.equal(f.call('shop').body.checkoutEnabled,false);
 f.run("UPDATE users SET role='player' WHERE id=3");assert.equal(f.call('admin/shop/grant',{...b,key:'test-demoted-admin'},3).status,403);
});
test('season tick publishes once, awards once, preserves overflow and expires current honors',t=>{
 const f=fixture(t);f.tick();const s=f.call('seasons').body.current;assert.equal(f.q('SELECT COUNT(*) n FROM season_announcements').n,1);
 assert.equal(f.call('family/war/declare',{familyId:2}).status,200);assert.equal(f.call('family/raid',{familyId:2}).body.success,true);assert.equal(f.call('family/war/surrender',{},3).status,200);
 f.run('UPDATE families SET treasury=999999999999995 WHERE id=1');f.advance(s.ends_at-f.time());f.tick();const award=f.q('SELECT * FROM family_season_awards WHERE family_id=1');assert.equal(award.cash,100000000);assert.equal(award.paid,5);assert.equal(award.respect,100);assert.equal(f.call('family/respect').body.respect.total,100);
 const bulletin=f.call('bulletins').body.entries[0];assert.match(bulletin.body,/Family One/);assert.match(bulletin.body,/Which family will take the lead/);assert.equal(f.call('admin/bulletins',{id:bulletin.id,revision:1}).status,403);
 assert.equal(f.call('family').body.family.honor.medal,'🥇');assert.equal(f.call('profiles/1').body.player.family.honor.title,'Reigning Champions');
 f.reset();f.tick();assert.equal(f.q('SELECT COUNT(*) n FROM family_season_awards').n,1);assert.equal(f.q('SELECT COUNT(*) n FROM season_announcements').n,2);assert.equal(f.q('SELECT paid FROM family_season_awards').paid,5);
 f.run('UPDATE families SET treasury=treasury-10 WHERE id=1');f.tick();assert.equal(f.q('SELECT paid FROM family_season_awards').paid,15);
 f.advance(SEASON_LENGTH);f.tick();assert.equal(f.call('family').body.family.honor,null);assert.equal(f.call('family/respect').body.respect.total,100);assert.equal(f.q('SELECT COUNT(*) n FROM family_season_results').n,1);
});
test('tied seasonal winners split occupied prizes instead of creating duplicate prize money',t=>{
 const f=fixture(t),s=f.call('seasons').body.current;f.call('family/war/declare',{familyId:2});assert.equal(f.call('family/raid',{familyId:2}).body.success,true);f.advance(31*60000);assert.equal(f.call('family/raid',{familyId:1},3).body.success,true);f.advance(s.ends_at-f.time());f.tick();const awards=f.db.prepare('SELECT * FROM family_season_awards').all();assert.equal(awards.length,2);assert.deepEqual(awards.map(a=>a.cash),[75000000,75000000]);assert.deepEqual(awards.map(a=>a.respect),[80,80]);assert.ok(awards.every(a=>a.rank===1));
});
test('no-owner startup safely delays system announcement until an Owner exists',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='player'");f.tick();assert.equal(f.q('SELECT COUNT(*) n FROM bulletins').n,0);f.run("UPDATE users SET role='owner' WHERE id=1");f.tick();f.tick();assert.equal(f.q("SELECT COUNT(*) n FROM bulletins WHERE title<>'Welcome to the Mafia: The New Era beta' AND title NOT LIKE 'New features%' AND title<>'Beta event: Invite your inner circle'").n,1);
});

test('multiple pending season prizes share current treasury capacity safely',t=>{
 const f=fixture(t);f.run("INSERT INTO family_seasons(id,starts_at,ends_at,status) VALUES(0,1,2,'completed')");
 for(const season of [0,1])f.run("INSERT INTO family_season_awards VALUES(?,1,1,100000000,0,100,'Champion','Gold',1,2)",season);
 f.run('UPDATE families SET treasury=999999999999990 WHERE id=1');f.tick();assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,1000000000000000);assert.equal(f.q('SELECT SUM(paid) n FROM family_season_awards').n,10);
});

