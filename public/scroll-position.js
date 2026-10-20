// Keep same-page actions in place while asynchronous views replace their content.
// Explicit navigation and user scrolling always take precedence.
export function installScrollPosition({getView,win=window,doc=document}){
 let pending=null,frame=null;
 const now=()=>win.performance.now();
 const cancel=()=>{pending=null;if(frame!==null)win.cancelAnimationFrame(frame);frame=null;};
 const capture=()=>{
  const view=getView();
  if(pending&&pending.view===view&&now()<pending.expires)return;
  pending={view,x:win.scrollX,y:win.scrollY,side:doc.querySelector('.sidebar')?.scrollTop||0,expires:now()+30000};
 };
 const restore=()=>{
  frame=null;if(!pending)return;
  if(pending.view!==getView()||now()>=pending.expires){cancel();return;}
  // The document may temporarily be shorter than the saved offset. Keep the
  // original target until later mutations/image loads make it reachable again.
  if(win.scrollX!==pending.x||Math.abs(win.scrollY-pending.y)>.5)win.scrollTo({left:pending.x,top:pending.y,behavior:'instant'});
  const side=doc.querySelector('.sidebar');if(side)side.scrollTop=pending.side;
 };
 const schedule=()=>{if(pending&&frame===null)frame=win.requestAnimationFrame(restore);};
 const intentional='[data-tab],a[href],[data-staff-jump],[data-shop-section],[data-plan-edit],[data-replay],[data-family],[data-edit],#edit-profile';
 const action=event=>{
  const el=event.target?.closest?.('button,input,select,form,summary,a');if(!el){if(event.type==='pointerdown')cancel();return;}
  if(el.closest(intentional)||el.tagName==='SUMMARY'){cancel();return;}
  if(el.closest('dialog')&&pending){schedule();return;}
  if(!el.closest('#content,dialog'))return;
  capture();
 };
 const key=event=>{if(['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key)&&!event.target?.closest?.('input,textarea,select,[contenteditable]'))cancel();};
 for(const name of ['pointerdown','click','submit','change'])doc.addEventListener(name,action,true);
 for(const name of ['wheel','touchmove'])doc.addEventListener(name,cancel,{capture:true,passive:true});
 doc.addEventListener('keydown',key,true);doc.addEventListener('load',schedule,true);
 const observer=new win.MutationObserver(schedule);observer.observe(doc.querySelector('#app'),{childList:true,subtree:true});
 return {capture,cancel,restore:schedule,disconnect(){cancel();observer.disconnect();for(const name of ['pointerdown','click','submit','change'])doc.removeEventListener(name,action,true);for(const name of ['wheel','touchmove'])doc.removeEventListener(name,cancel,true);doc.removeEventListener('keydown',key,true);doc.removeEventListener('load',schedule,true);}};
}
