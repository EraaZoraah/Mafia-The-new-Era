import {readFileSync,writeFileSync} from 'node:fs';
const mod={exports:{}};new Function('exports','module',process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'])(mod.exports,mod);
const keys=new Set(JSON.parse(readFileSync('art/spanish/source-keys.json')));
for(const file of ['game-guide.js','circuit-guide.js','referral-guide.js']){
 const ast=mod.exports.parse(readFileSync(file,'utf8'),{ecmaVersion:'latest',sourceType:'module'});
 const walk=n=>{if(!n||typeof n!=='object')return;if(n.type==='Literal'&&typeof n.value==='string'&&/[A-Za-z]{2}/.test(n.value)&&/[\s$]/.test(n.value)&&!/^SELECT |^UPDATE |^INSERT |^DELETE |^CREATE /.test(n.value)&&!/[áéíóúàèìòù]|\b(?:je|jij|een|het|van|voor|zijn|niet|deze|wordt|kunt)\b/.test(n.value))keys.add(n.value);for(const [k,v] of Object.entries(n))if(!['start','end'].includes(k)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}};walk(ast);
}
writeFileSync('art/spanish/source-keys.json',JSON.stringify([...keys],null,2));console.log(keys.size);
