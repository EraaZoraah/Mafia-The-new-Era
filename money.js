import {randomBytes} from 'node:crypto';
// Per-balance cap. XP, respect, investment principal and bet limits are separate.
export const MAX_CASH=1_000_000_000_000_000;
export const MAX_XP=1_000_000_000_000;
// crypto.randomInt only supports ranges below 2^48. Rejection sampling stays exact.
export function drawAmount(min,max){
 if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min<0||max<min)throw new RangeError('Invalid whole amount range');
 const span=BigInt(max)-BigInt(min)+1n,range=1n<<64n,limit=range-range%span;let n;
 do{n=randomBytes(8).readBigUInt64BE()}while(n>=limit);
 return Number(BigInt(min)+n%span);
}
