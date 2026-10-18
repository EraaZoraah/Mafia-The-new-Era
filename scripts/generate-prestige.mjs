import fs from 'node:fs';
// Twenty recognizable underworld symbols, with ten distinct heraldic settings.
// Each prestige combines its own symbol/setting, rather than adding dense rings.
const motifs=[
 'M12 19l3-10h10l3 10M9 22q11 5 22 0l-3-3H12zM15 15h10',
 'M10 14l5 7 5-11 5 11 5-7-3 14H13zM14 31h12',
 'M12 11l5 4h6l5-4 2 13-10 8-10-8zM15 21l3 1M25 21l-3 1M17 26l3 2 3-2',
 'M10 9l8 7h4l8-7-3 17-7 7-7-7zM14 20l4 3M26 20l-4 3M17 27h6',
 'M18 16l2-8 5 3-2 5 10-5-4 11-7 3 4 8-6-4-6 4 4-8-7-3-4-11z',
 'M10 28l6-6-7-8 9 3 3-8 5 4 6 1-8 5v8l-10 5zM20 29v4',
 'M13 22a7 7 0 1 0 14 0a7 7 0 1 0-14 0M15 16V9h10v7M18 9v5M22 9v5',
 'M20 8l10 5v9q-2 7-10 11-8-4-10-11v-9zM15 20l4 4 7-9',
 'M10 17h20v14H10zM16 17v-6h8v6M10 22h20M18 21v4h4v-4',
 'M18 8h4M20 6v8M15 14h10l-3 8 6 7H12l6-7zM11 33h18',
 'M12 30l3-9-4-4 6-8 11 6-4 6v9zM18 14h1M18 24h6M10 33h20',
 'M20 31V18M20 25l-7-3M20 28l7-4M16 11l4-4 5 4-2 6h-6zM13 12l4 5M27 12l-4 5',
 'M15 9q-12 13 3 23M25 9q12 13-3 23M10 15l5 1M9 21l6-1M12 27l5-3M30 15l-5 1M31 21l-6-1M28 27l-5-3',
 'M12 20v-4a8 8 0 0 1 16 0v4l-4 3v6h-8v-6zM15 17h3M22 17h3M19 23h2M20 25v4',
 'M12 20a8 8 0 1 0 16 0a8 8 0 1 0-16 0M20 12v16M23 15h-5v5h5v5h-6',
 'M20 9l4 9 7 2-9 4-2 7-4-9-7-2 9-4z',
 'M13 9h14M13 31h14M15 9v6l5 5-5 5v6M25 9v6l-5 5 5 5v6M17 27h6',
 'M9 18l6-7 5 4 5-2 7 7-5 9-7-2-5 1-6-7zM15 11l8 11 3-4M20 25l5 3',
 'M10 31V20h6v11M18 31V10h7v21M27 31V16h4v15M20 15h3M20 21h3M20 27h3',
 'M14 19a5 5 0 1 0 0-10a5 5 0 1 0 0 10M18 18l12 12M24 24l3-3M27 27l3-3'
];
const borders=[
 '<circle cx="20" cy="20" r="18"/>',
 '<path d="M20 2 35 8v15Q33 32 20 38 7 32 5 23V8z"/>',
 '<path d="M10 3h20l8 17-8 17H10L2 20z"/>',
 '<path d="M11 2h18l9 9v18l-9 9H11l-9-9V11z"/>',
 '<circle cx="20" cy="20" r="15"/><path d="M8 8Q-2 21 10 33M32 8q10 13-2 25M4 17l4 1M5 25l4-1M36 17l-4 1M35 25l-4-1"/>',
 '<path d="M4 4h32v27L20 38 4 31zM4 27l8 4M36 27l-8 4"/>',
 '<circle cx="20" cy="20" r="16"/><path d="M12 6 10 1l7 3 3-4 3 4 7-3-2 5M7 30l-3 8 9-3M33 30l3 8-9-3"/>',
 '<path d="M5 13V3h8v5h14V3h8v10h3v24H2V13z"/>',
 '<circle cx="20" cy="20" r="15"/><path d="M20 0v4M20 36v4M0 20h4M36 20h4M5 5l3 3M32 32l3 3M5 35l3-3M32 8l3-3"/>',
 '<path d="M20 1 29 5 35 12 39 20 35 29 29 35 20 39 11 35 5 29 1 20 5 11 11 5z"/><circle cx="20" cy="20" r="16"/>'
];
for(let n=1;n<=200;n++){
 const motif=motifs[(n-1)%20],border=borders[Math.floor((n-1)/20)];
 fs.writeFileSync(`public/icons/prestige-${n}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 54" fill="none" stroke="#dfc38c" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(4 3)">${border}<g transform="translate(4 4) scale(.8)"><path d="${motif}"/></g></g><text x="24" y="52" text-anchor="middle" fill="#f1dbac" stroke="none" font-size="8" font-family="Georgia,serif">${n}</text></svg>`);
}
console.log('200 distinct prestige symbol and heraldry combinations written');
