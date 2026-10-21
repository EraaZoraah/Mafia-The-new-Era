// Local, deterministic language hints. Shared game names are deliberately ignored.
const hints={
 en:{strong:'what when who where which why how buy buying sell selling should can could explain show help hello hi please rising falling cheapest recommend',weak:'what when who does works need want most best now my me the this that with have'},
 nl:{strong:'wat wanneer waar welke waarom hoe kopen koop verkopen verkoop moet kun kan werkt helpen hallo graag uitleg laat toon stijgen dalen goedkoopste aanrader',weak:'wat wanneer wie mijn mij het deze die dit een ik nu heb hebben beste meest'},
 es:{strong:'donde cual cuales comprar compro vender vendo puedo puedes deberia funciona ayuda hola gracias cuanto producir subir bajar recomiendas',weak:'que como cuando quien moneda monedas necesito quiero ahora mejor mas mi tengo para rentable rentables'},
 fr:{strong:'ou quelle quelles quel acheter achete vendre vends peux puis fonctionne aide bonjour merci pourquoi comment combien produire monter baisser conseillez expliquez',weak:'quand qui monnaie monnaies dois voudrais maintenant meilleur meilleure mes avec est les des pour rentable rentables plus'},
 de:{strong:'was wo welche welcher welches warum wie kaufen kaufe verkaufen verkaufe kann kannst sollte funktioniert helfen hallo danke erklaren steigen fallen gunstig empfehlen',weak:'wann wer munze munzen brauche mochte jetzt beste besten mein meine ich der das mit ist'}
};
const normalize=s=>String(s||'').slice(0,500).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const dictionaries=Object.fromEntries(Object.entries(hints).map(([lang,h])=>[lang,{strong:new Set(h.strong.split(' ')),weak:new Set(h.weak.split(' '))}]));
export function guideLanguage(question,fallback='en'){
 if(!Object.hasOwn(hints,fallback))fallback='en';
 const source=normalize(question),tokens=new Set(source.match(/[a-z]+/g)||[]);
 if(tokens.size<2&&!/^(?:hello|bonjour|hola|hallo|hi)[!. ]*$/.test(source))return {language:fallback,source:'interface'};
 const scores=Object.entries(dictionaries).map(([language,h])=>({language,score:[...tokens].reduce((n,w)=>n+(h.strong.has(w)?3:h.weak.has(w)?1:0),0)+(language==='fr'&&/qu[’']?est[ -]ce que/.test(source)?6:0)+(language==='es'&&(/\b(?:que|cual) (?:es|son|puedo)\b/.test(source)||/¿|qué|cuál/i.test(String(question)))?6:0)})).sort((a,b)=>b.score-a.score);
 const [first,second]=scores;
 const confident=first.score>=3&&first.score-second.score>=2;
 return {language:confident?first.language:fallback,source:confident?'question':'interface'};
}
