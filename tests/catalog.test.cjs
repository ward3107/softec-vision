const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadCore({
  search = '',
  pathname = '/',
  hash = '',
  storedLanguage = null,
  storageThrows = false,
  translatedNodes = [],
  ariaNodes = []
} = {}) {
  const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
  const match = html.match(/\/\* APP_CORE_START \*\/([\s\S]*?)\/\* APP_CORE_END \*\//);
  assert.ok(match, 'app core markers must exist');
  const description = { content:'' };
  const historyCalls = [];
  const renderCalls = [];
  const sandbox = {
    console,
    URLSearchParams,
    encodeURIComponent,
    document: {
      documentElement: { lang: '', dir: '' },
      title: '',
      querySelectorAll(selector) {
        if (selector === '[data-i18n]') return translatedNodes;
        if (selector === '[data-i18n-aria]') return ariaNodes;
        return [];
      },
      querySelector(selector) {
        return selector === 'meta[name="description"]' ? description : null;
      }
    },
    history: { replaceState(...args) { historyCalls.push(args); } },
    location: { search, pathname, hash },
    renderCategoryIndex() { renderCalls.push('renderCategoryIndex'); },
    renderSubcategories() { renderCalls.push('renderSubcategories'); },
    renderProducts() { renderCalls.push('renderProducts'); },
    renderComparison() { renderCalls.push('renderComparison'); },
    updateLanguageControl() { renderCalls.push('updateLanguageControl'); },
    localStorage: {
      getItem() {
        if (storageThrows) throw new Error('storage unavailable');
        return storedLanguage;
      },
      setItem() {
        if (storageThrows) throw new Error('storage unavailable');
      }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(`${match[1]};globalThis.__app={getText,getVisibleCategories,normalizeCatalogState,buildInquiryUrl,setLanguage,resolveInitialLanguage,renderTranslations,syncLanguageUrl,renderPage,safeStorageGet,safeStorageSet,CATEGORIES,products,filterProducts:typeof filterProducts === 'function' ? filterProducts : undefined,syncCatalogUrl:typeof syncCatalogUrl === 'function' ? syncCatalogUrl : undefined};`, sandbox);
  return { app:sandbox.__app, sandbox, description, historyCalls, renderCalls };
}

test('translation falls back to Hebrew', () => {
  const { app } = loadCore();
  assert.equal(app.getText('nav.home', 'en'), 'Home');
  assert.equal(app.getText('test.hebrewOnly', 'en'), 'בדיקה');
});

test('charging carts is visible only in English category navigation', () => {
  const { app } = loadCore();
  assert.equal(app.getVisibleCategories('he').some(c => c.key === 'charging-carts'), false);
  assert.equal(app.getVisibleCategories('en').some(c => c.key === 'charging-carts'), true);
});

test('URL language takes precedence over stored language', () => {
  const { app } = loadCore({ search:'?lang=en', storedLanguage:'he' });
  assert.equal(app.resolveInitialLanguage(), 'en');
});

test('stored language is restored when the URL omits language', () => {
  const { app } = loadCore({ storedLanguage:'en' });
  assert.equal(app.resolveInitialLanguage(), 'en');
});

test('invalid language values and unavailable storage fall back to Hebrew', () => {
  assert.equal(loadCore({ search:'?lang=fr', storedLanguage:'fr' }).app.resolveInitialLanguage(), 'he');
  assert.equal(loadCore({ search:'?lang=fr', storageThrows:true }).app.resolveInitialLanguage(), 'he');
});

test('setting English updates document language and direction without rendering', () => {
  const { app, sandbox } = loadCore();
  app.setLanguage('en', { persist:false, render:false });
  assert.equal(sandbox.document.documentElement.lang, 'en');
  assert.equal(sandbox.document.documentElement.dir, 'ltr');
});

test('language URL synchronization preserves other parameters and the current hash', () => {
  const { app, historyCalls } = loadCore({ search:'?cat=podium&lang=he', pathname:'/catalog', hash:'#products' });
  app.syncLanguageUrl('en');
  assert.deepEqual(historyCalls, [[null, '', '/catalog?cat=podium&lang=en#products']]);
});

test('language rendering updates text, accessible names, title and description', () => {
  const textNode = { dataset:{ i18n:'nav.home' }, textContent:'' };
  const ariaNode = {
    dataset:{ i18nAria:'nav.menu' },
    attributes:{},
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  const { app, sandbox, description } = loadCore({ translatedNodes:[textNode], ariaNodes:[ariaNode] });
  app.setLanguage('en', { persist:false, render:false });
  app.renderTranslations();
  assert.equal(textNode.textContent, 'Home');
  assert.equal(ariaNode.attributes['aria-label'], 'Open menu');
  assert.equal(sandbox.document.title, 'Softec Vision | Lecturer, Control and Display Stations');
  assert.equal(description.content, 'Design and manufacture of custom lecturer stations, control desks and display solutions.');
});

test('page rendering updates translations, catalog, comparison and language control in order', () => {
  const renderCalls = [];
  const translatedNode = {
    dataset:{ i18n:'nav.home' },
    set textContent(value) { renderCalls.push(`renderTranslations:${value}`); }
  };
  const loaded = loadCore({ translatedNodes:[translatedNode] });
  loaded.sandbox.renderCategoryIndex = () => renderCalls.push('renderCategoryIndex');
  loaded.sandbox.renderSubcategories = () => renderCalls.push('renderSubcategories');
  loaded.sandbox.renderProducts = () => renderCalls.push('renderProducts');
  loaded.sandbox.renderComparison = () => renderCalls.push('renderComparison');
  loaded.sandbox.updateLanguageControl = () => renderCalls.push('updateLanguageControl');
  loaded.app.renderPage();
  assert.deepEqual(renderCalls, [
    'renderTranslations:ראשי',
    'renderCategoryIndex',
    'renderSubcategories',
    'renderProducts',
    'renderComparison',
    'updateLanguageControl'
  ]);
});

test('language and page preferences tolerate unavailable storage', () => {
  const { app } = loadCore({ storageThrows:true });
  assert.equal(app.safeStorageGet('softec-language', 'he'), 'he');
  assert.doesNotThrow(() => app.safeStorageSet('softec-language', 'en'));
  assert.doesNotThrow(() => app.setLanguage('en', { render:false }));
});

test('filter all returns every product visible in the selected language', () => {
  const { app } = loadCore();
  const chargingCart = { code:'CHARGE-FIXTURE', cat:'charging-carts' };
  app.products.push(chargingCart);
  assert.equal(app.filterProducts({ lang:'en', cat:'all' }).length, app.products.length);
  assert.equal(app.filterProducts({ lang:'he', cat:'all' }).length, app.products.length - 1);
  assert.equal(app.filterProducts({ lang:'he', cat:'all' }).includes(chargingCart), false);
});

test('filter podium/smart returns only matching products and retains their identity', () => {
  const { app } = loadCore();
  const result = app.filterProducts({ lang:'en', cat:'podium', sub:'smart' });
  assert.deepEqual(Array.from(result, product => product.code), ['LS-1000LPT', 'V-19W']);
  assert.equal(result[0], app.products[0]);
});

test('catalog state normalizes invalid subcategories and hidden Hebrew charging carts', () => {
  const { app } = loadCore();
  assert.deepEqual({ ...app.normalizeCatalogState({ lang:'en', cat:'podium', sub:'operator' }) }, { lang:'en', cat:'podium', sub:'all' });
  assert.deepEqual({ ...app.normalizeCatalogState({ lang:'he', cat:'charging-carts', sub:'smart' }) }, { lang:'he', cat:'all', sub:'all' });
  assert.deepEqual({ ...app.normalizeCatalogState({ lang:'fr', cat:'unknown', sub:'smart' }) }, { lang:'he', cat:'all', sub:'all' });
  assert.equal(app.filterProducts({ lang:'en', cat:'podium', sub:'invalid' }).length, app.products.filter(product => product.cat === 'podium').length);
});

test('catalog state URL synchronization normalizes state and preserves unrelated parameters and hash', () => {
  const { app, historyCalls } = loadCore({ search:'?campaign=av&lang=en&cat=charging-carts', pathname:'/catalog', hash:'#catalog' });
  app.syncCatalogUrl({ lang:'he', cat:'charging-carts', sub:'smart' });
  assert.equal(historyCalls[0][2], '/catalog?campaign=av&lang=he&cat=all&sub=all#catalog');
  app.syncCatalogUrl({ lang:'en', cat:'podium', sub:'smart' });
  assert.equal(historyCalls[1][2], '/catalog?campaign=av&lang=en&cat=podium&sub=smart#catalog');
});
