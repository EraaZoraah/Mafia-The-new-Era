import {t,activeLanguage} from './i18n.js';
const marker=i=>'\uE000'+i+'\uE001';
const encode=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>s.replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ','#39':"'"}[k]));
// Parse only the developer-authored template, before inserting any player data.
// Neither the DOM nor interpolated names/messages/ranks are searched or replaced.
function scanStatic(source,add){
 let text=0,cursor=0;
 while(cursor<source.length){const start=source.indexOf('<',cursor);if(start<0)break;
  if(!/[a-z/!]/i.test(source[start+1]||'')){cursor=start+1;continue;}
  add(text,start);let quote='',end=start+1;
  for(;end<source.length;end++){const ch=source[end];if(quote){if(ch===quote)quote='';}else if(ch==='"'||ch==="'")quote=ch;else if(ch==='>')break;}
  // Concatenated legacy HTML may end halfway through a tag. Never translate that tail.
  if(end===source.length)return;
  const tag=source.slice(start,end+1);for(const a of tag.matchAll(/\b(?:alt|title|placeholder|aria-label)\s*=\s*(["'])(.*?)\1/g)){const at=start+a.index+a[0].indexOf(a[2]);add(at,at+a[2].length);}
  text=end+1;cursor=text;
 }
 add(text,source.length);
}
function compile(parts){
 const source=parts.map((part,i)=>part+(i<parts.length-1?marker(i):'')).join(''),slots=[];
 const add=(start,end)=>{const raw=source.slice(start,end),trimmed=raw.trim();if(!/[A-Za-z]{2}/.test(trimmed.replace(/\uE000\d+\uE001/g,'')))return;slots.push({start,end,raw,key:decode(trimmed).replace(/\s+/g,' ').replace(/\uE000(\d+)\uE001/g,'{v$1}')});};
 scanStatic(source,add);return {source,slots};
}
const cache=new WeakMap();
export function templateKeys(parts){return compile(parts).slots.map(s=>s.key);}
export function makeHtmlTranslator(translate,enabled=true){return (parts,...values)=>{
 const strings=typeof parts==='string'?[parts]:parts;
 if(!enabled)return strings.reduce((out,s,i)=>out+s+(i<values.length?String(values[i]):''),'');
 let c=cache.get(strings);if(!c){c=compile(strings);if(typeof strings==='object')cache.set(strings,c);}
 const placeholders=Object.fromEntries(values.map((_,i)=>['v'+i,marker(i)]));let output=c.source;
 for(const s of [...c.slots].reverse()){const translated=translate(s.key,placeholders),replacement=translated===s.key?s.raw:((/^\s*/.exec(s.raw)||[''])[0]+encode(translated)+(/\s*$/.exec(s.raw)||[''])[0]);output=output.slice(0,s.start)+replacement+output.slice(s.end);}
 return output.replace(/\uE000(\d+)\uE001/g,(_,i)=>String(values[Number(i)]));
};}
export const html=makeHtmlTranslator(t,activeLanguage!=='en');
export function text(parts,...values){if(typeof parts==='string')return t(parts);const key=parts.map((s,i)=>s+(i<values.length?'{v'+i+'}':'')).join('');return t(key,Object.fromEntries(values.map((v,i)=>['v'+i,v])));}

export const label=value=>typeof value==='string'?t(value):value;
