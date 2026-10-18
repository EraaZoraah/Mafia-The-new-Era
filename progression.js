export const ranks=['Outsider','Errand Runner','Lookout','Pickpocket','Hustler','Street Operator','Enforcer','Associate','Made Member','Soldier','Trusted Soldier','Racketeer','Crew Leader','Captain','Capo','Senior Capo','Consigliere','Underboss','Boss','Don','Crime Lord','Kingpin','Shadow Sovereign','Syndicate Emperor','The Godfather'].map((name,index)=>({name,xp:0,level:index+1}));
let threshold=0,cumulative=1;
for(const [i,r] of ranks.entries()){
 if(i)threshold+=Math.round(7825*1.185**(i-1)/100)*100;
 r.xp=threshold;const added=i?Math.round(10+(r.level-2)*40/23):0;
 cumulative=Math.round((cumulative+added/100)*100)/100;
 r.incomeMultiplier=r.level<=10?cumulative:Math.round(3.06*Math.pow(500/3.06,(r.level-10)/15)*100)/100;
 r.promotionPercent=i?(r.incomeMultiplier/ranks[i-1].incomeMultiplier-1)*100:0;
}
export const distinctionStep=ranks.at(-1).xp-ranks.at(-2).xp;
export const prestigeGrowth=1.185;
export function prestigeThreshold(count){
 if(!Number.isSafeInteger(count)||count<0)throw new RangeError('Invalid prestige count');
 return ranks.at(-1).xp+Math.round(distinctionStep*prestigeGrowth*(prestigeGrowth**count-1)/(prestigeGrowth-1));
}
export function progression(xp){
 const index=Math.max(0,ranks.findLastIndex(rank=>xp>=rank.xp)),rank=ranks[index];
 let distinctions=0;
 if(xp>=ranks.at(-1).xp){while(distinctions<200&&prestigeThreshold(distinctions+1)<=xp)distinctions++;}
 const next=index<ranks.length-1?ranks[index+1]:{name:`Legacy Distinction ${distinctions+1}`,xp:prestigeThreshold(distinctions+1)};
 const floor=index<ranks.length-1?rank.xp:prestigeThreshold(distinctions);
 const incomeMultiplier=Math.min(1000000,rank.incomeMultiplier*1.075**distinctions);
 return {rank:rank.name,rankLevel:rank.level,distinctions,distinctionIcon:distinctions?['♜','⚜','♛','✧','☀','♞','❖','✺'][Math.floor((distinctions-1)/25)]:'',distinctionImage:distinctions?'/icons/prestige-'+distinctions+'.svg':null,incomeMultiplier,
 rankEnergyBonus:(rank.level-1+distinctions)*10,rankIncomeBps:(incomeMultiplier-1)*10000,crimeChanceBonus:(rank.level-1)/24*.34,
 nextRank:next.name,nextRankXp:next.xp,rankFloorXp:floor,rankProgress:Math.max(0,Math.min(1,(xp-floor)/(next.xp-floor))),distinctionStep:next.xp-floor,prestigeGrowth,prestigeBonus:7.5};
}
// XP gaps grow faster (18.5%) than rewards (7.5%) after Godfather.
export const passiveMultiplier=incomeMultiplier=>Math.min(16,Math.sqrt(Math.max(1,incomeMultiplier)));
