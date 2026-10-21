import {menu as navigationMenu} from '../public/navigation.js';
import {pageArt,cityImage} from '../public/page-art.js';
import {dailyJobs} from '../daily.js';
import {employees} from '../city-expansion.js';
import fs from 'node:fs';
import {catalog,crimes} from '../catalog.js';
import {familyAssets} from '../empire-catalog.js';
import {weapons,products} from '../logistics.js';
import {crewMissions} from '../crew-operations.js';
import {milestones} from '../legacy.js';
import {coins} from '../city-expansion.js';
const items=[...catalog,...crimes,...familyAssets,...weapons,...products,...crewMissions,...dailyJobs,...employees];const missing=items.filter(x=>x.image&&!fs.existsSync('public'+x.image)).map(x=>({id:x.id,image:x.image}));
for(const m of milestones)if(!fs.existsSync(`public/icons/achievement-${m.id}.svg`))missing.push(m.id);
for(const c of coins)if(!fs.existsSync('public'+c.image))missing.push(c.id);
// Section headings do not render icons; audit only actual menu entries.
for(const entry of navigationMenu){for(const [id] of Array.isArray(entry)?[entry]:entry.items){if(!fs.existsSync(`public/icons/menu-${id}.svg`))missing.push('menu:'+id);}if(!Array.isArray(entry)&&!fs.existsSync(`public/icons/menu-${entry.id}.svg`))missing.push('menu:'+entry.id);}
for(const image of Object.values(pageArt))if(!fs.existsSync('public/images/'+image))missing.push(image);
for(const city of ['New York','Miami','Los Angeles','Chicago','London','Amsterdam','Paris','Rome','Istanbul','Dubai','Singapore','Hong Kong','Tokyo','Sydney','São Paulo'])if(!fs.existsSync('public'+cityImage(city)))missing.push(city);
console.log(JSON.stringify({checked:items.length,medals:milestones.length,coins:coins.length,missing}));if(missing.length)process.exitCode=1;
