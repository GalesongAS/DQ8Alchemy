const characters = new Set(['hero', 'yangus', 'jessica', 'angelo']);
const identifier = /^[a-z0-9_]+$/;

function uniqueIds(records, label) {
  if (!Array.isArray(records) || !records.length) throw Error('Empty or invalid ' + label);
  const ids = new Set();
  for (const record of records) {
    if (typeof record?.id !== 'string' || !identifier.test(record.id) || ids.has(record.id)) {
      throw Error('Invalid or duplicate ' + label + ' ID: ' + record?.id);
    }
    ids.add(record.id);
  }
  return ids;
}

export function validateCatalog(items, recipes, masterpiece) {
  const ids = uniqueIds(items, 'item');
  uniqueIds(recipes, 'recipe');
  for (const item of items) {
    if (typeof item.name !== 'string' || !item.name.trim() ||
        ('category' in item && (typeof item.category !== 'string' || !item.category.trim())) ||
        ('isIngredient' in item && typeof item.isIngredient !== 'boolean') ||
        ('usableBy' in item && (!Array.isArray(item.usableBy) || item.usableBy.some(id => !characters.has(id))))) {
      throw Error('Invalid metadata for item ' + item.id);
    }
  }
  const combinations = new Set();
  for (const recipe of recipes) {
    const parts = recipe.ingredientIds;
    if (!ids.has(recipe.resultId) || !Array.isArray(parts) || ![2, 3].includes(parts.length) ||
        parts.some(id => !ids.has(id)) || ('notes' in recipe && typeof recipe.notes !== 'string') ||
        ('masterpieceExclusive' in recipe && (typeof recipe.masterpieceExclusive !== 'boolean' || (recipe.masterpieceExclusive && !masterpiece)))) {
      throw Error('Invalid recipe ' + recipe.id);
    }
    const key = JSON.stringify([recipe.resultId, [...parts].sort()]);
    if (combinations.has(key)) throw Error('Duplicate combination ' + recipe.id);
    combinations.add(key);
  }
}

// Ownership is binary. One selected ID satisfies every occurrence in a recipe.
export function evaluate(recipe, selected) {
  const total = recipe.ingredientIds.length;
  const have = recipe.ingredientIds.filter(id => selected.has(id)).length;
  return {recipe, total, have, missing: total - have, complete: total === have, score: have / total};
}

export function matches(details, selected, {craftOnly, matchAny}) {
  if (craftOnly) return details.complete;
  if (!selected.size) return true;
  if (matchAny) return details.have > 0;
  for (const id of selected) if (!details.recipe.ingredientIds.includes(id)) return false;
  return true;
}
