import {text as t} from './localization.js';

// Keep temporary empty input intact so a player can replace an existing number.
export function boundedNumber(raw,min='',max='',step='any',commit=false){
 if(String(raw).trim()==='')return raw;
 let n=Number(raw);if(!Number.isFinite(n))return raw;
 const lo=min===''?-Infinity:Number(min),hi=max===''?Infinity:Number(max);
 if(Number.isFinite(hi))n=Math.min(hi,n);
 if(commit){
  if(Number.isFinite(lo))n=Math.max(lo,n);
  const interval=Number(step);
  if(interval>0&&Number.isFinite(interval)){
   const base=Number.isFinite(lo)?lo:0;
   n=Number((base+Math.round((n-base)/interval)*interval).toPrecision(15));
   if(Number.isFinite(hi)&&n>hi)n=base+Math.floor((hi-base)/interval)*interval;
   if(Number.isFinite(lo))n=Math.max(lo,n);
  }
 }
 return n;
}

export function mountInputLimits(root){
 const hints=new WeakMap();let next=0;
 const eligible=e=>e?.matches?.('input[type="number"]');
 function hint(input){
  if(!eligible(input)||!input.hasAttribute('max'))return;
  let node=hints.get(input);
  if(!node){
   node=root.createElement('small');node.className='input-limit-hint';node.id='input-limit-'+(++next);
   node.setAttribute('aria-live','polite');input.after(node);hints.set(input,node);
   input.setAttribute('aria-describedby',[input.getAttribute('aria-describedby'),node.id].filter(Boolean).join(' '));
  }
  const label=t('Max')+': '+Number(input.max).toLocaleString('en-US');
  if(node.dataset.maximum!==input.max){node.dataset.maximum=input.max;node.textContent=label;node.classList.remove('adjusted')}
  if(!input.placeholder)input.placeholder=label;
  return node;
 }
 function normalize(input,commit){
  if(!eligible(input)||input.disabled||input.readOnly)return;
  const before=input.value,value=boundedNumber(before,input.min,input.max,input.getAttribute('step')||'1',commit);
  if(String(value)!==before){
   input.value=String(value);const node=hint(input);
   if(node){node.textContent=t('Adjusted to limit')+': '+Number(value).toLocaleString('en-US')+' · '+t('Max')+': '+Number(input.max).toLocaleString('en-US');node.classList.add('adjusted')}
  }
  if(input.validity.valid)input.removeAttribute('aria-invalid');
 }
 const refresh=()=>root.querySelectorAll('input[type="number"][max]').forEach(hint);
 refresh();
 const observer=new MutationObserver(refresh);observer.observe(root.body,{childList:true,subtree:true,attributes:true,attributeFilter:['max']});
 root.addEventListener('input',e=>normalize(e.target,false),true);
 root.addEventListener('change',e=>normalize(e.target,true),true);
 root.addEventListener('focusout',e=>normalize(e.target,true),true);
 // Native validity runs before submit; normalize all numeric fields before a
 // submit-button click or Enter, including fields set by another UI control.
 function normalizeForm(form){form?.querySelectorAll('input[type="number"]').forEach(e=>normalize(e,true))}
 root.addEventListener('click',e=>{const b=e.target.closest?.('button,input[type="submit"]');if(b?.form&&b.type==='submit')normalizeForm(b.form)},true);
 root.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT')normalizeForm(e.target.form)},true);
 root.addEventListener('invalid',e=>{
  const input=e.target;input.setAttribute('aria-invalid','true');
  for(let d=input.closest('details');d;d=d.parentElement?.closest('details'))d.open=true;
  const form=input.form;if(!form)return;
  let summary=form.querySelector('.form-validation-summary');
  if(!summary){summary=root.createElement('div');summary.className='form-validation-summary';summary.setAttribute('role','alert');form.prepend(summary)}
  const label=input.labels?.[0]?.textContent?.trim().split('\n')[0]||input.name||t('Field');
  summary.textContent=t('Check the highlighted fields before saving')+': '+label+' — '+input.validationMessage;
 },true);
 root.addEventListener('submit',e=>e.target.querySelector('.form-validation-summary')?.remove(),true);
 return ()=>observer.disconnect();
}
