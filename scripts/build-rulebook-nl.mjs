import {readFileSync,writeFileSync} from 'node:fs';
import {createRulesUI} from '../public/rules-ui.js';
const authored=JSON.parse(readFileSync(new URL('../translations/rulebook-nl.json',import.meta.url),'utf8')),dictionary={};
for(const [title,text] of createRulesUI({}).chapters){const pair=authored[title];if(!pair||pair.length!==2||pair.some(s=>!s.trim()))throw Error('Missing Dutch rule chapter: '+title);dictionary[title]=pair[0];dictionary[text]=pair[1];}
writeFileSync(new URL('../public/nl-rulebook.js',import.meta.url),'// Generated from the reviewed rulebook translation; regenerate when rules change.\nexport const rulebookDutch='+JSON.stringify(dictionary,null,2)+';\n');console.log('Dutch rule chapters: '+Object.keys(authored).length);
