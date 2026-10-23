import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {catalog,crimes} from '../catalog.js';
import {familyAssets,mysteryJobs,musclePackages} from '../empire-catalog.js';
import {weapons,products,cities} from '../logistics.js';
import {employees,coins} from '../city-expansion.js';
import {crewMissions,compoundUpgrades} from '../crew-operations.js';
import {skins} from '../skins.js';
import {artCatalog,artHeists} from '../art-market.js';
import {stolenVehicles} from '../vehicle-catalog.js';
import {dailyJobs} from '../daily.js';
import {shopProducts} from '../shop.js';
import {pageArt,cityImage} from '../public/page-art.js';
import {milestones} from '../legacy.js';
// Inventory source files and authoritative catalogs; no player/database data is read.
export function deliveryInventory(){
 const root=new URL('../',import.meta.url),urls=new Set();
 for(const item of [...catalog,...crimes,...familyAssets,...mysteryJobs,...musclePackages,...weapons,...products,...employees,...coins,...crewMissions,...compoundUpgrades,...skins,...artCatalog,...artHeists,...stolenVehicles,...dailyJobs,...shopProducts])if(item.image)urls.add(item.image);
 for(const name of Object.values(pageArt))urls.add('/images/'+name);
 for(const city of cities)urls.add(cityImage(city));
 for(const item of milestones)urls.add('/icons/achievement-'+item.id+'.svg');
 for(const dir of ['','public/'])for(const name of readdirSync(new URL(dir,root)).filter(n=>/\.(js|css|html|webmanifest)$/.test(n))){const source=readFileSync(new URL(dir+name,root),'utf8');for(const m of source.matchAll(/\/(?:images|icons)\/[a-z0-9-]+\.(?:png|jpg|svg)/g))urls.add(m[0]);}
 // Also validate every installed icon and raster, including dynamic achievement emblems.
 for(const dir of ['images','icons'])for(const name of readdirSync(new URL('public/'+dir+'/',root)).filter(n=>/\.(png|jpg|svg)$/.test(n)))urls.add('/'+dir+'/'+name);
 const files=[...urls].sort(),missing=files.filter(url=>!existsSync(new URL('public'+url,root)));
 return {files,missing};
}
