import {spanish,french,german,createTranslator} from './public/i18n.js';
import {rankNames} from './public/rank-names.js';
import {catalogProperNames} from './public/catalog-proper-names.js';
import {translateGenerated} from './public/generated-locale.js';

const dictionaries={es:spanish,fr:french,de:german};
const patterns=new Map();
const normalize=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Authored reply fragments only. This is never applied to chat, bios or tickets.
function guidePattern(language){
 if(patterns.has(language))return patterns.get(language);
 const dictionary=dictionaries[language],fragments=Object.keys(dictionary).filter(k=>k.trim().length>=2&&!/\{[A-Za-z]/.test(k)&&dictionary[k]!==k&&!rankNames.includes(k)&&!catalogProperNames.includes(k)).sort((a,b)=>b.length-a.length);
 const pattern=new RegExp(fragments.map(k=>(/^\w/.test(k)?'(?<![\\p{L}\\p{N}])':'')+escape(k)+(/\w$/.test(k)?'(?![\\p{L}\\p{N}])':'')).join('|')||'(?!)','gu');
 patterns.set(language,pattern);return pattern;
}

export function localizedGuideText(text,protectedNames=[],language='es'){
 if(typeof text!=='string')return text;
 const t=createTranslator(language),pattern=guidePattern(language);
 const exact=t(text);if(exact!==text)return exact;
 if(text.includes('\n\n'))return text.split('\n\n').map(part=>localizedGuideText(part,protectedNames,language)).join('\n\n');
 const generated=translateGenerated(text,language,false,true);
 const protectedValues=[...new Set([...rankNames,...catalogProperNames,...protectedNames].filter(Boolean))].sort((a,b)=>b.length-a.length);
 const saved=[];let source=generated;
 const protectedPattern=new RegExp(protectedValues.map(escape).join('|')||'(?!)','g');
 source=source.replace(protectedPattern,value=>{saved.push(value);return '\uE100'+(saved.length-1)+'\uE101'});
 source=source.replace(pattern,key=>t(key));
 return source.replace(/\uE100(\d+)\uE101/g,(_,i)=>saved[Number(i)]);
}

// Spanish questions select the same authoritative quote paths as English ones.
export function spanishGuideQuery(question){
 const q=normalize(question).replace(/[¿¡?!]/g,'').trim().slice(0,500);
 if(!q||/^(?:hola|ayuda|que puedo hacer|como empezar|que hago ahora)[?!. ]*$/.test(q))return '';
 const topics=[
  [/idioma|espanol|ingles|neerlandes/,'language'],
  [/referid|recomendar.*amig|invit.*amig/,'referral'],
  [/ingres.*(?:24|limite|cobrar|recoger)|(?:cobrar|recoger).*ingres/,'income cap'],
  [/mejor.*(?:droga|produccion)|(?:droga|produccion|mercado|carga|transporte).*rentab|almacen.*produccion/,'best drug production market'],
  [/premio.*arte|logro.*(?:arte|antig)|fenix|corona.*platino/,'crown jewels art achievement'],
  [/logro.*(?:pristine|pristino)|(?:pristine|pristino).*logro/,'pristine achievement'],
  [/subasta|pujar|puja|comision/,'auction house'],
  [/soborno|sobornar|policia.*pagar/,'police bribe'],
  [/carrera|circuito|conductor|correr/,'midnight circuit race'],
  [/territorio|conquistar|mapa/,'family territory capture map'],
  [/coche.*rob|vehiculo.*rob|condicion|estrellas|pristino/,'stolen vehicle condition warehouse'],
  [/droga|produccion|cocaina|cannabis|hachis|extasis|metanfetamina/,'drug production market'],
  [/fuga|fugar|escapar.*carcel/,'prison breakout'],
  [/alianza|aliado/,'family alliance'],
  [/familia.*chat|chat.*familia/,'family chat'],
  [/plan.*ataque/,'attack planning'],
  [/envio.*arma|cargamento.*arma/,'gun shipment'],
  [/recompensa.*(?:matar|liquid)|lista.*recompensa/,'bounties'],
  [/arma|municion|balas/,'weapons ammunition'],
  [/matrimonio|casar|boda/,'marriage'],
  [/empleado|personal.*contratar/,'employees'],
  [/negocio|empresa/,'business'],
  [/casa|vivienda|inmueble|villa/,'real estate'],
  [/cripto|moneda|cartera/,'crypto'],
  [/inversion|invertir|interes/,'investments'],
  [/transferir|transferencia|donar.*energia/,'transfers'],
  [/avion|aeropuerto|volar|viajar/,'airport'],
  [/proteccion|guardaespaldas|seguridad/,'protection'],
  [/liquidar|secuestrar|robar.*jugador|atacar.*jugador/,'player operations pvp'],
  [/hospital|coma/,'hospital'],
  [/carcel|prision|fianza/,'prison'],
  [/mision.*equipo|equipo.*mision/,'team mission'],
  [/objetivo|diari/,'daily objectives'],
  [/logro|medalla/,'achievement'],
  [/rango|experiencia|subir.*nivel/,'rank xp'],
  [/temporada/,'family seasons'],
  [/familia|capo|consigliere|don\b/,'families'],
  [/casino|ruleta|tragaperras|loteria|blackjack|poker/,'casino'],
  [/regla|norma|pregunta.*frecuente/,'rules'],
  [/soporte|error|problema|denunciar|bloquear|silenciar/,'support reports'],
  [/mensaje|conversacion/,'messages'],
  [/respeto/,'respect'],
  [/mision|delito|crimen|dinero|ganar/,'crimes']
 ];
 const selected=topics.find(([re])=>re.test(q));return selected?selected[1]:question;
}

export function localizedGuideQuery(question,language){
 if(language==='es')return spanishGuideQuery(question);
 const q=normalize(question).replace(/[?!]/g,'').trim().slice(0,500);
 if(!q||/^(bonjour|salut|aide|hallo|hilfe|was kann ich tun|que puis-je faire|comment commencer)$/.test(q))return '';
 const dictionary=dictionaries[language]||{};
 const identity=Object.keys(dictionary).find(k=>k.length<100&&normalize(dictionary[k])===q);
 if(identity)return identity;
 const topics=[
  [/langue|francais|allemand|sprache|deutsch|franzosisch/,'language'],
  [/parrain|filleul|empfehl|werben|freunde.*einlad/,'referral'],
  [/revenu.*(?:24|limite|recuper|collect)|einkommen.*(?:24|limit|abhol|einsammel)/,'income cap'],
  [/drogue|production|produire|cocaine|cannabis|herstellen|drogen|produktion/,'best drug production market'],
  [/diamant.*phenix|couronne.*platine|platin.*krone|phoenix/,'crown jewels art achievement'],
  [/succes.*pristine|erfolg.*pristine/,'pristine achievement'],
  [/enchere|encherir|auktion|bieten/,'auction house'],
  [/corrompre|pot.de.vin|bestech|schmiergeld/,'police bribe'],
  [/course|circuit|pilote|rennen|rennstrecke|fahrer/,'midnight circuit race'],
  [/territoire|conquer|conquet|carte|territorium|erober|gebiete|karte/,'family territory capture map'],
  [/voiture.*vole|vehicule.*vole|gestohlen|geklaut|zustand|etat.*voiture/,'stolen vehicle condition warehouse'],
  [/evasion|evader|ausbruch|ausbrechen|gefangnis.*flucht/,'prison breakout'],
  [/alliance|allie|bundnis|verbundet/,'family alliance'],
  [/chat.*famill|famill.*chat|familienchat/,'family chat'],
  [/plan.*attaque|angriffsplan/,'attack planning'],
  [/livraison.*arme|expedition.*arme|waffen.*liefer|waffentransport/,'gun shipment'],
  [/prime.*tete|contrat.*tuer|kopfgeld/,'bounties'],
  [/arme|munition|balle|waffe|kugel/,'weapons ammunition'],
  [/mariage|marier|epouser|heirat|hochzeit/,'marriage'],
  [/employe|recruter|mitarbeiter|angestellte/,'employees'],
  [/entreprise|commerce|affaire|unternehmen|geschaft/,'business'],
  [/immobilier|maison|villa|immobilien|haus|wohnung/,'real estate'],
  [/crypto|monnaie|portefeuille|krypto|munze|wallet/,'crypto'],
  [/invest|interet|anlagen|zinsen/,'investments'],
  [/virement|transfer|envoyer.*argent|energie.*spend|uberweis/,'transfers'],
  [/avion|aeroport|voyager|voler.*ville|flug|fliegen|reisen/,'airport'],
  [/protection|garde.du.corps|securite|schutz|leibwachter|sicherheit/,'protection'],
  [/enlev|kidnapp|liquid|attaquer.*joueur|angriff.*spieler|spieler.*angreif|ausrauben/,'player operations pvp'],
  [/hopital|coma|krankenhaus|koma/,'hospital'],
  [/prison|caution|gefangnis|kaution/,'prison'],
  [/mission.*equipe|equipe.*mission|teammission/,'team mission'],
  [/objectif|quotidien|taglich|tagesziel/,'daily objectives'],
  [/succes|medaille|accomplissement|erfolg|auszeichnung/,'achievement'],
  [/rang|experience|niveau|xp|erfahrung|level/,'rank xp'],
  [/saison/,'family seasons'],
  [/famille|familie/,'families'],
  [/casino|roulette|loterie|loterie|blackjack|poker|spielautomat|lotterie/,'casino'],
  [/regle|reglement|faq|regel/,'rules'],
  [/support|assistance|bug|erreur|signaler|bloquer|stumm|melden|fehler|hilfe/,'support reports'],
  [/message|conversation|nachricht/,'messages'],
  [/respect|respekt/,'respect'],
  [/garage|voiture|vehicule|auto|fahrzeug/,'cars garage'],
  [/mission|crime|braquage|gagner|argent|verbrechen|geld|verdienen/,'crimes']
 ];
 return topics.find(([pattern])=>pattern.test(q))?.[1]||question;
}

export function localizedGuideReply(reply,user,context){
 const language=context.language||'es';
 const protectedNames=[user?.username,context.family?.name];
 const localize=row=>({...row,label:localizedGuideText(row.label,protectedNames,language),...(row.text?{text:localizedGuideText(row.text,protectedNames,language)}:{})});
 return {...reply,language,answer:localizedGuideText(reply.answer,protectedNames,language),links:(reply.links||[]).map(localize),suggestions:(reply.suggestions||[]).map(localize)};
}
