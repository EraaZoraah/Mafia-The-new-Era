import test from 'node:test';
import assert from 'node:assert/strict';
import {guideLanguage} from '../guide-language.js';
import {fixture} from './helpers/game-fixture.js';
const questions={en:'Which crypto coin should I buy now and why?',nl:'Welke cryptomunt moet ik nu kopen en waarom?',es:'¿Qué criptomoneda debería comprar ahora?',fr:'Quelle monnaie dois-je acheter maintenant ?',de:'Welche Kryptowährung sollte ich jetzt kaufen?'};
test('question language overrides every interface language for clear supported questions',()=>{
 for(const [language,question] of Object.entries(questions))for(const fallback of Object.keys(questions))assert.deepEqual(guideLanguage(question,fallback),{language,source:'question'});
 for(const [q,lang] of [['Waar kan ik kogels kopen?','nl'],['Where can I buy ammunition?','en'],['Où puis-je acheter des armes ?','fr'],['Wie kann ich Waffen kaufen?','de'],['¿Dónde puedo comprar armas?','es'],['Is crypto rising?','en'],['Gaat crypto stijgen?','nl'],['¿Qué cripto?','es'],['Quelle drogue est la plus rentable à produire ?','fr'],['mejor droga para producir','es']])assert.equal(guideLanguage(q,'en').language,lang);
});
test('empty, ambiguous, mixed and game-only questions keep the selected language',()=>{
 for(const lang of Object.keys(questions))for(const q of ['', 'crypto?', 'Omerta', 'The Godfather', 'Midnight Circuit', 'total crypto profit', 'income cap', 'help', 'hello bonjour'])assert.deepEqual(guideLanguage(q,lang),{language:lang,source:'interface'});
 assert.equal(guideLanguage('crypto?',null).language,'en');
});
test('live guide answers in question language without changing stored preference or balances',t=>{
 const f=fixture(t);f.run("UPDATE users SET ui_language='en' WHERE id=1");const before=f.q('SELECT cash,xp,ui_language FROM users WHERE id=1');
 const prefixes={en:'Live crypto watchlist',nl:'Actuele cryptocontrolelijst',es:'Lista cripto actual',fr:'Liste crypto actuelle',de:'Aktuelle Krypto-Beobachtungsliste'};
 for(const [language,q] of Object.entries(questions))for(const fallback of Object.keys(questions)){
  const response=f.call('guide?lang='+fallback+'&q='+encodeURIComponent(q));assert.equal(response.status,200);assert.equal(response.body.language,language);assert.equal(response.body.languageSource,'question');assert.ok(response.body.answer.startsWith(prefixes[language]));assert.equal(response.body.links[0].tab,'crypto');
 }
 assert.deepEqual(f.q('SELECT cash,xp,ui_language FROM users WHERE id=1'),before);
 const empty=f.call('guide?lang=de').body;assert.equal(empty.language,'de');assert.equal(empty.languageSource,'interface');
});
