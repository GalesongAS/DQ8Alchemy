(function () {
  'use strict';

  const STORAGE = {
    selected: 'dq8.selected',
    upgraded: 'dq8.upgraded',
    matchAny: 'dq8.matchAny',
    craftOnly: 'dq8.craftOnly',
    search: 'dq8.search',
    categories: 'dq8.cats',
    characters: 'dq8.chars',
    favorites: 'dq8.favs',
    favoritesOnly: 'dq8.favOnly',
    sort: 'dq8.sort',
  };

  const CHARACTERS = [
    { id: 'hero', name: 'Hero', icon: 'img/chars/hero.png' },
    { id: 'yangus', name: 'Yangus', icon: 'img/chars/yangus.png' },
    { id: 'jessica', name: 'Jessica', icon: 'img/chars/jessica.png' },
    { id: 'angelo', name: 'Angelo', icon: 'img/chars/angelo.png' },
  ];

  const state = {
    items: [],
    ingredients: [],
    recipes: [],
    itemById: new Map(),
    selected: loadSet(STORAGE.selected),
    selectedCategories: loadSet(STORAGE.categories),
    selectedCharacters: loadSet(STORAGE.characters),
    favorites: loadSet(STORAGE.favorites),
    search: loadRaw(STORAGE.search, ''),
    upgraded: loadBoolean(STORAGE.upgraded),
    matchAny: loadBoolean(STORAGE.matchAny),
    craftOnly: loadBoolean(STORAGE.craftOnly),
    favoritesOnly: loadBoolean(STORAGE.favoritesOnly),
    sort: loadRaw(STORAGE.sort, 'relevance'),
  };

  const elements = {
    totalIngredients: byId('total-ingredients'),
    totalRecipes: byId('total-recipes'),
    selectedCount: byId('selected-count'),
    search: byId('ingredient-search'),
    clearSearch: byId('clear-search'),
    upgraded: byId('upgraded-pot'),
    matchAny: byId('match-any'),
    craftOnly: byId('craft-only'),
    clearSelection: byId('clear-selection'),
    ingredientSummary: byId('ingredient-summary'),
    ingredientList: byId('ingredient-list'),
    categoryFilters: byId('category-filters'),
    characterFilters: byId('character-filters'),
    resetFilters: byId('reset-filters'),
    filterSummary: byId('filter-summary'),
    favoritesOnly: byId('favorites-only'),
    recipeCount: byId('recipe-count'),
    sort: byId('recipe-sort'),
    table: byId('recipes-table'),
    recipesBody: byId('recipes-body'),
  };

  reflectSavedState();
  bindEvents();
  loadData();

  async function loadData() {
    try {
      const [items, recipes] = await Promise.all([
        fetchJson('data/items.json'),
        fetchJson('data/recipes.json'),
      ]);

      state.items = items;
      state.ingredients = items.filter((item) => item.isIngredient !== false);
      state.recipes = recipes;
      state.itemById = new Map(items.map((item) => [item.id, item]));
      reconcileSavedState();

      elements.totalIngredients.textContent = String(state.ingredients.length);
      elements.totalRecipes.textContent = String(state.recipes.length);
      elements.recipesBody.setAttribute('aria-busy', 'false');

      renderFilters();
      renderAll();
    } catch (error) {
      console.error(error);
      elements.recipesBody.setAttribute('aria-busy', 'false');
      elements.recipesBody.innerHTML = '<tr><td colspan="7" class="empty-state error">The recipe data could not be loaded. Please refresh the page.</td></tr>';
    }
  }

  function bindEvents() {
    elements.search.addEventListener('input', (event) => {
      state.search = event.target.value || '';
      saveRaw(STORAGE.search, state.search);
      renderIngredientList();
      renderFilterSummary();
    });

    elements.clearSearch.addEventListener('click', clearSearch);

    elements.upgraded.addEventListener('change', (event) => {
      state.upgraded = event.target.checked;
      saveBoolean(STORAGE.upgraded, state.upgraded);
      renderFilterSummary();
      renderRecipes();
    });

    elements.matchAny.addEventListener('change', (event) => {
      state.matchAny = event.target.checked;
      saveBoolean(STORAGE.matchAny, state.matchAny);
      renderFilterSummary();
      renderRecipes();
    });

    elements.craftOnly.addEventListener('change', (event) => {
      state.craftOnly = event.target.checked;
      saveBoolean(STORAGE.craftOnly, state.craftOnly);
      renderFilterSummary();
      renderRecipes();
    });

    elements.clearSelection.addEventListener('click', () => {
      state.selected.clear();
      saveSet(STORAGE.selected, state.selected);
      renderAll();
    });

    elements.resetFilters.addEventListener('click', resetFilters);

    elements.favoritesOnly.addEventListener('click', () => {
      state.favoritesOnly = !state.favoritesOnly;
      saveBoolean(STORAGE.favoritesOnly, state.favoritesOnly);
      reflectFavoritesFilter();
      renderFilterSummary();
      renderRecipes();
    });

    elements.sort.addEventListener('change', (event) => {
      state.sort = event.target.value;
      saveRaw(STORAGE.sort, state.sort);
      renderRecipes();
    });

    elements.recipesBody.addEventListener('click', (event) => {
      const favoriteButton = event.target.closest('[data-favorite]');
      if (favoriteButton) {
        toggleSet(state.favorites, favoriteButton.dataset.favorite);
        saveSet(STORAGE.favorites, state.favorites);
        renderRecipes();
        return;
      }

      const ingredientButton = event.target.closest('[data-add-ingredient]');
      if (ingredientButton) {
        state.selected.add(ingredientButton.dataset.addIngredient);
        saveSet(STORAGE.selected, state.selected);
        renderAll();
        return;
      }

      if (event.target.closest('[data-show-all]')) {
        resetFilters();
      }
    });
  }

  function renderAll() {
    renderIngredientList();
    renderFilterSummary();
    renderRecipes();
  }

  function renderIngredientList() {
    const query = state.search.trim().toLowerCase();
    const visible = state.ingredients
      .filter((item) => !query || item.name.toLowerCase().includes(query))
      .sort((a, b) => {
        const selectedFirst = Number(state.selected.has(b.id)) - Number(state.selected.has(a.id));
        return selectedFirst || compareNames(a.name, b.name);
      });

    elements.clearSearch.hidden = state.search.length === 0;
    elements.selectedCount.textContent = `${state.selected.size} selected`;
    elements.clearSelection.disabled = state.selected.size === 0;
    elements.ingredientSummary.textContent = query
      ? `${visible.length} matching ingredient${visible.length === 1 ? '' : 's'}`
      : `${visible.length} ingredients - selected items first`;

    if (!visible.length) {
      elements.ingredientList.innerHTML = '<li class="empty-list">No ingredients found.<button class="text-button" type="button" data-clear-search>Clear search</button></li>';
      elements.ingredientList.querySelector('[data-clear-search]').addEventListener('click', clearSearch);
      return;
    }

    elements.ingredientList.innerHTML = visible.map((item) => {
      const selected = state.selected.has(item.id);
      const inputId = `ingredient-${escapeAttribute(item.id)}`;
      return `<li class="ingredient${selected ? ' selected' : ''}">
        <label for="${inputId}">
          <input id="${inputId}" type="checkbox" data-ingredient-id="${escapeAttribute(item.id)}"${selected ? ' checked' : ''} />
          <span>${escapeHtml(item.name)}</span>
        </label>
      </li>`;
    }).join('');

    elements.ingredientList.querySelectorAll('[data-ingredient-id]').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const itemId = event.target.dataset.ingredientId;
        event.target.checked ? state.selected.add(itemId) : state.selected.delete(itemId);
        saveSet(STORAGE.selected, state.selected);
        renderAll();
      });
    });
  }

  function renderFilters() {
    const categories = [...new Set(state.items.map((item) => item.category).filter(Boolean))]
      .sort(compareNames);

    elements.categoryFilters.innerHTML = categories.map((category) => {
      const active = state.selectedCategories.has(category);
      return `<button class="filter-chip${active ? ' active' : ''}" type="button" data-category="${escapeAttribute(category)}" aria-pressed="${active}">${escapeHtml(titleCase(category))}</button>`;
    }).join('');

    elements.categoryFilters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      toggleSet(state.selectedCategories, button.dataset.category);
      saveSet(STORAGE.categories, state.selectedCategories);
      reflectFilterButtons();
      renderFilterSummary();
      renderRecipes();
    });

    elements.characterFilters.innerHTML = CHARACTERS.map((character) => {
      const active = state.selectedCharacters.has(character.id);
      return `<button class="character-chip${active ? ' active' : ''}" type="button" data-character="${character.id}" aria-pressed="${active}">
        <img src="${character.icon}" alt="" width="40" height="40" />
        <span>${character.name}</span>
      </button>`;
    }).join('');

    elements.characterFilters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-character]');
      if (!button) return;
      toggleSet(state.selectedCharacters, button.dataset.character);
      saveSet(STORAGE.characters, state.selectedCharacters);
      reflectFilterButtons();
      renderFilterSummary();
      renderRecipes();
    });
  }

  function renderFilterSummary() {
    const parts = [];
    if (state.selectedCategories.size) parts.push(`${state.selectedCategories.size} result type${state.selectedCategories.size === 1 ? '' : 's'}`);
    if (state.selectedCharacters.size) parts.push(`${state.selectedCharacters.size} character${state.selectedCharacters.size === 1 ? '' : 's'}`);
    if (state.favoritesOnly) parts.push('favorites only');
    elements.filterSummary.textContent = parts.length ? parts.join(' - ') : 'No result filters active';
    elements.resetFilters.disabled = parts.length === 0 && !state.search && !state.upgraded && !state.matchAny && !state.craftOnly;
  }

  function renderRecipes() {
    let recipes = state.recipes.filter((recipe) => state.upgraded || recipe.ingredientIds.length <= 2);

    if (state.selectedCategories.size) {
      recipes = recipes.filter((recipe) => state.selectedCategories.has(state.itemById.get(recipe.resultId)?.category));
    }

    if (state.selectedCharacters.size) {
      recipes = recipes.filter((recipe) => {
        const usableBy = state.itemById.get(recipe.resultId)?.usableBy || [];
        return usableBy.some((character) => state.selectedCharacters.has(character));
      });
    }

    if (state.favoritesOnly) {
      recipes = recipes.filter((recipe) => state.favorites.has(recipe.resultId));
    }

    recipes = recipes.filter(matchesInventory).sort(recipeSorter);
    elements.recipeCount.textContent = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`;
    elements.table.classList.toggle('hide-third-ingredient', !state.upgraded);

    if (!recipes.length) {
      elements.recipesBody.innerHTML = `<tr><td colspan="7" class="empty-state">
        <strong>No recipes match.</strong>
        <span>Try fewer filters or switch on "Match any selected".</span>
        <button class="secondary-button" type="button" data-show-all>Reset filters</button>
      </td></tr>`;
      return;
    }

    elements.recipesBody.innerHTML = recipes.map(renderRecipeRow).join('');
  }

  function renderRecipeRow(recipe) {
    const details = recipeMeta(recipe);
    const result = state.itemById.get(recipe.resultId);
    const favorite = state.favorites.has(recipe.resultId);
    const ingredientCells = recipe.ingredientIds.map((id, index) => renderIngredientCell(id, index));
    while (ingredientCells.length < 3) {
      ingredientCells.push('<td class="ingredient-cell muted" data-label="Item 3">Not needed</td>');
    }

    return `<tr class="${details.complete ? 'recipe-ready' : details.have ? 'recipe-partial' : ''}">
      <td class="favorite-column" data-label="Favorite">
        <button class="favorite-button${favorite ? ' active' : ''}" type="button" data-favorite="${escapeAttribute(recipe.resultId)}" aria-label="${favorite ? 'Remove from' : 'Add to'} favorites" aria-pressed="${favorite}">${favorite ? '&#9733;' : '&#9734;'}</button>
      </td>
      <td class="result" data-label="Result">
        <span>${escapeHtml(result?.name || recipe.resultId)}</span>
        <small class="progress${details.complete ? ' ready' : ''}">${details.complete ? 'Ready' : `${details.have}/${details.total} items`}</small>
      </td>
      ${ingredientCells.join('')}
      <td class="usable-by" data-label="Usable by">${renderCharacterIcons(result?.usableBy || [])}</td>
      <td class="notes" data-label="Notes">${recipe.notes ? escapeHtml(recipe.notes) : '<span class="muted">-</span>'}</td>
    </tr>`;
  }

  function renderIngredientCell(itemId, index) {
    const selected = state.selected.has(itemId);
    const itemName = state.itemById.get(itemId)?.name || itemId;
    return `<td class="ingredient-cell${selected ? ' owned-cell' : ''}" data-label="Item ${index + 1}">
      ${selected
        ? `<span class="owned"><span aria-hidden="true">&#10003;</span> ${escapeHtml(itemName)}</span>`
        : `<button class="add-ingredient" type="button" data-add-ingredient="${escapeAttribute(itemId)}" title="Add ${escapeAttribute(itemName)} to your inventory"><span aria-hidden="true">+</span> ${escapeHtml(itemName)}</button>`}
    </td>`;
  }

  function renderCharacterIcons(characterIds) {
    if (!characterIds.length) return '<span class="muted">-</span>';
    const names = characterIds.map((id) => CHARACTERS.find((character) => character.id === id)?.name || titleCase(id));
    const icons = characterIds.map((id) => {
      const character = CHARACTERS.find((entry) => entry.id === id);
      return character ? `<img src="${character.icon}" alt="" title="${character.name}" width="28" height="28" />` : '';
    }).join('');
    return `<span class="character-icons" aria-label="${escapeAttribute(names.join(', '))}">${icons}</span>`;
  }

  function matchesInventory(recipe) {
    const selected = [...state.selected];
    const have = recipe.ingredientIds.filter((id) => state.selected.has(id)).length;
    if (state.craftOnly) return selected.length > 0 && have === recipe.ingredientIds.length;
    if (!selected.length) return true;
    return state.matchAny ? have > 0 : selected.every((id) => recipe.ingredientIds.includes(id));
  }

  function recipeMeta(recipe) {
    const have = recipe.ingredientIds.filter((id) => state.selected.has(id)).length;
    return {
      have,
      total: recipe.ingredientIds.length,
      missing: recipe.ingredientIds.length - have,
      complete: have === recipe.ingredientIds.length,
      score: have / recipe.ingredientIds.length,
    };
  }

  function recipeSorter(a, b) {
    const byName = compareNames(nameOf(a.resultId), nameOf(b.resultId));
    if (state.sort === 'az') return byName;
    if (state.sort === 'za') return -byName;
    const aMeta = recipeMeta(a);
    const bMeta = recipeMeta(b);
    return bMeta.score - aMeta.score || aMeta.missing - bMeta.missing || byName;
  }

  function resetFilters() {
    state.selectedCategories.clear();
    state.selectedCharacters.clear();
    state.search = '';
    state.upgraded = false;
    state.matchAny = false;
    state.craftOnly = false;
    state.favoritesOnly = false;

    saveSet(STORAGE.categories, state.selectedCategories);
    saveSet(STORAGE.characters, state.selectedCharacters);
    saveRaw(STORAGE.search, '');
    saveBoolean(STORAGE.upgraded, false);
    saveBoolean(STORAGE.matchAny, false);
    saveBoolean(STORAGE.craftOnly, false);
    saveBoolean(STORAGE.favoritesOnly, false);

    elements.search.value = '';
    elements.upgraded.checked = false;
    elements.matchAny.checked = false;
    elements.craftOnly.checked = false;
    reflectFilterButtons();
    reflectFavoritesFilter();
    renderAll();
  }

  function clearSearch() {
    state.search = '';
    elements.search.value = '';
    saveRaw(STORAGE.search, '');
    renderIngredientList();
    renderFilterSummary();
    elements.search.focus();
  }

  function reflectSavedState() {
    elements.search.value = state.search;
    elements.upgraded.checked = state.upgraded;
    elements.matchAny.checked = state.matchAny;
    elements.craftOnly.checked = state.craftOnly;
    elements.sort.value = ['relevance', 'az', 'za'].includes(state.sort) ? state.sort : 'relevance';
    reflectFavoritesFilter();
  }

  function reflectFilterButtons() {
    elements.categoryFilters.querySelectorAll('[data-category]').forEach((button) => {
      const active = state.selectedCategories.has(button.dataset.category);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    elements.characterFilters.querySelectorAll('[data-character]').forEach((button) => {
      const active = state.selectedCharacters.has(button.dataset.character);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function reflectFavoritesFilter() {
    elements.favoritesOnly.classList.toggle('active', state.favoritesOnly);
    elements.favoritesOnly.setAttribute('aria-pressed', String(state.favoritesOnly));
    elements.favoritesOnly.innerHTML = `<span aria-hidden="true">${state.favoritesOnly ? '&#9733;' : '&#9734;'}</span> ${state.favoritesOnly ? 'Favorites only' : 'Favorites'}`;
  }

  function reconcileSavedState() {
    const itemIds = new Set(state.items.map((item) => item.id));
    const resultIds = new Set(state.recipes.map((recipe) => recipe.resultId));
    const categories = new Set(state.items.map((item) => item.category).filter(Boolean));
    const characterIds = new Set(CHARACTERS.map((character) => character.id));

    state.selected = new Set([...state.selected].filter((id) => itemIds.has(id)));
    state.favorites = new Set([...state.favorites].filter((id) => resultIds.has(id)));
    state.selectedCategories = new Set([...state.selectedCategories].filter((category) => categories.has(category)));
    state.selectedCharacters = new Set([...state.selectedCharacters].filter((id) => characterIds.has(id)));

    saveSet(STORAGE.selected, state.selected);
    saveSet(STORAGE.favorites, state.favorites);
    saveSet(STORAGE.categories, state.selectedCategories);
    saveSet(STORAGE.characters, state.selectedCharacters);
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    return response.json();
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function nameOf(id) {
    return state.itemById.get(id)?.name || id;
  }

  function compareNames(a, b) {
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
  }

  function titleCase(value) {
    return String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function toggleSet(set, value) {
    set.has(value) ? set.delete(value) : set.add(value);
  }

  function loadSet(key) {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
  }

  function loadBoolean(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'false') === true; } catch { return false; }
  }

  function loadRaw(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }

  function saveSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify([...value])); } catch {}
  }

  function saveBoolean(key, value) {
    try { localStorage.setItem(key, JSON.stringify(Boolean(value))); } catch {}
  }

  function saveRaw(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#96;');
  }
})();
