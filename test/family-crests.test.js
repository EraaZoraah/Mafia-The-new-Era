import {crestMarkup,crestArtwork} from '../public/community-ui.js';
import {createTranslator} from '../public/i18n.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/game-fixture.js';
import {familyCrests} from '../community.js';
import {gameKnowledge} from '../game-knowledge.js';
test('illustrated crests persist, remain protected, and appear in directory',t=>{const f=fixture(t);for(const crest of familyCrests){const r=f.call('family/preferences',{mode:'open',theme:'gold',crest,motto:'Loyalty'});assert.equal(r.status,200,JSON.stringify(r));assert.equal(f.call('family/dashboard').body.family.preferences.crest,crest);assert.equal(f.call('family-directory').body.families.find(x=>x.id===1).crest,crest);}assert.equal(f.call('family/preferences',{mode:'open',theme:'gold',crest:'dragon',motto:''},2).status,403);assert.equal(f.call('family/preferences',{mode:'open',theme:'gold',crest:'../../outside',motto:''}).status,400);f.reset();assert.equal(f.call('family/dashboard').body.family.preferences.crest,'wolf');});
test('Luca indexes every selectable crest in both languages',()=>{for(const lang of ['en','nl']){const entries=gameKnowledge(lang);for(const crest of familyCrests)assert.ok(entries.some(e=>e.tab==='family'&&e.title.toLowerCase().includes(createTranslator(lang)(crest).toLowerCase())));}});


test('existing saved family choices automatically render the corresponding new artwork',t=>{const f=fixture(t);for(const crest of familyCrests){f.run('INSERT INTO family_preferences(family_id,crest) VALUES(1,?) ON CONFLICT(family_id) DO UPDATE SET crest=excluded.crest',crest);f.reset();const saved=f.call('family/dashboard').body.family.preferences.crest;assert.equal(saved,crest);assert.ok(crestMarkup(saved).includes('/images/family-crest-'+crest+'.png'));assert.ok(!crestMarkup(saved).includes('<path'));}assert.ok(crestMarkup('invalid').includes('/images/family-crest-lion.png'));});

test('all eight crests use the same viewport and their measured silhouette bounds',()=>{assert.equal(Object.keys(crestArtwork).length,8);for(const crest of familyCrests){const markup=crestMarkup(crest),[width,height,x,y,w,h]=crestArtwork[crest];assert.ok(width>0&&height>0&&w>0&&h>0);assert.ok(markup.includes('width="160" height="190" preserveAspectRatio="none"'));assert.ok(markup.includes('viewBox="'+[x,y,w,h].join(' ')+'"'));}});
