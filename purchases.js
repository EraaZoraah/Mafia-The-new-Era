// Compute bulk orders from current server balances, including each copy's price.
export function order(request,remaining,cash,priceAt,fail){
 if(request!=='max'&&(!Number.isSafeInteger(request)||request<1))fail('Choose a positive whole quantity or Buy MAX.');
 let quantity=0,cost=0;for(let i=0;i<remaining;i++){const price=priceAt(i);if(!Number.isSafeInteger(price)||price<0||cost+price>cash)break;cost+=price;quantity++;if(request!=='max'&&quantity===request)break;}
 if(!quantity)fail(remaining?'Insufficient funds.':'Collection limit reached.',409);
 if(request!=='max'&&quantity!==request)fail('Quantity exceeds your funds or collection limit.',409);
 return {quantity,cost};
}
