const memory=new Map(),collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
export function sortableValue(text){
 const s=String(text??'').trim(),numeric=s.replace(/[$,%€\s,]/g,'');
 if(/^-?\d+(?:\.\d+)?[KMBT]?$/i.test(numeric)){const suffix=numeric.slice(-1).toUpperCase();return Number(numeric.replace(/[KMBT]$/i,''))*({K:1e3,M:1e6,B:1e9,T:1e12}[suffix]||1)}
 return s;
}
export function compareCells(a,b){a=sortableValue(a);b=sortableValue(b);return typeof a==='number'&&typeof b==='number'?a-b:collator.compare(String(a),String(b));}
export function mountTableSorting(root){
 const bind=()=>root.querySelectorAll('table').forEach((table,tableIndex)=>{
  if(table.dataset.sortBound)return;const headerRow=table.tHead?.rows[0]||table.rows[0],headers=headerRow?[...headerRow.cells].filter(c=>c.tagName==='TH'):[];if(!headers.length)return;table.dataset.sortBound='true';
  const key=(root.dataset.sortPage||'')+':'+tableIndex+':'+headers.map(h=>h.textContent.trim()).join('|');
  const apply=(index,direction,remember=true)=>{headers.forEach((h,i)=>{h.setAttribute('aria-sort',i===index?(direction==='asc'?'ascending':'descending'):'none');h.querySelector('.sort-arrow').textContent=i===index?(direction==='asc'?' ↑':' ↓'):' ↕'});if(remember)memory.set(key,{index,direction});
   if(table.sortRemote){if(remember)table.sortRemote(index,direction);return;}
   const body=table.tBodies[0]||table,rows=[...body.rows].filter(r=>r!==headerRow&&!r.closest('thead')&&r.cells.length===headers.length);const values=r=>{const cell=r.cells[index];if(cell?.dataset.sortValue!==undefined)return cell.dataset.sortValue;if(!cell)return '';const copy=cell.cloneNode(true);copy.querySelectorAll('.staff-badge,.supporter-diamond,.online-dot,.bot-badge,.lucky-winner').forEach(b=>b.remove());return copy.textContent};
   rows.map((r,i)=>({r,i})).sort((a,b)=>(direction==='asc'?1:-1)*compareCells(values(a.r),values(b.r))||a.i-b.i).forEach(({r})=>body.append(r));
  };
  headers.forEach((h,index)=>{const button=document.createElement('button');button.type='button';button.className='table-sort';button.append(...h.childNodes);const arrow=document.createElement('span');arrow.className='sort-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent=' ↕';button.append(arrow);h.append(button);h.setAttribute('aria-sort','none');button.onclick=()=>apply(index,h.getAttribute('aria-sort')==='ascending'?'desc':'asc')});
  const saved=memory.get(key);if(saved)apply(saved.index,saved.direction,false);
 });bind();const observer=new MutationObserver(bind);observer.observe(root,{childList:true,subtree:true});return ()=>observer.disconnect();
}
