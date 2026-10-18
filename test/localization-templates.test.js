import test from 'node:test';
import assert from 'node:assert/strict';
import {createTranslator,languages} from '../public/i18n.js';
import {makeHtmlTranslator,templateKeys} from '../public/localization.js';
import {rankNames} from '../public/rank-names.js';
import {languageControl} from '../public/language-ui.js';
test('template localization translates only static UI text, never names, ranks, chat or IDs',()=>{
 const h=makeHtmlTranslator(createTranslator('nl'));
 const name='My family <b>Bank</b> $&',rank='The Godfather',message='Send message';
 assert.equal(h`<h2>${name}</h2><p>Send message</p><span>${rank}</span><blockquote>${message}</blockquote>`,`<h2>${name}</h2><p>Bericht verzenden</p><span>${rank}</span><blockquote>${message}</blockquote>`);
 assert.equal(h`<button data-action="Send message" title="Send message">Send message</button>`,'<button data-action="Send message" title="Bericht verzenden">Bericht verzenden</button>');
 assert.equal(h`<button>Sell for ${'$5,000'}</button>`,'<button>Sell for $5,000</button>'); // different slot number => safe fallback
 for(const name of rankNames)assert.equal(createTranslator('nl')(name),name);
});
test('English rendering remains byte-for-byte compatible and translated HTML attributes are escaped',()=>{
 const en=makeHtmlTranslator(createTranslator('en'),false);assert.equal(en`<p>  Cash &amp; bank: ${'$1'} </p>`,'<p>  Cash &amp; bank: $1 </p>');
 const fake=makeHtmlTranslator((key,values)=>key==='Message'?'<script>"&':key.replace('{v0}',values?.v0||''));
 assert.equal(fake`<input placeholder="Message">`,'<input placeholder="&lt;script&gt;&quot;&amp;">');
 assert.deepEqual(templateKeys(['<p>Batch #',' · ','</p>']),['Batch #{v0} · {v1}']);
 const fragment=makeHtmlTranslator(key=>key==='Minimum reward'?'Minimumbeloning':key);
 assert.equal(fragment('<label>Minimum reward<input value="'),'<label>Minimumbeloning<input value="');
 assert.deepEqual(templateKeys(['<input title="Current > next">']),['Current > next']);
});
test('French, German and Spanish are visible coming-soon options without enabling incomplete translations',()=>{
 const html=languageControl();for(const code of ['fr','de','es']){assert.equal(languages[code].ready,false);assert.ok(html.includes('/icons/flag-'+code+'.svg'));assert.ok(html.includes(code.toUpperCase()));}
 assert.equal(languages.nl.ready,true);
});
