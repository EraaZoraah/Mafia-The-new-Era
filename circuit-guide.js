import {circuitRules} from './public/circuit-rules.js';
import {createTranslator} from './public/i18n.js';
export function circuitGuide(board,user,time,language='en'){
 const nl=language==='nl',t=createTranslator(language),locked=Math.max(user.prison_until||0,user.hospital_until||0,user.coma_until||0)>time,offer=board.recommendation;
 let answer=t(circuitRules);
 if(locked)answer+=' '+(nl?'Je zit vast of herstelt: regel eerst je vrijlating.':'You are detained or recovering: arrange release before racing.');
 else if(board.pending)answer+=' '+(nl?'Je wacht op race #':'You are waiting for race #')+board.pending+'.';
 else if(offer)answer+=' '+(nl?'Huidige optie binnen je middelen: ':'Current option within your resources: ')+offer.name+' · '+t(offer.routeName)+' · '+t(offer.setup)+' · '+(nl?'inzet ':'entry $')+(nl?'$':'')+offer.cost.toLocaleString('en-US')+' · 8 '+(nl?'energie.':'energy.')+' '+(nl?'De serverofferte gebruikt je huidige conditie, slijtage, afstelling en rijrang. Verwachte tijden zijn geen winstgarantie.':'The server quote uses your current condition, wear, setup and driver rank. Expected times do not guarantee a win.');
 else answer+=' '+(nl?'Je hebt nu geen direct beschikbare solo-optie. Controleer een lokale opgeslagen auto of privégarage, slijtage, energie, geld en de wachttijd.':'No solo entry is available right now. Check local storage or garage ownership, wear, energy, cash and cooldown.');
 return {name:'Luca Moretti',mode:'local',...(nl?{language:'nl'}:{}),answer,links:[{tab:'circuit',label:'Midnight Circuit'}],suggestions:offer&&!locked?[{tab:'circuit',label:nl?'Vergelijk je actuele raceofferte':'Compare your current racing quote',text:offer.name+' · '+t(offer.routeName)+' · $'+offer.cost.toLocaleString('en-US')+' · '+t('Clean')}]:[]};
}
