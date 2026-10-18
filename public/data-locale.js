import {translateGenerated} from './generated-locale.js';
import {activeLanguage,t,createTranslator} from './i18n.js';
import {localeCatalog} from './locale-catalog.js';
const byId=new Map();for(const spec of localeCatalog){if(!byId.has(spec.id))byId.set(spec.id,[]);byId.get(spec.id).push(spec);}
export function localizeGameData(route,data,language=activeLanguage,translate=createTranslator(language)){
 if(language==='en'||!data||typeof data!=='object')return data;
 const walk=value=>{
  if(Array.isArray(value))return value.map(walk);if(!value||typeof value!=='object')return value;
  const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,walk(v)]));
  const id=typeof value.item_id==='string'?value.item_id:typeof value.spec_id==='string'?value.spec_id:value.id;
  const candidates=typeof id==='string'?byId.get(id)||byId.get(id.split(':').at(-1))||[]:[];
  // Both identity and authored text must match. Numeric player/family IDs, usernames,
  // bios, chat, support bodies and arbitrary family names are never translated.
  for(const spec of candidates){if(value.name===spec.name){out.name=translate(spec.name);if(typeof value.tier==='string')out.tier=translate(value.tier);if(Array.isArray(out.items))out.items=out.items.map(item=>({...item,name:typeof item.name==='string'?translate(item.name):item.name}));for(const field of ['description','title','unlock','frameName'])if(value[field]&&value[field]===spec[field])out[field]=translate(spec[field]);}
   if(spec.title&&value.name===spec.title)out.name=translate(spec.title);
  }
  if(value.season_id&&value.medal&&typeof value.title==='string')out.title=translate(value.title);
  if(value.username&&value.rank&&typeof value.title==='string')out.title=translate(value.title);
  return out;
 };
 const out=walk(data);
 if(route.split('?')[0]==='calendar'&&out.description)out.description=translate(out.description);
 if(route.split('?')[0]==='bulletins'&&out.entries)out.entries=out.entries.map(b=>b.systemKind?({...b,title:translateGenerated(b.title,language),body:b.body.split('\n').map(line=>translateGenerated(line,language)).join('\n')}):b);
 if(route.split('?')[0]==='news'&&out.notes)out.notes=out.notes.map(n=>({...n,date:translate(n.date),title:translate(n.title),items:n.items.map(i=>translate(i))}));
 if(route.split('?')[0]==='notifications')out.notifications=out.notifications?.map(n=>({...n,title:translateGenerated(n.title,language,false,!!n.systemKind),message:n.systemKind?n.message.split('\n').map(line=>translateGenerated(line,language)).join('\n'):/^(?:Event:|Announcement:|New support ticket)/.test(n.title)?n.message:translateGenerated(n.message,language)}));
 if(route.split('?')[0]==='me'&&out.events)out.events=out.events.map(e=>({...e,message:translateGenerated(e.message,language)}));
 if(route.startsWith('casino')){if(out.history)out.history=out.history.map(h=>({...h,outcome:translateGenerated(h.outcome,language),detail:translateGenerated(h.detail,language)}));if(out.round?.outcome)out.round.outcome=translateGenerated(out.round.outcome,language);if(out.round?.detail)out.round.detail=translateGenerated(out.round.detail,language);}

 for(const key of ['error','message','note','valuation'])if(typeof out[key]==='string')out[key]=translateGenerated(out[key],language);
 return out;
}
