import fs from 'node:fs';
const paths={
 'menu-airport':'M5 34h30M8 29h27M8 29V15h9v14M6 8h13l-2 7H8zM12 4v4M24 22h12M26 22v-5l7-3v8M11 19h3M11 24h3',
 'menu-achievements':'M13 4h14l-3 10h-8zM12 24a8 8 0 1 0 16 0a8 8 0 1 0-16 0M20 18l2 4 5 1-4 3 1 4-4-2-4 2 1-4-4-3 5-1z',
 'menu-bank':'M3 12l17-8 17 8zM5 16h30M6 34h28M3 37h34M9 16v18M14 16v18M20 16v18M26 16v18M31 16v18',
 'menu-daily':'M7 9h26v26H7zM7 16h26M12 5v8M28 5v8M12 22h4M23 21l3 3 5-6M12 29h4M23 30h7',
 'menu-family-compounds':'M4 35V14h8V6h5v8h6V6h5v8h8v21H4M9 19v6M31 19v6M16 35v-8a4 4 0 0 1 8 0v8M20 18v4',
 'menu-family-assets-menu':'M5 19l15-11 15 11v16H5zM2 19l18-14 18 14M10 24h8v11h-8zM23 24h8v6h-8z',
 'menu-tickets':'M7 4h26v32H7v-7a4 4 0 0 0 0-8zM13 11h14M13 16h9M15 26h2M22 26h2M29 26h1M15 31h12',
 'menu-respect':'M11 6h18v18l-9 6-9-6zM15 10h10v10l-5 4-5-4zM13 30l-3 6 10-3 10 3-3-6',
 'achievement-crime-10':'M13 21q-3-4 0-7l4-1 3 3-1 5zM12 25l6 2-2 6-6-2zM24 12q-3-4 0-7l4-1 3 3-1 5zM23 16l6 2-2 6-6-2z',
 'achievement-crime-100':'M8 18l4-11h16l4 11M5 22q15 6 30 0l-3-4H8zM12 13h16M7 29l13-4 13 4M20 25v10',
 'achievement-crime-500':'M4 35V21h8v14M16 35V12h9v23M29 35V18h7v17M19 18h3M19 24h3M19 30h3M19 3l2 4 5 1-4 3-1-2-3 2-2-4-3-1 5-1z',
 'achievement-crime-1000':'M13 7h14M15 7v9l-5 9h20l-5-9V7M11 25v5h18v-5M8 35h24M17 3v8M23 3v8',
 'achievement-collector':'M7 6h26v29H7zM7 16h26M7 26h26M12 11h2M19 11h2M26 11h2M12 21h2M19 21h2M26 21h2M12 31h2M19 31h2M26 31h2',
 'achievement-big-score-10':'M20 19C4 9 7 1 14 4q6 0 6 9 0-9 6-9c7-3 10 5-6 15M20 19C4 29 8 35 14 32q6 0 6-8 0 8 6 8c7 3 10-4-6-13M20 19l-2 18',
 'achievement-big-score-50':'M10 7v15a10 10 0 0 0 20 0V7h-6v15a4 4 0 0 1-8 0V7zM12 13h2M26 13h2M12 19h2M26 19h2M16 28l2 1M24 28l-2 1M20 2l2 3-2 3-2-3z',
 'achievement-team-10':'M3 16l7-8 7 5 7-2 13 10-7 12-7-3-7 1-7-8zM10 8l11 13 4-4M17 13l-4 4 4 5M24 25l5 4M20 28l4 3',
 'coin-raven':'M7 29l6-7-7-8 10 3 3-10 6 5 10 1-8 4-1 9-8 5-9 2zM19 10l4 2M17 24l7-5M20 30v5M17 35h10',
 'coin-ghost':'M10 32V17a10 10 0 0 1 20 0v15l-5-4-5 4-5-4zM15 18h1M24 18h1M17 23q3 3 6 0',
 'coin-vesper':'M28 5a15 15 0 1 0 7 22A14 14 0 0 1 28 5M11 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
 'coin-silk':'M7 9l22-4 5 24-22 6zM7 9l9 9-4 17M16 18l18 11M16 18l13-13M13 12l13-3M17 26l10 3',
};
for(const [id,path] of Object.entries(paths)){
 if(id.startsWith('coin-'))continue;
 const name='public/icons/'+id+'.svg';if(fs.existsSync(name)&&fs.readFileSync(name,'utf8').includes('data-premium-coin'))continue;let body=`<path d="${path}"/>`,size=40;
 if(id.startsWith('achievement-')){size=80;body='<circle cx="40" cy="40" r="36" stroke="#af925f"/><circle cx="40" cy="40" r="31" stroke="#6d5b3d"/><g transform="translate(20 19)">'+body+'</g>';}
 if(id.startsWith('coin-')){size=64;const symbol={raven:'RVN',ghost:'GHO',vesper:'VSP',silk:'SLK'}[id.slice(5)];body='<circle cx="32" cy="32" r="30"/><circle cx="32" cy="32" r="26" stroke="#6d5b3d"/><g transform="translate(12 6)">'+body+'</g><text x="32" y="56" text-anchor="middle" fill="#ead3a2" stroke="none" font-family="Georgia,serif" font-size="8">'+symbol+'</text>';}
 fs.writeFileSync(name,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none" stroke="#dfc38c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`);
}
console.log(Object.keys(paths).length+' icons refined');
