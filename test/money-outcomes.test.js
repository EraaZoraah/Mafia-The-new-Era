import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {MAX_CASH,MAX_XP,drawAmount} from '../money.js';
import {outcomeImage} from '../public/outcome-images.js';
test('expanded wallets accept exact transfers above the old cap and reject overflow without changing XP limits',t=>{
 const f=fixture(t);assert.equal(MAX_CASH,1e15);f.run('UPDATE users SET cash=?,bank=0,xp=0 WHERE id=2',MAX_CASH);f.run('UPDATE users SET cash=0,bank=0,xp=0 WHERE id=4');
 const b={recipient:'Outsider',kind:'cash',amount:MAX_CASH,requestKey:'large-transfer-test-01'};
 assert.equal(f.call('transfers',b,2).status,200);assert.equal(f.q('SELECT cash FROM users WHERE id=4').cash,MAX_CASH);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,0);assert.equal(f.call('transfers',b,2).status,200);
 f.run('UPDATE users SET cash=10 WHERE id=2');assert.equal(f.call('transfers',{...b,amount:1,requestKey:'large-transfer-test-02'},2).status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=2').cash,10);
 assert.equal(f.call('admin/player',{id:2,changes:{cash:MAX_CASH,xp:MAX_XP}}).status,200);assert.equal(f.call('admin/player',{id:2,changes:{xp:MAX_XP+1}}).status,400);assert.equal(f.call('admin/player',{id:2,changes:{cash:MAX_CASH+1}}).status,400);
});
test('large random payouts stay exact and within crypto-supported bounds',()=>{for(let i=0;i<100;i++){const v=drawAmount(0,MAX_CASH);assert.ok(Number.isSafeInteger(v)&&v>=0&&v<=MAX_CASH)}assert.equal(drawAmount(MAX_CASH,MAX_CASH),MAX_CASH);assert.throws(()=>drawAmount(-1,4));});
test('world totals and economy flows remain exact above the safe-number aggregate threshold',t=>{
 const f=fixture(t);for(let i=0;i<12;i++){f.run('UPDATE users SET cash=? WHERE id=2',i%2?0:MAX_CASH);f.run('UPDATE users SET cash=? WHERE id=4',i%2?0:MAX_CASH);}
 const d=f.call('admin/economy/activity').body;const flow=d.flows.find(x=>x.source==='system'&&x.scope==='player');assert.ok(flow);assert.ok(BigInt(flow.earned)>BigInt(Number.MAX_SAFE_INTEGER));assert.equal(typeof flow.earned,'string');
});
test('generic outcomes never borrow an unrelated building image, while purchases retain the bought item',()=>{
 assert.equal(outcomeImage({route:'profile/settings',contextImage:'/images/family-compound-palace.jpg'}),'/images/outcome-success.png');
 assert.equal(outcomeImage({route:'assets/buy',contextImage:'/images/car-fiat.jpg'}),'/images/car-fiat.jpg');
 assert.equal(outcomeImage({error:true,image:'/images/hero.jpg'}),'/images/outcome-failed.png');
 assert.equal(outcomeImage({persistent:true,title:'New notification',image:'/images/scene-families.jpg'}),'/images/outcome-notice.png');
 assert.equal(outcomeImage({persistent:true,title:'You have been arrested',image:'/images/scene-arrest.jpg'}),'/images/scene-arrest.jpg');
});

test("profile response artwork cannot override generic success",()=>{assert.equal(outcomeImage({route:"profiles/update",image:"/images/family-compound-estate.jpg"}),"/images/outcome-success.png")});
