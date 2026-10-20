import {readFileSync,writeFileSync} from 'node:fs';
import {dutch} from '../public/i18n.js';
const mod={exports:{}};new Function('exports','module',process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'])(mod.exports,mod);
const keys=new Set(Object.keys(dutch)),fragments=new Set();
for(const file of ['game-guide.js','circuit-guide.js','referral-guide.js']){
 const ast=mod.exports.parse(readFileSync(file,'utf8'),{ecmaVersion:'latest',sourceType:'module'});
 function walk(n){if(!n||typeof n!=='object')return;
 if(n.type==='Literal'&&typeof n.value==='string'&&/[a-zA-Z]{2}.*\s.*[a-zA-Z]{2}/.test(n.value)&&!/^SELECT |^UPDATE |^INSERT |^DELETE |^CREATE /.test(n.value)&&!/[áéíóúàèìòù]|\b(?:je|jij|een|het|van|voor|zijn|niet|deze|wordt|kunt)\b/.test(n.value))fragments.add(n.value);
 if(n.type==='TemplateElement'&&/[A-Za-z]{3}/.test(n.value.cooked)&&!/[áéíóúàèìòù]|\b(?:je|jij|een|het|van|voor|zijn|niet|deze|wordt|kunt)\b/.test(n.value.cooked))fragments.add(n.value.cooked);
 for(const [k,v] of Object.entries(n))if(!['start','end'].includes(k)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}
 }walk(ast);
}
for(const k of fragments)keys.add(k);
writeFileSync('art/spanish/source-keys.json',JSON.stringify([...keys],null,2));writeFileSync('art/spanish/guide-fragments.json',JSON.stringify([...fragments],null,2));console.log(keys.size,fragments.size);
