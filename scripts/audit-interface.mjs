import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {menu} from '../public/navigation.js';
import {pageArt} from '../public/page-art.js';
import {compoundUpgrades} from '../crew-operations.js';
import {gameKnowledge} from '../game-knowledge.js';
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex'),icons=[];
for(const entry of menu){if(!Array.isArray(entry))icons.push(entry.id);for(const [tab] of Array.isArray(entry)?[entry]:entry.items)icons.push(tab);}
const missing=[],groups=new Map();for(const id of icons){const file='public/icons/menu-'+id+'.svg';if(!existsSync(file)){missing.push(file);continue}const key=hash(file);groups.set(key,[...(groups.get(key)||[]),id]);}
const duplicateIcons=[...groups.values()].filter(x=>x.length>1),headers=new Map();
for(const [tab,image] of Object.entries(pageArt)){const file='public/images/'+image;if(!existsSync(file)){missing.push(file);continue}const key=hash(file);headers.set(key,[...(headers.get(key)||[]),tab]);}
for(const u of compoundUpgrades)if(!existsSync('public'+u.image))missing.push(u.image);
const intentionalHeaderShares=[['armory','family-armory']],duplicateHeaders=[...headers.values()].filter(x=>x.length>1),unexpectedHeaderShares=duplicateHeaders.filter(x=>!intentionalHeaderShares.some(a=>a.length===x.length&&a.every(t=>x.includes(t))));
const result={menuIcons:icons.length,pageHeaders:Object.keys(pageArt).length,compoundExtensionImages:compoundUpgrades.length,knowledgeEntries:gameKnowledge().length,missing,duplicateIcons,duplicateHeaders,intentionalHeaderShares,unexpectedHeaderShares};
writeFileSync('art/interface-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(missing.length||duplicateIcons.length||unexpectedHeaderShares.length)process.exitCode=1;
