import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as catalog from '../catalog.mjs';

// Run the browser entry point with in-memory storage and controllable fetch.
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8').replace(/^import .*?;\r?\n/, '');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function start(values, fetch) {
  const nodes = new Map();
  function getElementById(id) {
    assert.ok(html.includes('id="' + id + '"'));
    if (!nodes.has(id)) nodes.set(id, {
      handlers: {}, setAttribute() {}, replaceChildren() {}, querySelectorAll() { return []; },
      classList: {toggle() {}}, addEventListener(event, handler) { this.handlers[event] = handler; },
    });
    return nodes.get(id);
  }
  runInNewContext(source, {...catalog, document: {getElementById}, fetch,
    console: {error() {}}, localStorage: {
      getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value),
    }});
  return getElementById;
}
test('Saved state, alternate formulas, reset, failed and overlapping edition switches', async () => {
  const items = ['a','b','c'].map(id => ({id,name:id}));
  const recipes = [['a','a'],['a','b']].map((ingredientIds,i) => ({id:'r'+i,resultId:'c',ingredientIds}));
  const values = new Map([['dq8.favs','["c"]'],['dq8.selected','"a"'],['dq8.chars','{bad']]);
  let invalid = false;
  let delayed;
  const el = start(values, async path => {
    if (delayed) await delayed;
    return {ok:true,json:async () => invalid ? {} : path.endsWith('items.json') ? structuredClone(items) : structuredClone(recipes)};
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(el('selected-count').textContent,'0 selected');
  assert.equal(el('recipe-count').textContent,'2 recipes');
  assert.equal(el('recipes-body').innerHTML.match(/data-favorite="c"[^>]*aria-pressed="true"/g).length,2);
  el('reset-filters').handlers.click();
  assert.equal(values.get('dq8.favs'),'["c"]');
  const toggle = el('masterpiece-reborn');
  toggle.checked = true;
  invalid = true;
  await toggle.handlers.change();
  assert.equal(toggle.checked,false);
  assert.equal(el('catalog-error').hidden,false);
  invalid = false;
  let release;
  delayed = new Promise(resolve => {release=resolve});
  toggle.checked = true;
  const first = toggle.handlers.change();
  toggle.checked = false;
  await toggle.handlers.change();
  release();
  await first;
  assert.equal(toggle.checked,true);
  assert.equal(el('catalog-error').hidden,true);
  assert.equal(values.get('dq8.masterpiece'),'true');
  assert.equal(values.get('dq8.favs.masterpiece'),'[]');
});


