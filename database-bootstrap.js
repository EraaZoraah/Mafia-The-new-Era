import {mkdirSync,existsSync,copyFileSync,constants} from 'node:fs';
import path from 'node:path';
// A starter world is an optional deployment artifact, never a replacement for live data.
export function prepareDatabase(root){
 const folder=path.join(root,'data'),target=path.join(folder,'mafia.sqlite'),starter=path.join(root,'starter-data','mafia.sqlite');
 mkdirSync(folder,{recursive:true});
 if(!existsSync(target)&&existsSync(starter))copyFileSync(starter,target,constants.COPYFILE_EXCL);
 return target;
}
