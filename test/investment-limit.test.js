import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {investmentLimit} from '../investments.js';

test('10T investments enforce cash, active room, independent family cap and safe claims',t=>{
 const f=fixture(t);assert.equal(investmentLimit,10_000_000_000_000);
 f.run('UPDATE users SET cash=? WHERE id=1',investmentLimit*2);
 f.run('UPDATE families SET treasury=? WHERE id=1',investmentLimit*2);
 for(const scope of ['personal','family']){
  const a=f.call('investments').body.accounts.find(a=>a.scope===scope),q=a.quotes.at(-1);
  const body={scope,hours:q.hours,rateBps:q.rateBps,amount:investmentLimit-123};
  const opened=f.call('investments/open',body);assert.equal(opened.status,200);
  assert.equal(f.call('investments/open',{...body,amount:124}).status,409);
  assert.equal(f.call('investments/open',{...body,amount:123}).status,200);
  assert.equal(f.call('investments/open',{...body,amount:1}).status,409);
  assert.equal(f.call('investments').body.accounts.find(a=>a.scope===scope).activePrincipal,investmentLimit);
 }
 f.advance(72*3600000);
 assert.equal(f.call('investments').body.accounts[0].activePrincipal,investmentLimit,'matured positions still occupy room');
 for(const a of f.call('investments').body.accounts)for(const p of a.positions){
  const result=f.call('investments/claim',{scope:a.scope,id:p.id});assert.equal(result.status,200);
  assert.equal(result.body.interest,Math.floor(p.principal*p.rate_bps/10000));
  assert.equal(f.call('investments/claim',{scope:a.scope,id:p.id}).status,409);
 }
 f.run('UPDATE users SET cash=12 WHERE id=1');const q=f.call('investments').body.accounts[0].quotes[0];
 assert.equal(f.call('investments/open',{scope:'personal',amount:13,hours:q.hours,rateBps:q.rateBps}).status,400);
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,12);
});

test('10T migration preserves old positions, IDs and recorded interest and is repeatable',t=>{
 const f=fixture(t),q=f.call('investments').body.accounts[0].quotes[0];
 const opened=f.call('investments/open',{scope:'personal',amount:1000000,hours:q.hours,rateBps:q.rateBps});
 f.advance(6*3600000);f.call('investments/claim',{scope:'personal',id:opened.body.id});
 const before=JSON.stringify(f.db.prepare('SELECT * FROM investments').all());
 const schema=f.q("SELECT sql FROM sqlite_master WHERE name='investments'").sql;
 f.db.exec('ALTER TABLE investments RENAME TO old_positions;'+schema.replace('10000000000000','100000000000')+';INSERT INTO investments SELECT * FROM old_positions;DROP TABLE old_positions;');
 f.reset();assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM investments').all()),before);
 f.reset();assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM investments').all()),before);
 assert.match(f.q("SELECT sql FROM sqlite_master WHERE name='investments'").sql,/10000000000000\b/);
 f.run('UPDATE users SET cash=? WHERE id=1',investmentLimit);
 const next=f.call('investments').body.accounts[0].quotes[0];
 assert.equal(f.call('investments/open',{scope:'personal',amount:investmentLimit,hours:next.hours,rateBps:next.rateBps}).status,200);
});
