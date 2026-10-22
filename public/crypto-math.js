export const CRYPTO_BASIS_LIMIT=10_000_000_000_000;
export const CRYPTO_QUANTITY_LIMIT=CRYPTO_BASIS_LIMIT;
export function cryptoBuyMaximum(coin,wallet={},cash=0,limit=CRYPTO_BASIS_LIMIT){
 return Math.max(0,Math.min(CRYPTO_QUANTITY_LIMIT,Math.floor(cash/coin.buy),Math.floor((limit-(wallet.basis||0))/coin.buy)));
}
export const coinValue=(quantity,price)=>BigInt(quantity||0)*BigInt(price||0);
