import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const mod={exports:{}};new Function('exports','module',readFileSync(new URL('./prepare-localization.mjs',import.meta.url),'utf8').includes('process.binding')?process.binding('natives')['internal/deps/acorn/acorn/dist/acorn']:'')(mod.exports,mod);
const rows=new Map();
const cross=(a,b)=>a.flatMap(x=>b.map(y=>[...x,...y]));
function variants(n){if(!n)return [];if(n.type==='ConditionalExpression')return [...variants(n.consequent),...variants(n.alternate)];if(n.type==='Literal'&&typeof n.value==='string')return [[n.value]];if(n.type==='BinaryExpression'&&n.operator==='+')return cross(variants(n.left),variants(n.right));if(n.type==='TemplateLiteral'){let parts=[[]];for(let i=0;i<n.quasis.length;i++){parts=cross(parts,[[n.quasis[i].value.cooked]]);if(i<n.expressions.length)parts=cross(parts,variants(n.expressions[i]));}return parts;}return [[n]];}
function key(parts){let i=0;return parts.map(x=>typeof x==='string'?x:'{v'+i+++'}').join('');}
function walk(n,file){if(!n||typeof n!=='object')return;
 let targets=[];
 if(file==='game-knowledge.js'&&n.type==='ArrowFunctionExpression')targets.push(n.body);
 if(n.type==='Property'&&(['message','error','note','valuation','answer','outcome'].includes(n.key?.name||n.key?.value)||file==='casino-extra.js'&&n.key?.name==='name'))targets.push(n.value);
 if(file==='casino-extra.js'&&n.type==='AssignmentExpression'&&n.left?.name==='name')targets.push(n.right);
 if(n.type==='CallExpression'||n.type==='NewExpression'){
  const name=n.callee.name||n.callee.property?.name;
  if(['fail','toast'].includes(name))targets.push(n.arguments[0]);
  if(name==='Error')targets.push(n.arguments[0]);
  if(name==='err')targets.push(n.arguments[2]);
  if(name==='add'&&file==='game-knowledge.js')targets.push(n.arguments[1],n.arguments[2]);
  if(name==='log')targets.push(n.arguments.at(-1));
  if(name==='notify')targets.push(n.arguments[1],n.arguments[2]);
  if(['detain','release','record'].includes(name))targets.push(n.arguments.at(-1));
  if(name==='finish'&&file.startsWith('casino'))targets.push(n.arguments[2]);
 }
 for(const node of targets)for(const variant of variants(node)){const source=key(variant);if(/[A-Za-z]{3}/.test(source.replace(/\{v\d+\}/g,''))){if(!rows.has(source))rows.set(source,new Set());rows.get(source).add(file);}}
 for(const [k,v] of Object.entries(n))if(!['start','end'].includes(k)){if(Array.isArray(v))v.forEach(x=>walk(x,file));else if(v&&typeof v==='object')walk(v,file);}
}
for(const file of readdirSync(new URL('../',import.meta.url)).filter(f=>f.endsWith('.js')&&!f.startsWith('seed-')&&!f.startsWith('guide-')&&f!=='game-guide.js')){const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');walk(mod.exports.parse(source,{ecmaVersion:'latest',sourceType:'module'}),file);}
// Controlled local-variable messages and guide fragments outside the AST targets.
for(const [key,file] of [
 ['{v0} declared a 24-hour war on {v1}. Successful raids score one point; failed attacks award no points.','family-wars.js'],
 ['{v0} launched {v1} against {v2}: failed. No war points awarded for a failed operation. {v3}','war-operations.js'],
 ['Your family currently holds {v0}/10 conquered plots in {v1}. Treasury ${v2}.','game-guide.js']
])rows.set(key,new Set([file]));
const result=[...rows].map(([key,files])=>({key,files:[...files]}));writeFileSync(new URL('../art/generated-language-corpus.json',import.meta.url),JSON.stringify(result,null,2));writeFileSync(new URL('../public/generated-language-keys.js',import.meta.url),'// Generated from controlled server messages; never player content.\nexport const generatedLanguageKeys='+JSON.stringify(result.map(x=>x.key))+';\n');console.log('Generated message patterns: '+result.length);
