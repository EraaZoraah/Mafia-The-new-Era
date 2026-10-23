// Bounded Power advantage, defenses and geography; never guaranteed.
export function territoryCaptureChance(attackPower,defenderPower,defenseReduction,factor=1){
 const edge=Math.log2(Math.max(1,attackPower)/Math.max(1,defenderPower));
 const base=.50+.075*Math.max(-5,Math.min(5,edge));
 const defense=1-Math.max(0,Math.min(.75,defenseReduction))*.35;
 return Math.max(.05,Math.min(.90,base*defense*Math.max(.75,Math.min(1.15,factor))));
}
