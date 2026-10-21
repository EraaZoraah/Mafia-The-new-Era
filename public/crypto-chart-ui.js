import {html,text} from './localization.js';

export function openPosition(wallet,coin){
 const quantity=wallet.quantity||0,basis=wallet.basis||0;
 const marketValue=quantity*coin.price,saleValue=quantity*coin.sell;
 return {quantity,basis,average:quantity?basis/quantity:0,marketValue,saleValue,gain:saleValue-basis,margin:basis?(saleValue-basis)/basis*100:0};
}

// Keep real quote times: an empty or partial history is never invented.
export function chartSeries(history,coin,end){
 return history.filter(h=>h.coin===coin&&h.epoch*300000>=end-14400000&&h.epoch*300000<=end)
  .sort((a,b)=>a.epoch-b.epoch);
}

export function coinChart(coin,history,end,{money,date,esc,open=false}){
 const points=chartSeries(history,coin.id,end),start=end-14400000;
 const values=points.map(p=>p.price),low=Math.min(...values),high=Math.max(...values);
 const spread=Math.max(high-low,high*.02,1),bottom=Math.max(0,low-spread*.12),top=high+spread*.12;
 const x=p=>64+(p.epoch*300000-start)/14400000*548,y=p=>190-(p.price-bottom)/(top-bottom)*160;
 const line=points.map(p=>`${x(p).toFixed(2)},${y(p).toFixed(2)}`).join(' ');
 const change=points.length>1?(points.at(-1).price/points[0].price-1)*100:0;
 const stamp=t=>new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
 const id='coin-chart-'+coin.id;
 return html`<details class="coin-chart" data-chart="${coin.id}" ${open?'open':''}><summary><span>Price chart · 4 hours</span><span aria-hidden="true">↗</span></summary><div class="coin-chart-body"><div class="coin-chart-heading"><strong>${esc(coin.name)} · ${esc(coin.symbol)}</strong><span class="market-${change>=0?'up':'down'}">${change>=0?'+':''}${change.toFixed(2)}%</span></div>${points.length>1?html`<svg viewBox="0 0 640 235" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(coin.name)} · ${text('Price chart · 4 hours')}</title><desc id="${id}-desc">${esc(date(start))} — ${esc(date(end))}. ${money(points[0].price)} → ${money(points.at(-1).price)}</desc><defs><linearGradient id="${id}-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d8bc7e" stop-opacity=".28"/><stop offset="1" stop-color="#d8bc7e" stop-opacity="0"/></linearGradient></defs>${[30,110,190].map((v,i)=>html`<line class="chart-grid" x1="64" x2="612" y1="${v}" y2="${v}"/><text class="chart-label" x="56" y="${v+4}" text-anchor="end">${money(Math.round(top-(top-bottom)*i/2))}</text>`).join('')}<polygon points="${x(points[0])},190 ${line} ${x(points.at(-1))},190" fill="url(#${id}-fill)"/><polyline points="${line}" class="chart-line"/>${points.map(p=>html`<circle cx="${x(p)}" cy="${y(p)}" r="2.5" class="chart-point" tabindex="0"><title>${esc(date(p.epoch*300000))} · ${money(p.price)}</title></circle>`).join('')}${[0,1,2,3,4].map(i=>html`<text class="chart-label" x="${64+i*137}" y="220" text-anchor="${i===0?'start':i===4?'end':'middle'}">${stamp(start+i*3600000)}</text>`).join('')}</svg>`:html`<p class="muted">Not enough recorded quotes yet. The chart grows as new prices arrive.</p>`}<p class="muted">Recorded five-minute market quotes. Hover or focus a point for its price and time. Your local time is shown.</p>${points.length<49?html`<p class="muted">Only available recorded history is shown; missing prices are not estimated.</p>`:''}</div></details>`;
}

export function positionPanel(wallet,coin,{money,movement}){
 const p=openPosition(wallet,coin);
 if(!p.quantity)return html`<p class="muted">No open position</p>`;
 const precise=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 return html`<section class="coin-position"><h4>Your open position</h4><dl><div><dt>Coins held</dt><dd>${p.quantity.toLocaleString('en-US')}</dd></div><div><dt>Average purchase price</dt><dd>${precise(p.average)}</dd></div><div><dt>Purchase value</dt><dd>${money(p.basis)}</dd></div><div><dt>Current market value</dt><dd>${money(p.marketValue)}</dd></div><div><dt>Current sale value</dt><dd>${money(p.saleValue)}</dd></div><div><dt>Unrealized profit / loss</dt><dd class="market-${p.gain>=0?'up':'down'}">${money(p.gain)} ${movement(p.margin)}</dd></div></dl><p class="muted">Average purchase price includes the buy fee and uses the remaining position. Profit compares the current sale value after the sell fee with its purchase value; earned-profit bonuses are excluded until sale.</p></section>`;
}
