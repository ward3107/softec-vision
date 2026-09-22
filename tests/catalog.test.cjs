const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadCore() {
  const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
  const match = html.match(/\/\* APP_CORE_START \*\/([\s\S]*?)\/\* APP_CORE_END \*\//);
  assert.ok(match, 'app core markers must exist');
  const sandbox = {
    console,
    URLSearchParams,
    encodeURIComponent,
    document: { documentElement: { lang: '', dir: '' }, querySelectorAll: () => [] },
    history: { replaceState() {} },
    location: { search: '', pathname: '/', hash: '' },
    localStorage: { getItem: () => null, setItem() {} }
  };
  vm.createContext(sandbox);
  vm.runInContext(`${match[1]};globalThis.__app={getText,getVisibleCategories,normalizeCatalogState,buildInquiryUrl,setLanguage,CATEGORIES};`, sandbox);
  return sandbox.__app;
}

test('translation falls back to Hebrew', () => {
  const app = loadCore();
  assert.equal(app.getText('nav.home', 'en'), 'Home');
  assert.equal(app.getText('test.hebrewOnly', 'en'), 'בדיקה');
});

test('charging carts is visible only in English category navigation', () => {
  const app = loadCore();
  assert.equal(app.getVisibleCategories('he').some(c => c.key === 'charging-carts'), false);
  assert.equal(app.getVisibleCategories('en').some(c => c.key === 'charging-carts'), true);
});
