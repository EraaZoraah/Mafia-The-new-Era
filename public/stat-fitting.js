// Measure actual rendered text, including currency punctuation and the current font.
export function fittedStatSize(base, available, measured){
 if(!(base>0&&available>0&&measured>0))return base;
 return Math.min(base,Math.floor(base*Math.min(1,Math.max(0,available-1)/measured)*100)/100);
}

export function mountStatFitting(doc){
 const win=doc.defaultView,selector='.stat > b, .stat > strong, .coin-trade-record strong, .coin-price-value, .coin-position-value';
 const tracked=new Set();let frame=0,stopped=false;
 const resize=new win.ResizeObserver(()=>schedule());
 function fit(){
  frame=0;if(stopped)return;
  for(const el of tracked)if(!el.isConnected||! /\d/.test(el.textContent)){resize.unobserve(el);tracked.delete(el);el.classList.remove('fit-stat-number');el.style.removeProperty('font-size')}
  const values=[...doc.querySelectorAll(selector)].filter(el=>/\d/.test(el.textContent));
  for(const el of values){el.classList.add('fit-stat-number');if(!tracked.has(el)){tracked.add(el);resize.observe(el)}el.style.removeProperty('font-size')}
  const sizes=values.map(el=>{
   if(!el.getClientRects().length)return null;
   const range=doc.createRange();range.selectNodeContents(el);
   return {el,base:parseFloat(win.getComputedStyle(el).fontSize),available:el.clientWidth,measured:range.getBoundingClientRect().width};
  });
  for(const value of sizes){if(!value)continue;const {el,base,available,measured}=value,size=fittedStatSize(base,available,measured);if(size<base)el.style.fontSize=size+'px'}
 }
 function schedule(){if(!stopped&&!frame)frame=win.requestAnimationFrame(fit)}
 const mutation=new win.MutationObserver(schedule);
 mutation.observe(doc.body,{childList:true,subtree:true,characterData:true});
 win.addEventListener('resize',schedule);
 doc.fonts?.ready.then(schedule);doc.fonts?.addEventListener('loadingdone',schedule);
 schedule();
 return ()=>{stopped=true;win.cancelAnimationFrame(frame);mutation.disconnect();resize.disconnect();win.removeEventListener('resize',schedule);doc.fonts?.removeEventListener('loadingdone',schedule);tracked.clear()};
}
