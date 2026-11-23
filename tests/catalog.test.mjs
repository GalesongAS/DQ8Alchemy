import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCatalog, evaluate, matches} from '../catalog.mjs';

for (const edition of ['', 'masterpiece-reborn/']) {
  test('Validate shipped catalog ' + (edition || 'standard'), () => {
    const read = name => JSON.parse(readFileSync(new URL('../data/' + edition + name + '.json', import.meta.url)));
    validateCatalog(read('items'), read('recipes'), Boolean(edition));
  });
}

const items = ['bronze_knife','axe','herb'].map(id => ({id, name:id}));
const recipe = {id:'knife_pair', resultId:'axe', ingredientIds:['bronze_knife','bronze_knife']};
test('Binary ownership and all matching modes', () => {
  const owned = new Set(['bronze_knife']);
  const full = evaluate(recipe, owned);
  assert.equal(full.have, 2);
  assert.ok(matches(full, owned, {craftOnly:true}));
  owned.add('herb');
  assert.ok(matches(full, owned, {craftOnly:true}));
  assert.ok(matches(full, owned, {matchAny:true}));
  assert.equal(matches(full, owned, {}), false);
  const three = {...recipe, ingredientIds:[...recipe.ingredientIds,'herb']};
  const partial = evaluate(three,new Set(['herb']));
  assert.equal(partial.have,1);
  assert.equal(matches(partial,new Set(['herb']),{craftOnly:true}),false);
  assert.ok(matches(partial,new Set(['herb']),{}));
  assert.equal(evaluate(three,new Set()).have,0);
});
test('Alternate combinations can share an output', () => {
  validateCatalog(items,[recipe,{...recipe,id:'alternate',ingredientIds:['axe','herb']}],false);
});
test('Malformed catalogs fail before use', () => {
  for (const bad of [[], [recipe,recipe], [{...recipe,resultId:'unknown'}],
    [{...recipe,ingredientIds:['missing','axe']}], [{...recipe,ingredientIds:'axe'}],
    [recipe,{...recipe,id:'copy'}], [{...recipe,masterpieceExclusive:true}]]) {
    assert.throws(() => validateCatalog(items,bad,false));
  }
  for (const bad of [[...items,items[0]], [{id:'axe'}], [{id:'axe',name:'A',usableBy:'hero'}]]) {
    assert.throws(() => validateCatalog(bad,[recipe],false));
  }
});
