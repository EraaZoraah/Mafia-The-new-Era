import {driverRanks} from '../midnight-catalog.js';
import {writeFileSync} from 'node:fs';
import {ranks} from '../progression.js';
import {careerRanks} from '../empire-catalog.js';
import {breakoutRanks} from '../city-expansion.js';
import {respectRanks} from '../underworld.js';
const names=[...new Set([...driverRanks,...ranks,...Object.values(careerRanks).flat(),...breakoutRanks,...respectRanks].map(r=>r.name).concat(['Don','Capo','Consigliere','Underboss','Enforcer','Soldier','Member']))];
writeFileSync(new URL('../public/rank-names.js',import.meta.url),'// Generated from authoritative rank catalogs. Rank names never translate.\nexport const rankNames=Object.freeze('+JSON.stringify(names,null,2)+');\n');
console.log(names.length+' rank names protected');
