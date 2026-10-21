import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {coins} from '../city-expansion.js';
import {chartSeries,openPosition,coinChart} from '../public/crypto-chart-ui.js';

test('four-hour crypto history retains every coin, ordered real quotes and both endpoints',t=>{
 const f=fixture(t),epoch=Math.floor(f.time()/300000);
 f.call('crypto');
 for(const c of coins)for(let i=0;i<=50;i++)f.run('INSERT OR REPLACE INTO crypto_history VALUES(?,?,?)',c.id,epoch-i,c.base+i);
 const cash=f.q('SELECT cash FROM users WHERE id=1').cash,d=f.call('crypto').body;
 assert.equal(d.history.length,coins.length*49);
 for(const c of coins){const p=chartSeries(d.history,c.id,epoch*300000);assert.equal(p.length,49);assert.equal(p[0].epoch,epoch-48);assert.equal(p.at(-1).epoch,epoch);const rendered=coinChart(c,d.history,epoch*300000,{money:String,date:String,esc:String});assert.equal((rendered.match(/class="chart-point"/g)||[]).length,49);assert.equal(rendered.match(/<polyline points="([^"]+)/)[1].split(' ').length,49);}
 assert.equal(f.q('SELECT cash FROM users WHERE id=1').cash,cash);
});

test('open-position values use remaining weighted basis and actual sell spread',()=>{
 assert.deepEqual(openPosition({quantity:60,basis:15180},{price:160,sell:158}),{quantity:60,basis:15180,average:253,marketValue:9600,saleValue:9480,gain:-5700,margin:-5700/15180*100});
 const p=openPosition({quantity:10,basis:10100},{price:1300,sell:1287});assert.equal(p.gain,2770);assert.equal(p.average,1010);
 assert.equal(openPosition({},{}).average,0);
});

test('partial or empty charts never invent quotes and exclude other coins or future data',()=>{
 const end=18000000,coin={id:'omerta',name:'Omerta',symbol:'OMR'},opts={money:n=>'$'+n,date:n=>String(n),esc:String};
 assert.match(coinChart(coin,[],end,opts),/Not enough recorded quotes/);
 const rows=[{coin:'omerta',epoch:60,price:100},{coin:'omerta',epoch:61,price:500},{coin:'crown',epoch:60,price:800},{coin:'omerta',epoch:59,price:100}];
 assert.equal(chartSeries(rows,'omerta',end).length,2);
 const chart=coinChart(coin,rows,end,opts);assert.match(chart,/polyline/);assert.doesNotMatch(chart,/NaN|Infinity/);assert.match(chart,/missing prices are not estimated/);
});
