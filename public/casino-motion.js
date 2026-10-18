import {activeLocale as gameLocale} from './i18n.js';
import {t} from './i18n.js';
export function casinoError(game,message){const host=document.querySelector('[data-table-game="'+game+'"]')||document.querySelector('[data-casino-stage]')||document.querySelector('#content');if(!host)return;host.querySelector('.casino-error')?.remove();const p=document.createElement('p');p.className='casino-error notice error';p.setAttribute('role','alert');p.textContent=message;host.prepend(p);}
// Presentation only: every outcome and payment has already been decided by the server.
export async function casinoMotion(round,{animate=true}={}) {
 if(!round || document.hidden)return;
 const table=document.querySelector('[data-table-game="'+round.game+'"]');
 if(table&&['blackjack','higher-lower','poker'].includes(round.game)){table.classList.toggle('casino-revealing',animate&&round.status==='finished');if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)await Promise.all([...table.querySelectorAll('.playing-card')].map((card,i)=>card.animate([{opacity:0,transform:'translateY(-25px) rotate(-6deg)'},{opacity:1,transform:'none'}],{duration:400,delay:i*70,fill:'backwards'}).finished.catch(()=>{})));table.classList.remove('casino-revealing');return;}
 const reduced=!animate||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const box=document.createElement('section');box.className='casino-motion casino-inline-motion';
 const heading=document.createElement('h2');heading.textContent=t({slots:'The Golden Reels',roulette:'Roulette',safe:'Crack the safe',poker:'Video poker',blackjack:'Blackjack','higher-lower':'Higher or Lower'}[round.game]||'The Golden Room');if(!table)box.append(heading);
 const stage=document.createElement('div');stage.className='motion-stage';stage.setAttribute('aria-label',t('Revealing your saved casino result'));box.append(stage);
 const symbols=['🍒','🍋','🍇','🔔','💎','7'];const animations=[];
 if(round.game==='slots'&&Array.isArray(round.result)){
  for(const [i,result] of round.result.entries()){
   const reel=document.createElement('div');reel.className='slot-window';const strip=document.createElement('div');strip.className='slot-strip';
   const sequence=[...Array.from({length:18+i*6},(_,n)=>symbols[n%6]),symbols[result]];
   for(const face of sequence){const tile=document.createElement('span');tile.textContent=face;strip.append(tile)}reel.append(strip);stage.append(reel);
   const transform=`translateY(-${(sequence.length-1)*100}px)`;strip.style.transform=transform;
   if(!reduced)animations.push(strip.animate([{transform:'translateY(0)'},{transform}],{duration:1300+i*350,easing:'cubic-bezier(.12,.65,.18,1)'}));
  }
 }else if(round.game==='roulette'){
  const wheel=document.createElement('div');wheel.className='roulette-wheel';stage.append(wheel);if(!reduced)animations.push(wheel.animate([{transform:'rotate(0deg)'},{transform:'rotate(1080deg)'}],{duration:1800,easing:'ease-out'}));
 }else{
  const values=round.cards?.length?round.cards:round.player?.length?round.player:round.rank?[round.rank-1,...(round.nextRank?[round.nextRank-1]:[])]:[];
  for(const [i,c] of values.entries()){const card=document.createElement('div');card.className='playing-card'+([1,3].includes(Math.floor(c/13))?' red-card':'');card.textContent=['A','2','3','4','5','6','7','8','9','10','J','Q','K'][c%13]+['♠','♥','♣','♦'][Math.floor(c/13)||0];stage.append(card);if(!reduced)animations.push(card.animate([{opacity:0,transform:'translateY(-45px) rotate(-12deg)'},{opacity:1,transform:'none'}],{duration:450,delay:i*150,fill:'backwards'}));}
  if(!values.length){const dial=document.createElement('div');dial.className='safe-dial';dial.textContent='✥';stage.append(dial);if(!reduced)animations.push(dial.animate([{transform:'rotate(0)'},{transform:'rotate(720deg)'}],{duration:1200,easing:'ease-out'}));}
 }
 const result=document.createElement('p');result.className='motion-result';result.setAttribute('aria-live','polite');if(!table)box.append(result);
 const host=document.querySelector('[data-casino-stage]');if(!host)return;if(table)table.classList.toggle('casino-revealing',animate&&!reduced);host.replaceChildren(box);
 await Promise.all(animations.map(a=>a.finished.catch(()=>{})));if(table)table.classList.remove('casino-revealing');
 if(round.game==='roulette'){const number=document.createElement('strong');number.className='roulette-number';number.textContent=String(round.result);stage.append(number)}
 result.textContent=t(round.outcome||'Your cards are ready.')+(round.status==='finished'?' · '+t('Total return')+' $'+Number(round.payout||0).toLocaleString(gameLocale)+' · '+t('Net')+' $'+Number((round.payout||0)-round.stake).toLocaleString(gameLocale):'');
}
