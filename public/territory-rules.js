// Shared estimate and server execution formula; resource checks remain server-only.
export function territoryCaptureChance(attackPower,defenderPower,defenseReduction,factor=1){
 return Math.max(.01,Math.min(.55,.26*Math.sqrt(Math.max(1,attackPower)/Math.max(1,defenderPower))*(1-defenseReduction)*factor));
}
