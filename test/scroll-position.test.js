import test from 'node:test';
import assert from 'node:assert/strict';
import {installScrollPosition} from '../public/scroll-position.js';

function fixture(){
 const events=new Map(),frames=new Map(),side={scrollTop:75};let clock=0,view='casino',height=3000,mutation,next=0;
 const win={scrollX:0,scrollY:1200,performance:{now:()=>clock},requestAnimationFrame:f=>{frames.set(++next,f);return next;},cancelAnimationFrame:id=>frames.delete(id),scrollTo:p=>{win.scrollX=p.left;win.scrollY=Math.min(p.top,height);},MutationObserver:class{constructor(f){mutation=f;}observe(){}disconnect(){}}};
 const doc={querySelector:s=>s==='.sidebar'?side:{},addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
 const guard=installScrollPosition({getView:()=>view,win,doc});
 const flush=()=>{for(const [id,f] of [...frames]){frames.delete(id);f();}};
 const button={tagName:'BUTTON',closest:s=>s==='button,input,select,form,summary,a'?button:s==='#content,dialog'?{}:null};
 return {guard,win,side,flush,mutate:()=>{mutation();flush();},action:()=>events.get('click')({target:button}),event:(n,e={})=>events.get(n)?.(e),shorten:()=>{height=0;win.scrollY=0;},expand:()=>height=3000,view:v=>view=v,time:v=>clock=v};
}

test('same-page action survives temporary empty views, later content and image loading',()=>{
 const f=fixture();f.action();f.shorten();f.mutate();assert.equal(f.win.scrollY,0);
 f.guard.capture();f.expand();f.mutate();assert.equal(f.win.scrollY,1200);assert.equal(f.side.scrollTop,75);
 f.win.scrollY=0;f.event('load');f.flush();assert.equal(f.win.scrollY,1200);
});

test('user scrolling, keyboard navigation and scrollbar dragging override restoration',()=>{
 for(const [name,event] of [['wheel',{}],['touchmove',{}],['keydown',{key:'PageDown'}],['pointerdown',{type:'pointerdown',target:{closest:()=>null}}]]){
  const f=fixture();f.action();f.event(name,event);f.win.scrollY=850;f.mutate();assert.equal(f.win.scrollY,850,name);
 }
});

test('page changes and deliberate navigation do not restore another view position',()=>{
 const f=fixture();f.action();f.view('bank');f.win.scrollY=0;f.mutate();assert.equal(f.win.scrollY,0);
 const g=fixture();g.action();const link={tagName:'A',closest:s=>s==='button,input,select,form,summary,a'||s.includes('a[href]')?link:null};g.event('click',{target:link});g.win.scrollY=10;g.mutate();assert.equal(g.win.scrollY,10);
});

test('expired sessions and teardown cannot snap a later page back',()=>{
 const f=fixture();f.action();f.time(31000);f.win.scrollY=20;f.mutate();assert.equal(f.win.scrollY,20);
 f.guard.capture();f.guard.disconnect();f.win.scrollY=80;f.mutate();assert.equal(f.win.scrollY,80);
});
