// Fictional in-game values. Historical collector cars complement the modern fleet.
export const extraStolenCars=[
 ['citroen-2cv','Citroën 2CV',18000,140],['vw-beetle-classic','Volkswagen Beetle Classic',26000,125],
 ['volvo-240','Volvo 240 Estate',38000,110],['ford-mustang-1965','Ford Mustang 1965',95000,65],
 ['mini-cooper-classic','Mini Cooper Classic',45000,100],['alfa-spider','Alfa Romeo Spider',125000,50],
 ['bmw-e30','BMW 325i E30',180000,40],['mercedes-190e','Mercedes-Benz 190 E',220000,35],
 ['toyota-supra-mk4','Toyota Supra Mk IV',650000,14],['honda-nsx-classic','Honda NSX Classic',850000,10],
 ['jaguar-xjs','Jaguar XJS Convertible',400000,22],['porsche-944','Porsche 944 Turbo',550000,18],
 ['cadillac-eldorado','Cadillac Eldorado',1100000,8],['bentley-azure','Bentley Azure',1600000,6],
 ['aston-db9','Aston Martin DB9',2200000,5],['ferrari-testarossa','Ferrari Testarossa',6500000,3],
 ['lamborghini-countach','Lamborghini Countach',12000000,2],['jaguar-etype','Jaguar E-Type Roadster',18000000,1],
 ['porsche-959','Porsche 959',28000000,1],['ferrari-f40','Ferrari F40',45000000,1]
].map(([id,name,value,weight])=>({id,name,value,weight,image:'/images/vehicle-'+id+'.png'}));
export const collectorCars=[
 ['audi-a7','Audi A7 Sportback',1300000,'Executive'],['bmw-m440','BMW M440i Convertible',1550000,'Performance'],
 ['mercedes-cle','Mercedes-Benz CLE Cabriolet',1750000,'Grand touring'],['lexus-ls','Lexus LS 500',2100000,'Luxury'],
 ['genesis-g90','Genesis G90',2350000,'Luxury'],['porsche-panamera','Porsche Panamera Turbo',3200000,'Performance'],
 ['maserati-granturismo','Maserati GranTurismo',4200000,'Grand touring'],['bentley-flying-spur','Bentley Flying Spur',5800000,'Ultra luxury'],
 ['rolls-dawn','Rolls-Royce Dawn',8500000,'Ultra luxury'],['mercedes-pagoda','Mercedes-Benz 280 SL Pagoda',15000000,'Classic collector'],
 ['bmw-507','BMW 507 Roadster',45000000,'Classic collector'],['mercedes-300sl-roadster','Mercedes-Benz 300 SL Roadster',65000000,'Classic collector'],
 ['aston-db5','Aston Martin DB5',95000000,'Classic collector'],['lamborghini-miura','Lamborghini Miura SV',145000000,'Classic collector'],
 ['alfa-8c-classic','Alfa Romeo 8C 2900 Spider',280000000,'Museum collector'],['ferrari-250-california','Ferrari 250 GT California Spyder',450000000,'Museum collector'],
 ['bugatti-57sc','Bugatti Type 57SC Atlantic',850000000,'Museum collector'],['ferrari-250-gto','Ferrari 250 GTO',1500000000,'Museum collector']
].map(([id,name,price,tier],i)=>({id,name,price,tier,category:'car',income:0,limit:1,image:'/images/car-'+id+'.png',perks:{rewardBps:Math.min(70,30+i*2)},title:'Collector · '+name,unlock:'Midnight getaway',description:'A private collection car. Requires a free garage bay. One per model; resale returns 80% of the paid price.'}));

// Recognizable executive cars pictured in the overview artwork. These are
// collection vehicles, not passive businesses; all ordinary garage rules apply.
export const bannerCars=[
 ['escalade','Cadillac Escalade',3600000,'Luxury SUV'],
 ['maybach-s680','Mercedes-Maybach S 680',6500000,'Ultra luxury'],
 ['phantom-extended','Rolls-Royce Phantom Extended',12000000,'Ultra luxury'],
 ['phantom-limousine','Rolls-Royce Phantom Limousine',22000000,'Bespoke limousine'],
 ['jaguar-xk120','Jaguar XK120 Roadster',28000000,'Classic collector'],
 ['urus','Lamborghini Urus',3800000,'Luxury SUV'],
 ['chiron','Bugatti Chiron',20000000,'Hypercar'],
].map(([id,name,price,tier])=>({id,name,price,tier,category:'car',income:0,limit:1,
 image:'/images/car-'+id+'.png',perks:{rewardBps:50},title:'Collector · '+name,
 unlock:'Midnight getaway',description:'A private collection car. Requires a free garage bay. One per model; resale returns 80% of the paid price.'}));
collectorCars.push(...bannerCars);
