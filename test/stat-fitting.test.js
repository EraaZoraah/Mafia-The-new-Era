import test from 'node:test';
import assert from 'node:assert/strict';
import {fittedStatSize} from '../public/stat-fitting.js';

test('large and negative totals fit available tile width without rounding their values',()=>{
 for(const base of [14,22,31,40])for(const available of [110,174,234,300])for(const measured of [85,220,410,900]){
  const size=fittedStatSize(base,available,measured);
  assert.ok(size<=base&&size>0);
  assert.ok(measured*size/base<=available+.01);
 }
});
test('short totals retain their designed size and hidden tiles wait for layout',()=>{
 assert.equal(fittedStatSize(31,234,100),31);
 assert.equal(fittedStatSize(31,0,400),31);
 assert.equal(fittedStatSize(31,234,0),31);
 assert.ok(fittedStatSize(31,300,400)>fittedStatSize(31,150,400));
});
