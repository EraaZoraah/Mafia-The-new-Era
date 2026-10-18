import {systemEventsDutch} from './nl-system-events.js';
import {dutch,activeLanguage,createTranslator} from './i18n.js';
import {generatedLanguageKeys} from './generated-language-keys.js';
import {localeCatalog} from './locale-catalog.js';
const nl=createTranslator('nl'),names=new Set(localeCatalog.flatMap(s=>[s.name,s.title,s.unlock]).filter(Boolean));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function compile(source){
 const groups=[],literals=[];let last=0;
 for(const m of source.matchAll(/(?:\{v\d+\})+/g)){literals.push(source.slice(last,m.index));groups.push([...m[0].matchAll(/\{(v\d+)\}/g)].map(x=>x[1]));last=m.index+m[0].length;}
 literals.push(source.slice(last));
 // Deterministic matching prevents catastrophic regex backtracking on long logs.
 const exec=text=>{if(!text.startsWith(literals[0]))return null;let at=literals[0].length;const result=[text];for(let i=0;i<groups.length;i++){const literal=literals[i+1];let end;if(i===groups.length-1){if(!text.endsWith(literal))return null;end=text.length-literal.length;}else{end=text.indexOf(literal,at);if(end<0)return null;}if(end<at)return null;result.push(text.slice(at,end));at=end+literal.length;}return at===text.length?result:null;};
 return {source,groups,re:{exec},weight:source.replace(/\{v\d+\}/g,'').length};
}
const patterns=[...new Set([...generatedLanguageKeys,...Object.keys(systemEventsDutch)])].filter(s=>/\{v\d+\}/.test(s)&&Object.hasOwn(dutch,s)).map(compile).sort((a,b)=>b.weight-a.weight);
function controlledSlots(source,values){
 const slots=new Set();
 if(/including extra loot/.test(source)||/^BIG SCORE!|^Crew mission|^Art heist failed|^Hired |^Purchased |^Started /.test(source))slots.add('v0');
 if(/^Recovered artwork/.test(source))slots.add('v1');
 if(/^Hired \{v0\} \{v1\}|^Purchased |^Started |^Production started|^\{v0\} ×/.test(source))slots.add('v1');
 if(/^\{v0\} used|^\{v0\} failed a|^\{v0\}: \{v1\} (?:succeeded|failed)/.test(source))slots.add('v1');
 if(/^\{v0\} against/.test(source))slots.add('v0');
 if(/^Police bribe:/.test(source))slots.add('v1');
 if(/^Crypto |^Plan marked/.test(source))values.v0=nl(values.v0);
 if(/^\{v0\} \(\{v1\}\)/.test(source)){values.v0=nl(values.v0);values.v1=nl(values.v1);}
 for(const slot of slots)if(names.has(values[slot]))values[slot]=nl(values[slot]);
 if(/^Casino |^\{v0\}\. Total return/.test(source))for(const slot of ['v0','v1'])if(typeof values[slot]==='string')values[slot]=translateGenerated(values[slot],'nl',true);
 if(source==='Reels: {v0}')values.v0=values.v0.split(' · ').map(s=>nl(s)).join(' · ');
 if(/armory/.test(source))for(const slot of Object.keys(values))if(['personal','family'].includes(values[slot]))values[slot]=nl(values[slot]);
 return values;
}
export function translateGenerated(text,language=activeLanguage,nested=false,trusted=false,depth=0){
 if(language!=='nl'||typeof text!=='string')return text;
 if(depth>5)return text;
 if(Object.hasOwn(dutch,text))return nl(text);
 if(text.length>8192)return text;
 text=text.replaceAll('Â·','·');
 for(const p of patterns){const m=p.re.exec(text);if(!m)continue;const values={};p.groups.forEach((keys,i)=>keys.forEach((key,j)=>values[key]=j?'':m[i+1]));if(p.source==='Reels: {v0}')values.v0=values.v0.split(' · ').map(s=>nl(s)).join(' · ');
 if(/^Casino /.test(p.source))values.v0=nl(values.v0);
 if(trusted){for(const key of Object.keys(values))values[key]=translateGenerated(values[key],language,true,true,depth+1);}else if(!nested)controlledSlots(p.source,values);return nl(p.source,values);}
 if(trusted){if(/^\$[\d,]+(?:\.\d+)?$/.test(text))return '$'+Number(text.slice(1).replaceAll(',','')).toLocaleString('en-US');if(text.includes('; '))return text.split('; ').map(s=>translateGenerated(s,language,true,true,depth+1)).join('; ');const pair=text.match(/^([A-Za-z][\w ]*): (.+)$/);if(pair)return nl(pair[1])+': '+translateGenerated(pair[2],language,true,true,depth+1);}
 return text;
}
