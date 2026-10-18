// Development-only source migration. Acorn is bundled with the project Node runtime.
// No translation service, credential or game database is accessed.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {templateKeys} from '../public/localization.js';
import {dutch} from '../public/i18n.js';
const bundled=process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
if(!bundled)throw Error('This development script requires a Node runtime with bundled Acorn.');
const mod={exports:{}};new Function('exports','module',bundled)(mod.exports,mod);
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'public'),apply=process.argv.includes('--apply'),corpus=new Map();
function add(key,file){if(!/[A-Za-z]{2}/.test(key.replace(/\{v\d+\}/g,'')))return;if(!corpus.has(key))corpus.set(key,new Set());corpus.get(key).add(file);}
for(const file of readdirSync(dir).filter(f=>f.endsWith('.js')&&!/^(nl-|i18n|localization|city-geography|page-art|navigation|outcome-images)/.test(f))){
 let source=readFileSync(path.join(dir,file),'utf8'),ast=mod.exports.parse(source,{ecmaVersion:'latest',sourceType:'module'}),edits=[],changed=false;
 const marked=new Set();
 const insert=(at,s)=>{edits.push({at,s});changed=true};
 function display(node){if(!node||marked.has(node))return;
  if(node.type==='Literal'&&typeof node.value==='string'&&/[A-Za-z]{2}/.test(node.value)&&!node.value.includes('<')){marked.add(node);add(node.value,file);insert(node.start,'ltext(');insert(node.end,')');}
  else if(node.type==='TemplateLiteral'&&!node.quasis.some(q=>/<[a-z/]/i.test(q.value.cooked||''))){marked.add(node);add(node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?'{v'+i+'}':'')).join(''),file);insert(node.start,'ltext');}
  else if(node.type==='ConditionalExpression'){display(node.consequent);display(node.alternate)}
  else if(node.type==='BinaryExpression'&&node.operator==='+'){display(node.left);display(node.right)}
  else if(node.type==='CallExpression'&&node.callee.name==='esc')display(node.arguments[0]);
 }
 function walk(node,parent){if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&['ltext','t'].includes(node.callee.name)){const argument=n=>{if(!n)return;if(n.type==='Literal'&&typeof n.value==='string')add(n.value,file);else if(n.type==='ConditionalExpression'){argument(n.consequent);argument(n.alternate)}else if(n.type==='LogicalExpression'){argument(n.left);argument(n.right)}};argument(node.arguments[0]);}
  if(node.type==='CallExpression'&&node.callee.name==='lhtml'&&node.arguments[0]?.type==='Literal')templateKeys([node.arguments[0].value]).forEach(key=>add(key,file));
  if(node.type==='TaggedTemplateExpression'&&node.tag.name==='ltext'){const template=node.quasi;add(template.quasis.map((q,i)=>q.value.cooked+(i<template.expressions.length?'{v'+i+'}':'')).join(''),file);}
  if(node.type==='TemplateLiteral'&&node.quasis.some(q=>/<[a-z/]/i.test(q.value.cooked||''))){
   templateKeys(node.quasis.map(q=>q.value.cooked)).forEach(key=>add(key,file));
   if(parent?.type!=='TaggedTemplateExpression'){insert(node.start,'lhtml');marked.add(node);}
   const abstract=node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?'\uE000'+i+'\uE001':'')).join('');
   // Conditional literal labels in text positions are UI strings; CSS classes/IDs are not.
   for(let i=0;i<node.expressions.length;i++){const at=abstract.indexOf('\uE000'+i+'\uE001'),before=abstract.slice(0,at);if(before.lastIndexOf('>')>=before.lastIndexOf('<'))display(node.expressions[i]);}
  }
  if(node.type==='Literal'&&typeof node.value==='string'&&/<[a-z/][^>]*>/i.test(node.value)&&!marked.has(node)&&parent?.callee?.name!=='lhtml'){
   templateKeys([node.value]).forEach(key=>add(key,file));insert(node.start,'lhtml(');insert(node.end,')');marked.add(node);
  }
  if(node.type==='AssignmentExpression'&&['textContent','innerText','placeholder','title'].includes(node.left.property?.name))display(node.right);
  if(node.type==='CallExpression'&&node.callee.name==='toast')display(node.arguments[0]);
  if(node.type==='CallExpression'&&node.callee.property?.name==='setAttribute'&&['aria-label','title','placeholder'].includes(node.arguments[0]?.value))display(node.arguments[1]);
  for(const [key,value] of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value)){for(const child of value)if(child?.type)walk(child,node);}else if(value?.type)walk(value,node);}
 }
 walk(ast,null);
 if(apply&&changed){
  for(const edit of edits.sort((a,b)=>b.at-a.at))source=source.slice(0,edit.at)+edit.s+source.slice(edit.at);
  if(!source.includes('html as lhtml'))source="import {html as lhtml,text as ltext} from './localization.js';\n"+source;
  // Parse transformed code before touching the file.
  mod.exports.parse(source,{ecmaVersion:'latest',sourceType:'module'});writeFileSync(path.join(dir,file),source);
 }
}
const entries=[...corpus].sort(([a],[b])=>a.localeCompare(b)).map(([key,files])=>({key,files:[...files],translated:Object.hasOwn(dutch,key)}));
writeFileSync(path.join(root,'art','localization-corpus.json'),JSON.stringify(entries,null,2));
console.log(JSON.stringify({keys:entries.length,translated:entries.filter(e=>e.translated).length,missing:entries.filter(e=>!e.translated).length,applied:apply}));
