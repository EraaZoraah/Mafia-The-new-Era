from pathlib import Path
root=Path(__file__).resolve().parent.parent/'public/icons'
paths={
'employees':'M6 34v-7q0-7 8-7h12q8 0 8 7v7M15 11a5 5 0 1 0 10 0a5 5 0 1 0-10 0M7 11a4 4 0 0 0 0 8M33 11a4 4 0 0 1 0 8M17 23l3 4 3-4M20 27v7',
'family-armory':'M6 6h28v28H6zM11 13h18v6H19l-3 10h-5l3-10h-3zM25 24v5M29 24v5',
'family-fleet':'M5 25l3-10h24l3 10v9h-5v-4H10v4H5zM5 25h30M10 15l3-7h14l3 7M10 26h4M26 26h4',
'family-territory':'M4 10l10-5 12 5 10-5v25l-10 5-12-5-10 5zM14 5v25M26 10v25M19 16l2 4 4 1-4 2-1 4-2-4-4-1 4-2z',
'family-upgrades':'M20 4l14 6v10q0 10-14 16Q6 30 6 20V10zM14 18v10h12V18zM16 18v-4a4 4 0 0 1 8 0v4M20 22v3',
'finances':'M5 13h30v21H5zM5 13l23-7v7M27 21h8v7h-8zM11 20h7M11 26h5',
'garage':'M4 34V12l16-8 16 8v22M9 34V15h22v19M10 20h20M10 25h20M10 30h20',
'home':'M3 19L20 5l17 14M8 17v18h24V17M16 35V24h8v11M14 16h4M24 16h2',
'inventory':'M5 12l15-7 15 7-15 7zM5 12v18l15 7 15-7V12M20 19v18M12 9l15 7v6',
'jet':'M18 4h4l1 12 13 9v4l-13-4-1 8 5 3H13l5-3-1-8-13 4v-4l13-9z',
'missions':'M7 4h26v32H7zM13 12h5M13 19h5M13 26h5M23 11l2 2 4-4M23 18l2 2 4-4M23 25l2 2 4-4',
'policy':'M20 4l14 6v12q-3 9-14 14Q9 31 6 22V10zM20 13v10M20 28h.01',
'production':'M11 5h18M15 5v10L6 30q-2 5 4 5h20q6 0 4-5l-9-15V5M12 25h16M15 29h2M23 31h2',
'profile':'M13 13a7 7 0 1 0 14 0a7 7 0 1 0-14 0M6 35v-4q0-9 14-9t14 9v4z',
'ranks':'M20 4l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1zM12 34h16M16 37h8',
'rivals':'M9 6l11 6 11-6v15q0 8-11 15Q9 29 9 21zM14 17l5 4M26 17l-5 4M15 27h10',
'rules':'M5 7q8-4 15 1 7-5 15-1v27q-8-4-15 0-7-4-15 0zM20 8v26M9 13h7M9 19h7M24 13h7M24 19h7',
'seasons':'M13 5h14v11q0 8-7 8t-7-8zM13 9H6v7q0 6 9 5M27 9h7v7q0 6-9 5M20 24v8M12 36v-4h16v4z',
'security':'M20 5l13 6v11q-2 9-13 14Q9 31 7 22V11zM13 20l5 5 10-12',
'shipments':'M3 29V12h21v17zM24 18h8l5 8v3H24M7 31a3 3 0 1 0 6 0a3 3 0 1 0-6 0M27 31a3 3 0 1 0 6 0a3 3 0 1 0-6 0M9 8h12M13 4h8',
'support':'M6 22v-4a14 14 0 0 1 28 0v10q0 6-10 6M6 18h5v12H6zM29 18h5v12h-5zM19 32h6v4h-6z',
'team-missions':'M4 33v-6q0-5 8-5M36 33v-6q0-5-8-5M16 10a4 4 0 1 0 8 0a4 4 0 1 0-8 0M5 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0M27 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0M13 35v-8q0-8 7-8t7 8v8z',
'transfers':'M4 12h29l-6-6M33 12l-6 6M36 28H7l6-6M7 28l6 6M18 18h4v4h-4z',
'underworld':'M5 34V20h6v14M15 34V10h10v24M29 34V24h6v10M18 5h4M18 15h4M18 21h4M18 27h4',
}
for name,path in paths.items():
 if not (root/f'menu-{name}.svg').exists():(root/f'menu-{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" stroke="#dfc38c" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="{path}"/></svg>',encoding='utf-8')
print('24 page-specific symbols written')
