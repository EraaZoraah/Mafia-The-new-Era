import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {handValue} from '../casino.js';
let seq=0;const request=b=>({...b,requestKey:'casino_test_key_'+(++seq)});
const start=(f,game='higher-lower',stake=10000)=>f.call('casino/start',request({game,stake}));
const move=(f,r,action)=>f.call('casino/action',request({id:r.id,revision:r.revision,move:action}));
function setup(f,player,dealer,deck){f.high(true);const r=start(f,'blackjack').body.round;f.run("UPDATE casino_rounds SET status='active',paid=0,outcome='',payout=0,state=? WHERE id=?",JSON.stringify({player,dealer,deck}),r.id);return f.call('casino').body.round;}
test('blackjack ace values and face cards',()=>{assert.equal(handValue([0,13,8]),21);assert.equal(handValue([0,9]),21);assert.equal(handValue([12,25,1]),22);assert.equal(handValue([0,13,26,39]),14);});
test('stakes, saved rounds, cross-player ownership and hidden blackjack state',t=>{
 const f=fixture(t);for(const stake of [0,-1,1001.5,1000001,'1000'])assert.equal(start(f,'blackjack',stake).status,400);
 f.high(true);const r=start(f,'blackjack').body.round;assert.equal(r.status,'active');assert.equal(r.dealer[1],null);assert.equal(r.dealerValue,null);assert.equal('deck' in r,false);assert.equal('state' in r,false);assert.equal(start(f).status,409);f.reset();assert.equal(f.call('casino').body.round.id,r.id);
 assert.equal(f.call('casino/action',request({id:r.id,revision:r.revision,move:'stand'}),2).status,404);
 f.run('UPDATE users SET prison_until=? WHERE id=1',f.time()+60000);assert.equal(move(f,r,'stand').status,409);
});
test('higher-lower probability, win, one debit and one payout despite retries',t=>{
 const f=fixture(t),cash=f.q('SELECT cash FROM users WHERE id=1').cash,b=request({game:'higher-lower',stake:10000});const r=f.call('casino/start',b).body.round;assert.equal(r.rank,1);assert.equal(f.call('casino/start',b).body.round.id,r.id);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash-10000);assert.equal(move(f,r,'lower').status,400);
 f.high(true);const a=request({id:r.id,revision:r.revision,move:'higher'}),result=f.call('casino/action',a).body.round;assert.equal(result.payout,10400);assert.equal(result.paid,true);assert.equal(f.call('casino/action',a).body.round.payout,10400);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash+400);assert.equal(f.call('casino/action',{...a,move:'lower'}).status,409);assert.equal(move(f,r,'higher').status,409);
});
test('higher-lower tie loses and cooldown enforced',t=>{const f=fixture(t),r=start(f).body.round;assert.equal(move(f,r,'higher').body.round.payout,0);assert.equal(start(f).status,429);f.advance(2000);assert.equal(start(f).status,200);});
test('blackjack bust, dealer soft-17, push and stale hit rejection',t=>{
 const f=fixture(t);let r=setup(f,[9,8],[9,6],[4]);assert.equal(move(f,r,'hit').body.round.outcome,'Bust');f.advance(2000);
 r=setup(f,[9,6],[0,5],[9]);let result=move(f,r,'stand').body.round;assert.equal(result.outcome,'Push');assert.equal(result.dealer.length,2);assert.equal(result.payout,10000);f.advance(2000);
 r=setup(f,[1,2],[9,6],[9,3]);result=move(f,r,'hit').body.round;assert.equal(result.playerValue,9);assert.equal(result.status,'active');assert.equal(result.dealer[1],null);assert.equal(move(f,r,'hit').status,409);assert.equal(move(f,result,'stand').body.round.outcome,'Dealer wins');
});
test('blackjack dealer bust, 21 auto stand, natural payouts and dealer natural',t=>{
 const f=fixture(t);let r=setup(f,[9,7],[9,5],[9]);assert.equal(move(f,r,'stand').body.round.payout,20000);f.advance(2000);r=setup(f,[9,8],[9,6],[1]);assert.equal(move(f,r,'hit').body.round.playerValue,21);
 // Select shuffle swaps to deal known opening cards through the real start endpoint.
 function deal(opening){const g=fixture(t),target=Array.from({length:52},(_,i)=>i);for(let i=0;i<4;i++){const pos=51-i,j=target.indexOf(opening[i]);[target[pos],target[j]]=[target[j],target[pos]];}const working=Array.from({length:52},(_,i)=>i),swaps=[];for(let i=51;i>0;i--){const j=working.indexOf(target[i]);swaps.push(j);[working[i],working[j]]=[working[j],working[i]];}g.high(()=>swaps.shift());return start(g,'blackjack').body.round;}
 let result=deal([0,9,6,7]);assert.equal(result.outcome,'Blackjack');assert.equal(result.payout,25000);assert.equal(result.paid,true);
 result=deal([6,7,0,9]);assert.equal(result.outcome,'Dealer blackjack');assert.equal(result.payout,0);
 result=deal([0,9,13,22]);assert.equal(result.outcome,'Push');assert.equal(result.payout,10000);
});
test('cash-cap returns remain durable and collect once after wallet space is available',t=>{
 const f=fixture(t),r=start(f).body.round;f.high(true);f.run('UPDATE users SET cash=1000000000000000 WHERE id=1');const done=move(f,r,'higher').body.round;assert.equal(done.paid,false);assert.equal(done.payout,10400);assert.equal(move(f,done,'collect').status,409);assert.equal(start(f).status,409);f.reset();f.run('UPDATE users SET cash=0 WHERE id=1');assert.equal(move(f,done,'collect').body.round.paid,true);assert.equal(move(f,done,'collect').status,409);assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,10400);
});
