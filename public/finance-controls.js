import {text as ltext} from './localization.js';
export function bankControls(el,user,{api,refresh,toast,money}){
 const form=el.querySelector('#bankform'),input=form.elements.amount;
 const limit=1000000000000000;
 const maxDeposit=Math.min(user.cash,limit-user.bank),maxWithdraw=Math.min(user.bank,limit-user.cash);
 input.max=Math.max(maxDeposit,maxWithdraw);
 const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max=input.max;slider.value='0';slider.step='1';slider.setAttribute('aria-label',ltext('Amount ($)'));input.after(slider);
 slider.oninput=()=>input.value=slider.value;input.oninput=()=>slider.value=input.value;
 for(const [type,max,label] of [['deposit',maxDeposit,'Deposit all'],['withdraw',maxWithdraw,'Withdraw all']]){
  const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent=ltext(label)+' · '+money(max);button.disabled=max<1;
  button.onclick=async()=>{button.disabled=true;try{await api('bank',{type,amount:max});await refresh()}catch(error){toast(error.message,true);button.disabled=false}};
  form.append(button);
 }
}
