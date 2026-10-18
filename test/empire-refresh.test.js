import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {progression,prestigeThreshold,ranks} from '../progression.js';
import {catalog} from '../catalog.js';
import {shopProducts} from '../shop.js';
const style={theme:'gold',emblem:'crown',banner:'skyline',bio:'',title:''};

test('prestige XP gaps grow while income increases 7.5 percent per distinction',()=>{
 let previous=ranks.at(-1).xp-ranks.at(-2).xp;
 for(let n=1;n<=30;n++){
  const gap=prestigeThreshold(n)-prestigeThreshold(n-1);
  assert.ok(gap>previous);previous=gap;
  assert.equal(progression(prestigeThreshold(n)-1).distinctions,n-1);
  assert.equal(progression(prestigeThreshold(n)).distinctions,n);
  assert.ok(Math.abs(progression(prestigeThreshold(n)).incomeMultiplier/progression(prestigeThreshold(n-1)).incomeMultiplier-1.075)<1e-10);
 }
});
test('paid energy survives settlement, reload and promotion; retries never duplicate it',t=>{
 const f=fixture(t);f.run('UPDATE users SET energy=1000,xp=0 WHERE id=2');
 const body={recipient:'MemberOne',product:'energy-vault',key:'energy-overflow-test-01',reason:'Regression test'};
 assert.equal(f.call('admin/shop/grant',body).status,200);
 assert.equal(f.call('admin/shop/grant',body).status,200);
 assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,2000);
 f.advance(3600000);f.settle(2);f.reset();
 assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,2000);
 assert.equal(f.call('admin/shop/grant',{...body,product:'xp-boost',key:'energy-overflow-test-02'}).status,200);
 assert.equal(f.q('SELECT energy FROM users WHERE id=2').energy,2000);
 for(const field of ['energy','xp','cash'])assert.equal(shopProducts.filter(p=>p.rewards&&Object.keys(p.rewards).length===1&&p.rewards[field]).length,3);
});
test('Owner skins and frames are not available to players or Admin, and banners require ownership',t=>{
 const f=fixture(t);f.run("UPDATE users SET role='admin' WHERE id=3");
 for(const id of [2,3]){
  assert.equal(f.call('profile/settings',{...style,avatar:'owner-god',frame:'owner-diamond'},id).status,400);
  assert.ok(!f.call('profiles/'+id,undefined,id).body.options.avatars.some(s=>s.ownerOnly));
 }
 assert.equal(f.call('profile/settings',{...style,avatar:'owner-god',frame:'owner-diamond'}).status,200);
 const a=catalog.find(x=>x.category==='home'),banner='asset:home:'+a.id;
 assert.equal(f.call('profile/settings',{...style,banner},2).status,400);
 f.run('INSERT INTO possessions(user_id,category,item_id,quantity,acquired_at,income_at) VALUES(2,?,?,1,?,?)',a.category,a.id,f.time(),f.time());
 assert.equal(f.call('profile/settings',{...style,banner},2).status,200);
 assert.equal(f.call('profiles/2').body.player.appearance.bannerImage,a.image);
 f.run('DELETE FROM possessions WHERE user_id=2');
 assert.equal(f.call('profiles/2').body.player.appearance.bannerImage,'/images/city-new-york.png');
});


test('family territory income accrues once, caps offline time and follows ownership',t=>{
 const f=fixture(t);f.call('me');
 f.run("INSERT INTO family_assets VALUES(1,'territory-block',1)");
 const start=f.q('SELECT treasury FROM families WHERE id=1').treasury;
 f.advance(3600000);f.call('me');
 const hour=f.q('SELECT treasury FROM families WHERE id=1').treasury-start;
 assert.equal(hour,200000);
 f.call('me');assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,start+hour);
 f.advance(48*3600000);f.call('me');
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,start+hour*25);
 f.run("UPDATE family_assets SET family_id=2 WHERE item_id='territory-block'");
 const other=f.q('SELECT treasury FROM families WHERE id=2').treasury;
 f.advance(3600000);f.call('me');
 assert.equal(f.q('SELECT treasury FROM families WHERE id=1').treasury,start+hour*25);
 assert.equal(f.q('SELECT treasury FROM families WHERE id=2').treasury,other+hour);
 f.reset();f.call('me');assert.equal(f.q('SELECT treasury FROM families WHERE id=2').treasury,other+hour);
});
