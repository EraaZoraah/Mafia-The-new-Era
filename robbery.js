import {progression} from './progression.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function robberyQuote(attacker,target,attackerPower,targetPower){
 const a=progression(attacker.xp).rankLevel,b=progression(target.xp).rankLevel;
 const strength=clamp(.4*(a-b)/24+.6*Math.tanh(Math.log((Math.max(0,attackerPower)+1000)/(Math.max(0,targetPower)+1000))/2),-1,1);
 return {chance:clamp(.55+.25*strength,.15,.80),fullCashChance:clamp(.003+.007*strength,.001,.01),strength};
}
export function robberyShare(quote,draw,protection=0){
 if(draw(1,1000000)<=Math.floor(quote.fullCashChance*(1-protection)*1000000))return 1;
 const quality=(draw(0,10000)+draw(0,10000))/20000;
 return clamp((.10+.89*quality**(2.5-quote.strength))*(1-protection),.10,.99);
}
