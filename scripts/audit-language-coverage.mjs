import {generatedLanguageKeys} from '../public/generated-language-keys.js';
import {localeCatalog} from '../public/locale-catalog.js';
import {catalogProperNames} from '../public/catalog-proper-names.js';
import {releaseNotes} from '../release-notes.js';
import {gameKnowledge} from '../game-knowledge.js';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dutch,spanish,french,german,languages} from '../public/i18n.js';
import {catalog,crimes} from '../catalog.js';
import {familyAssets,mysteryJobs,musclePackages} from '../empire-catalog.js';
import {weapons,products} from '../logistics.js';
import {crewMissions,compoundUpgrades} from '../crew-operations.js';
import {employees} from '../city-expansion.js';
import {milestones} from '../legacy.js';
import {shopProducts} from '../shop.js';
import {createRulesUI} from '../public/rules-ui.js';
const language=['es','fr','de'].find(code=>process.argv.includes('--'+code))||'nl',dictionary={nl:dutch,es:spanish,fr:french,de:german}[language];
const has=s=>Object.hasOwn(dictionary,s),ui=JSON.parse(readFileSync(new URL('../art/localization-corpus.json',import.meta.url))),rules=createRulesUI({}),missing={templates:ui.filter(x=>!has(x.key)),rulebook:rules.chapters.flatMap(([title,text])=>[title,text]).filter(s=>!has(s)),catalogDescriptions:[...catalog,...crimes,...familyAssets,...mysteryJobs,...musclePackages,...weapons,...products,...crewMissions,...compoundUpgrades,...employees,...milestones,...shopProducts].filter(x=>x.description&&!has(x.description)).map(x=>({id:x.id,name:x.name,text:x.description})),validation:[]};
// Inspect authored errors only; never scan account/chat data or translate user text.
for(const f of readdirSync(new URL('../',import.meta.url)).filter(f=>f.endsWith('.js'))){const source=readFileSync(new URL('../'+f,import.meta.url),'utf8');for(const m of source.matchAll(/\bfail\((['"])((?:\\.|(?!\1).)*)\1/g)){const text=m[2].replace(/\\'/g,"'").replace(/\\"/g,'"');if(!has(text))missing.validation.push({file:f,text});}}
missing.generatedResults=generatedLanguageKeys.filter(x=>!has(x));
missing.catalogLabels=localeCatalog.flatMap(x=>[x.name,x.title,x.unlock,x.frameName]).filter(x=>x&&!has(x)&&!catalogProperNames.includes(x));
missing.changelogs=releaseNotes.flatMap(x=>[x.date,x.title,...x.items]).filter(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x)&&!has(x));
const enKnowledge=gameKnowledge();missing.guideFacts=gameKnowledge(language).filter((x,i)=>x.text===enKnowledge[i].text).map(x=>x.title);
missing.validation=[...new Map(missing.validation.map(x=>[x.text,x])).values()];
const report={language,ready:languages[language].ready,scope:'Controlled UI templates, full rulebook, catalog descriptions and literal server validation. Generated result patterns, catalog labels, changelogs and shared guide facts included; live recommendations and desktop/mobile scenarios reviewed separately.',counts:Object.fromEntries(Object.entries(missing).map(([k,v])=>[k,v.length])),missing};
writeFileSync(new URL('../art/'+({es:'spanish',nl:'dutch',fr:'french',de:'german'}[language])+'-completeness-audit.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({ready:report.ready,missing:report.counts}));

if(Object.values(report.counts).some(count=>count>0))process.exitCode=1;
