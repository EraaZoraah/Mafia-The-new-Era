import {text as ltext} from './localization.js';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const technical=new Set(['user_id','family_id','income_at','income_remainder','respect_remainder','remainder','last_at']);
const key=r=>r&&typeof r==='object'?(r.item_id?`${r.category||''}:${r.item_id}`:r.coin??r.upgrade_id??r.weapon_id??r.id??r.kind):undefined;
export function staffChanges(raw){
 let data;try{data=typeof raw==='string'?JSON.parse(raw):raw}catch{return []}
 if(!data||typeof data!=='object')return [];
 const changes=[];
 function diff(a,b,path){
  if(equal(a,b))return;
  if(Array.isArray(a)||Array.isArray(b)){
   const left=a||[],right=b||[];
   if([...left,...right].every(r=>key(r)!==undefined)){
    const old=new Map(left.map(r=>[String(key(r)),r])),next=new Map(right.map(r=>[String(key(r)),r]));
    for(const id of new Set([...old.keys(),...next.keys()]))diff(old.get(id),next.get(id),[...path,id.replace(/^:/,'')]);
   }else changes.push({field:path.join('.'),before:a,after:b});
   return;
  }
  if((a&&typeof a==='object')||(b&&typeof b==='object')){
   for(const k of new Set([...Object.keys(a||{}),...Object.keys(b||{})]))if(!technical.has(k)&&!(k==='id'&&path.length>1))diff(a?.[k],b?.[k],[...path,k]);
   return;
  }
  changes.push({field:path.join('.'),before:a,after:b});
 }
 if(Object.hasOwn(data,'before')&&Object.hasOwn(data,'after'))diff(data.before,data.after,data.section?[data.section]:[]);
 else for(const [field,value] of Object.entries(data)){
  if(['reason','note','scope','targetId','shopGrant','payment','id'].includes(field)||field==='username'&&typeof value==='string')continue;
  if(value&&typeof value==='object'&&Object.hasOwn(value,'before')&&Object.hasOwn(value,'after'))diff(value.before,value.after,[field]);
  else if(value!==false&&value!==null)diff(undefined,value,[field]);
 }
 return changes;
}
export function renderStaffChanges(raw,esc){
 const labels={cash:'Cash',bank:'Bank',xp:'XP',pending_income:'Saved income',active_ms:'Active time (milliseconds)',quantity:'Quantity',condition_stars:'Condition stars',spec_id:'Artwork',vehicle_id:'Vehicle',item_id:'Item',family:'Family',employees:'Employees',crypto:'Crypto holdings',art:'Art collection',vehicles:'Stolen vehicles',extensions:'Compound extensions',territories:'City territories',racing:'Racing progress',income:'24-hour income cycle',treasury:'Treasury',possessions:'My possessions'};
 const format=(value,field)=>value===undefined||value===null?'—':typeof value==='number'?(/(?:^|\.)(cash|bank|treasury|pending_income|principal|basis|estimated_value)$/.test(field)?'$':'')+value.toLocaleString('en-US'):typeof value==='object'?JSON.stringify(value):String(value);
 const rows=staffChanges(raw);
 return rows.length?'<dl class="staff-change-list">'+rows.map(r=>'<div><dt>'+esc(r.field.split('.').map(k=>ltext(labels[k]||k.replaceAll('_',' '))).join(' › '))+':</dt><dd><span>'+esc(format(r.before,r.field))+'</span> <span aria-hidden="true">→</span> <strong>'+esc(format(r.after,r.field))+'</strong></dd></div>').join('')+'</dl>':'<p>'+esc(ltext('No changed fields.'))+'</p>';
}
