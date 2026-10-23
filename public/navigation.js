// The sidebar and Luca share this page catalog. Layout sections are presentation only.
export const navigationSections=[
 {id:'overview',label:'Overview',items:[['dashboard','Dashboard'],['activity','My activity'],['daily','Daily objectives'],['bulletins','Announcements & events'],['messages','Messages']]},
 {id:'world',label:'Your world',items:[
  {id:'character',label:'My character',items:[['profile','My profile'],['marriage','Marriage'],['achievements','Introduction & achievements'],['ranks','Ranks & rewards'],['respect','Player respect'],['referrals','Beta referrals']]},
  {id:'operations',label:'Crimes & missions',items:[['missions','Crimes'],['art-market','Art & antiquities'],['team-missions','Team missions'],['bounties','Bounties'],['shipments','Drugs & gun shipments'],['combat','Player operations'],['production','Drug production'],['security','Protection & muscle']]},
  {id:'personal',label:'My empire',aliases:['Personal assets'],items:[['inventory','My possessions'],['employees','Employees'],['armory','Weapons & ammunition'],['business','Businesses'],['home','Real estate'],['garage','Private garages'],['warehouses','Warehouses'],['car','Cars'],['helicopter','Helicopters'],['jet','Private jets'],['yacht','Yachts']]},
  {id:'family-hub',label:'My family',items:[['families','Family dashboard'],['family-chat','Family chat'],['family-plans','Attack planning'],['rivals','Rival families'],['seasons','Family seasons'],['family-assets','Family possessions'],['family-territory','Territory'],['family-armory','Weapons & ammunition'],['family-safehouses','Safehouses'],['family-compounds','Master compounds'],['family-fleet','Family cars'],['family-upgrades','Security upgrades']]},
  {id:'finances',label:'Money & trading',aliases:['Finances'],items:[['bank','Bank'],['investments','Investments'],['crypto','Crypto exchange'],['auction-house','Auction house'],['transfers','Player transfers']]},
  {id:'city',label:'The city',aliases:['The underworld'],items:[['airport','Airport'],['circuit','Midnight Circuit'],['casino','Casino'],['directory','All players'],['family-directory','All families'],['underworld','Underworld rankings'],['hospital','Hospital'],['prison','Prison']]},
  {id:'community',label:'Help & information',items:[['support','Support & reports'],['policy','Community & privacy'],['rules','Game rules'],['faq','FAQ']]}
 ]},
 {id:'extras',label:'Extras & staff',items:[['boutique','Premium shop'],['tickets','Support tickets'],['admin','Owner Panel']]}
];
export const menu=navigationSections.flatMap(section=>section.items);
