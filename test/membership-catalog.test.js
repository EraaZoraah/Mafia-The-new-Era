import test from 'node:test';
import assert from 'node:assert/strict';
import {shopProducts} from '../shop.js';
import {gameKnowledge} from '../game-knowledge.js';
import {createRulesUI} from '../public/rules-ui.js';
import {createTranslator} from '../public/i18n.js';

test('membership rewards and local guide rulebook agree in every available language',()=>{
 const silver=shopProducts.find(p=>p.id==='supporter'),gold=shopProducts.find(p=>p.id==='grand-supporter');
 assert.deepEqual([silver.cash,silver.xp,silver.cents,silver.days,silver.bonusPercent],[75000000,100000,499,30,10]);
 assert.deepEqual([gold.cash,gold.xp,gold.cents,gold.days,gold.bonusPercent],[200000000,250000,999,30,25]);
 const chapter=createRulesUI({}).chapters.find(([name])=>name==='Supporter memberships')[1];
 for(const language of ['en','nl','es','fr','de']){
  const text=createTranslator(language)(chapter),facts=gameKnowledge(language);
  assert.ok(facts.some(f=>f.text.includes(text)),language+' Luca indexes the same membership rules');
  for(const value of ['75,000,000','100,000','200,000,000','250,000'])assert.ok(text.includes(value),language+' '+value);
  assert.doesNotMatch(text,/125[,. ]000[,. ]000|375[,. ]000[,. ]000|750[,. ]000 XP/);
 }
});
