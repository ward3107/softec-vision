# Architectural Precision Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Softec Vision catalog as a premium bilingual Hebrew/English architectural-product experience with correct taxonomy, English-only charging-cart navigation, accessible interactions, and conversion-focused product inquiry paths.

**Architecture:** Preserve the dependency-free GitHub Pages deployment and the embedded product media in `index.html`. Refactor the page’s inline presentation and controllers around a bilingual data contract, CSS logical properties, deterministic rendering functions, and URL/local-storage language state; add a zero-dependency Node test suite that extracts and evaluates the catalog controller in a minimal DOM harness.

**Tech Stack:** Semantic HTML5, CSS custom properties and logical properties, vanilla JavaScript, Node.js built-in `node:test`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-22-architectural-precision-redesign.md`

## Global Constraints

- The deployed site remains static and runs directly from GitHub Pages without a build step.
- No framework, package dependency, CMS, backend, account system, checkout, or database is introduced.
- Hebrew uses `lang="he"` and `dir="rtl"`; English uses `lang="en"` and `dir="ltr"`.
- The first visit defaults to Hebrew unless `?lang=en` or a saved preference exists.
- Missing translations fall back to Hebrew and never produce blank interface text.
- `charging-carts` is visible only in English catalog navigation and remains present as semantic crawlable HTML in both languages.
- Existing embedded product images, optional galleries, specifications, comparison, WhatsApp inquiries, and optional 3D models remain functional.
- Keyboard access, visible focus, WCAG AA contrast, 44-pixel practical touch targets, and `prefers-reduced-motion` support are required.
- Product images below the fold use lazy loading and localized alternative text.

---

## File Structure

- Modify `index.html`: semantic page structure, design tokens, responsive layout, bilingual data, rendering controllers, product dialog, comparison, and inquiry behavior.
- Create `tests/catalog.test.cjs`: zero-dependency behavior tests for translation fallback, category visibility, state validation, direction switching, and inquiry encoding.
- Create `tests/static-page.test.cjs`: source-level checks for crawlable charging-cart copy, landmarks, dialog semantics, reduced-motion rules, focus styles, and lazy-loading support.
- Modify `README.md`: bilingual editing guide, language URL behavior, taxonomy rules, and verification commands.

---

### Task 1: Establish the Bilingual Data Contract and Test Harness

**Files:**
- Modify: `index.html:708-891`
- Create: `tests/catalog.test.cjs`

**Interfaces:**
- Produces: `getText(key, lang): string`, `getVisibleCategories(lang): Category[]`, `normalizeCatalogState(input): CatalogState`, `buildInquiryUrl(product, lang): string`, and `setLanguage(lang, options?): void`.
- Produces data shapes: `Category { key, label:{he,en}, description:{he,en}, visibleIn:string[], subs?:Subcategory[] }`, `Subcategory { key, label:{he,en} }`, `Product { code, name:{he,en}, desc:{he,en}, cat, sub, img, imgs?, model3d?, specs:{he,en} }`.
- Consumes: existing product image data, category assignments, specifications, and `WA_NUMBER`.

- [ ] **Step 1: Create failing tests for language fallback and category visibility**

Create `tests/catalog.test.cjs` with a small loader that reads `index.html`, extracts the script between `/* APP_CORE_START */` and `/* APP_CORE_END */`, evaluates it in `vm`, and asserts:

```js
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
```

- [ ] **Step 2: Run the tests and verify the harness fails**

Run: `node --test tests/catalog.test.cjs`

Expected: FAIL with `app core markers must exist`.

- [ ] **Step 3: Add the translation and taxonomy core**

In `index.html`, wrap deterministic data/functions in `APP_CORE` markers. Add `TRANSLATIONS` with complete Hebrew and English strings for navigation, hero, catalog, comparison, dialog, contact, errors, and a fixture key `'test.hebrewOnly': { he:'בדיקה' }`. Replace category display fields with bilingual `label` and `description`, give every category `visibleIn:['he','en']` except `charging-carts` with `visibleIn:['en']`, and add:

```js
function getText(key, lang = currentLang) {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[lang] || entry.he || key;
}

function getVisibleCategories(lang) {
  return CATEGORIES.filter(category => category.visibleIn.includes(lang));
}

function normalizeCatalogState(input = {}) {
  const lang = input.lang === 'en' ? 'en' : 'he';
  const categories = getVisibleCategories(lang);
  const requested = categories.find(category => category.key === input.cat);
  const cat = requested?.key || 'all';
  const category = categories.find(item => item.key === cat);
  const sub = category?.subs?.some(item => item.key === input.sub) ? input.sub : 'all';
  return { lang, cat, sub };
}
```

Convert every product `name`, `desc`, and specification label/value to `{ he, en }`. Preserve all existing media strings byte-for-byte.

- [ ] **Step 4: Implement safe language and inquiry helpers**

Add:

```js
function localized(value, lang = currentLang) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] || value.he || '';
  return value || '';
}

function buildInquiryUrl(product, lang = currentLang) {
  const message = lang === 'en'
    ? `Hello, I would like details about ${localized(product.name, lang)} (${product.code}).`
    : `שלום, אשמח לקבל פרטים על ${localized(product.name, lang)} (${product.code}).`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function setLanguage(lang, { persist = true, render = true } = {}) {
  currentLang = lang === 'en' ? 'en' : 'he';
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
  if (persist) { try { localStorage.setItem('softec-language', currentLang); } catch (_) {} }
  if (render && typeof renderPage === 'function') renderPage();
}
```

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/catalog.test.cjs`

Expected: PASS for translation fallback and charging-cart visibility.

```bash
git add index.html tests/catalog.test.cjs
git commit -m "feat: add bilingual catalog data core"
```

---

### Task 2: Build the Architectural Precision Shell

**Files:**
- Modify: `index.html:9-707`
- Create: `tests/static-page.test.cjs`

**Interfaces:**
- Consumes: `getText`, `setLanguage`, and the current `currentLang` value from Task 1.
- Produces: semantic elements with stable IDs `siteNav`, `mobileMenu`, `hero`, `catalog`, `custom`, `about`, `process`, `contact`, `languageToggle`, and `catalogStatus`.

- [ ] **Step 1: Write failing static structure tests**

Create `tests/static-page.test.cjs`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

test('page exposes semantic landmarks and language controls', () => {
  assert.match(html, /<header[^>]+id="siteNav"/);
  assert.match(html, /<main[^>]+id="mainContent"/);
  assert.match(html, /id="languageToggle"/);
  assert.match(html, /id="catalogStatus"[^>]+aria-live="polite"/);
});

test('design includes focus and reduced motion rules', () => {
  assert.match(html, /:focus-visible/);
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
```

- [ ] **Step 2: Run static tests and verify failure**

Run: `node --test tests/static-page.test.cjs`

Expected: FAIL because `mainContent`, `languageToggle`, or `catalogStatus` is absent.

- [ ] **Step 3: Replace visual tokens and typography**

Replace the root design tokens with the six approved colors, fluid spacing, controlled radii, and a bilingual font stack. Load `Assistant` for Hebrew/Latin with `font-display: swap`, then use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`, `border-inline-start`) for directional layout. Set explicit `:focus-visible` outlines and a reduced-motion block that removes non-essential transforms, smooth scrolling, and the splash delay.

- [ ] **Step 4: Rebuild the semantic page shell**

Restructure the header, main, and footer with the stable IDs above. Add a skip link, desktop navigation, accessible mobile disclosure button, persistent language button showing `EN` in Hebrew mode and `עב` in English mode, and a single high-priority quote action. Ensure the logo remains readable on both white and graphite surfaces.

- [ ] **Step 5: Build the editorial hero**

Use the strongest existing product cutout as the oversized hero object, remove the decorative 3D particle canvas, and add a compact bilingual value proposition with `data-i18n` keys. Keep exactly two actions: `Request a quote` and `Explore products`. Include three concrete capabilities—custom manufacturing, integrated AV, and accessible solutions—without invented statistics.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/static-page.test.cjs tests/catalog.test.cjs`

Expected: PASS.

```bash
git add index.html tests/static-page.test.cjs
git commit -m "feat: build architectural bilingual page shell"
```

---

### Task 3: Implement Language State and Complete Page Translation

**Files:**
- Modify: `index.html:556-707, 807-920, 1090-1197`
- Modify: `tests/catalog.test.cjs`

**Interfaces:**
- Consumes: `TRANSLATIONS`, `getText`, `localized`, `normalizeCatalogState`, and `setLanguage`.
- Produces: `resolveInitialLanguage(): 'he'|'en'`, `renderTranslations(): void`, `syncLanguageUrl(lang): void`, and `renderPage(): void`.

- [ ] **Step 1: Add failing tests for direction and initial-language precedence**

Extend the loader to inject configurable `location.search` and storage values, then add tests asserting URL `?lang=en` wins over stored Hebrew, stored English wins with no URL value, invalid values fall back to Hebrew, and `setLanguage('en', {persist:false,render:false})` sets `lang=en` and `dir=ltr`.

- [ ] **Step 2: Run the targeted tests and verify failure**

Run: `node --test --test-name-pattern="language|direction" tests/catalog.test.cjs`

Expected: FAIL because `resolveInitialLanguage` and URL precedence are not implemented.

- [ ] **Step 3: Implement language initialization and rendering**

Add:

```js
function resolveInitialLanguage() {
  const requested = new URLSearchParams(location.search).get('lang');
  if (requested === 'he' || requested === 'en') return requested;
  try {
    const saved = localStorage.getItem('softec-language');
    if (saved === 'he' || saved === 'en') return saved;
  } catch (_) {}
  return 'he';
}

function renderTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(node => {
    node.textContent = getText(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(node => {
    node.setAttribute('aria-label', getText(node.dataset.i18nAria));
  });
  document.title = getText('meta.title');
  document.querySelector('meta[name="description"]').content = getText('meta.description');
}
```

Implement `syncLanguageUrl` with `URLSearchParams` and `history.replaceState`, preserving the current hash. `renderPage` calls `renderTranslations`, `renderCategoryIndex`, `renderSubcategories`, `renderProducts`, `renderComparison`, and `updateLanguageControl` in that order.

- [ ] **Step 4: Translate all visible and generated UI**

Replace literal interface strings in navigation, hero, catalog headings, custom solutions, process, about, contact, footer, filters, empty states, comparison, product dialog, gallery labels, specification headings, 3D controls, WhatsApp actions, mobile menu, and validation/status messages with translation keys. Translate product names/descriptions/specifications and localized alternative text.

- [ ] **Step 5: Wire the language control and URL state**

On activation, switch language, normalize category state so an English-only category cannot remain selected in Hebrew, update `?lang=`, close the mobile menu, rerender, and announce the change through `catalogStatus`.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/*.test.cjs`

Expected: PASS.

```bash
git add index.html tests/catalog.test.cjs
git commit -m "feat: complete Hebrew and English language switching"
```

---

### Task 4: Rebuild Product Discovery and Category Presentation

**Files:**
- Modify: `index.html:602-647, 842-955`
- Modify: `tests/catalog.test.cjs`

**Interfaces:**
- Consumes: `getVisibleCategories(lang)`, `normalizeCatalogState(input)`, `localized(value, lang)`, and `products`.
- Produces: `filterProducts(state): Product[]`, `renderCategoryIndex(): void`, `renderSubcategories(): void`, `renderProducts(): void`, and `selectCategory(cat, sub?): void`.

- [ ] **Step 1: Write failing filtering/state tests**

Add fixtures that assert: `all` returns every product visible in the selected language; `podium/smart` returns only matching products; invalid subcategories normalize to `all`; switching to Hebrew while `charging-carts` is active resets `cat` to `all`.

- [ ] **Step 2: Run filtering tests and verify failure**

Run: `node --test --test-name-pattern="filter|catalog state" tests/catalog.test.cjs`

Expected: FAIL because `filterProducts` is not exported or the state is not normalized.

- [ ] **Step 3: Build the product-family index**

Replace generic filter pills with a responsive architectural index. Each category button includes localized title, one-line description, and subcategory count where applicable. Use `aria-pressed`, a visible selected rule, and roving focus with arrow-key support. Render only `getVisibleCategories(currentLang)`.

- [ ] **Step 4: Build subcategory and product rendering**

Render translated subcategory controls only for the active category. Product cards include localized alternative text, `loading="lazy"`, model code, localized name, a concise specification cue, comparison checkbox, and a localized details button. Empty results show a translated explanation and custom-consultation action.

- [ ] **Step 5: Synchronize catalog state with the URL**

Use `?lang=en&cat=podium&sub=smart`. Validate every read through `normalizeCatalogState`, update the URL with `history.replaceState`, and preserve the selected state on reload. Never emit `charging-carts` in a Hebrew URL state.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/*.test.cjs`

Expected: PASS.

```bash
git add index.html tests/catalog.test.cjs
git commit -m "feat: rebuild bilingual product discovery"
```

---

### Task 5: Upgrade Product Detail, Comparison, and Inquiry Flows

**Files:**
- Modify: `index.html:415-554, 920-1113, 1238-1300`
- Modify: `tests/catalog.test.cjs`
- Modify: `tests/static-page.test.cjs`

**Interfaces:**
- Consumes: `localized`, `getText`, `buildInquiryUrl`, product media/specification data, and current comparison selection.
- Produces: `openProductDialog(productCode, trigger): void`, `closeProductDialog(): void`, `renderProductDialog(product): void`, `toggleComparison(productCode): void`, and `renderComparison(): void`.

- [ ] **Step 1: Add failing inquiry and dialog semantics tests**

Assert Hebrew and English inquiry URLs contain correctly encoded localized names/model codes. In static tests, assert the product detail container has `role="dialog"`, `aria-modal="true"`, an `aria-labelledby` target, close control, and no positive `tabindex` values.

- [ ] **Step 2: Run targeted tests and verify failure**

Run: `node --test --test-name-pattern="inquiry|dialog" tests/*.test.cjs`

Expected: FAIL until the dialog structure and bilingual inquiry builder are connected.

- [ ] **Step 3: Rebuild the product-detail dialog**

Render localized name, description, specification table, alternative text, gallery labels, optional 3D action, and inquiry actions. Hide gallery navigation for a single image and hide 3D controls without `model3d`. On open, remember the invoking control, move focus to the close button, trap Tab/Shift+Tab inside the dialog, close on Escape or backdrop click, and return focus to the invoker.

- [ ] **Step 4: Rebuild comparison behavior**

Keep a strict two-to-three-product comparison limit. Announce additions, removals, and limit errors through the live region. Render a localized comparison table whose column order follows document direction, and use localized specification labels/values with an em dash only for genuinely missing values.

- [ ] **Step 5: Connect encoded inquiries**

Use `buildInquiryUrl` for every product-level WhatsApp action. Provide a separate general quote action with localized text and no fabricated product context. Add `rel="noopener"` to new-tab external links.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/*.test.cjs`

Expected: PASS.

```bash
git add index.html tests/catalog.test.cjs tests/static-page.test.cjs
git commit -m "feat: upgrade accessible product inquiry flows"
```

---

### Task 6: Add Custom-Manufacturing Story, SEO Semantics, and Responsive Polish

**Files:**
- Modify: `index.html:5-8, 648-707, 359-414`
- Modify: `tests/static-page.test.cjs`

**Interfaces:**
- Consumes: translation rendering and existing section navigation.
- Produces: semantic `#custom` process content, crawlable charging-cart content, localized metadata, and final responsive behavior.

- [ ] **Step 1: Add failing SEO and content tests**

Add static assertions for both phrases `Computer Charging Carts` and `עגלות טעינה למחשבים`, a semantic heading inside `#seo-charging-carts`, absence of `display:none` on that block, `#custom` containing three process stages, and localized metadata keys.

- [ ] **Step 2: Run static tests and verify failure**

Run: `node --test tests/static-page.test.cjs`

Expected: FAIL for the new custom-process or metadata assertions.

- [ ] **Step 3: Build the custom-manufacturing editorial section**

Create three translated stages—requirements, engineering, production—using plain process language and a consultation action. Use one strong manufacturing image or product detail crop already present in the site; avoid invented capabilities or delivery promises.

- [ ] **Step 4: Finalize crawlable charging-cart semantics**

Keep a static `aside#seo-charging-carts` in the initial HTML containing a heading and concise paragraph in English and Hebrew. Apply the established visually hidden utility using clipping/absolute positioning, not `display:none`, and do not add it to visible Hebrew controls.

- [ ] **Step 5: Complete responsive and accessibility polish**

Verify the twelve-column layout at wide widths, compact desktop, tablet, and single-column mobile. Ensure 44-pixel controls, non-overlapping sticky navigation, scroll-safe horizontal filters, logical alignment in both directions, readable line lengths, and no animation dependence. Remove decorative motion that competes with the hero product.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/*.test.cjs`

Expected: PASS.

```bash
git add index.html tests/static-page.test.cjs
git commit -m "feat: finish custom story SEO and responsive polish"
```

---

### Task 7: Browser Verification, Documentation, and Final Quality Gate

**Files:**
- Modify: `README.md`
- Modify: `index.html` only for defects found during verification
- Modify: `tests/catalog.test.cjs` or `tests/static-page.test.cjs` only when adding regression coverage for a discovered defect

**Interfaces:**
- Consumes: the complete bilingual page and all test commands from Tasks 1–6.
- Produces: verified release-ready static site and current maintenance documentation.

- [ ] **Step 1: Run the automated suite from a clean state**

Run: `node --test tests/*.test.cjs`

Expected: all tests PASS with zero skipped tests.

- [ ] **Step 2: Serve the site locally**

Run: `python -m http.server 4173`

Expected: the site is available at `http://localhost:4173/` with no terminal errors.

- [ ] **Step 3: Verify Hebrew and English desktop flows**

At approximately 1440×900, verify initial Hebrew RTL, language switching, URL persistence, all category/subcategory selections, absence of visible charging carts in Hebrew, visible charging carts in English, product detail, gallery, comparison, 3D availability rules, quote links, mobile-menu keyboard behavior, and zero browser-console errors.

- [ ] **Step 4: Verify responsive and accessibility flows**

At approximately 390×844, 768×1024, and 1280×800, verify no horizontal page overflow, readable hero/content, usable category controls, 44-pixel interactive targets, visible focus, logical Tab order, Escape closing, focus return, screen-reader labels, and the reduced-motion experience.

- [ ] **Step 5: Capture regression tests for discovered defects**

For each behavioral defect, first add a named failing test to the appropriate existing test file, run it to confirm failure, make the smallest fix in `index.html`, and rerun the full suite. For purely visual defects, record the viewport and exact selector in the commit message and verify both directions after the fix.

- [ ] **Step 6: Update maintenance documentation**

Document `?lang=he|en`, bilingual object fields, `visibleIn`, charging-cart SEO behavior, category/subcategory keys, the `node --test tests/*.test.cjs` command, and the local preview command. Remove outdated claims about a Hebrew-only interface or the old visual treatment.

- [ ] **Step 7: Run the final quality gate and commit**

Run: `node --test tests/*.test.cjs`

Run: `git diff --check`

Expected: all tests PASS; `git diff --check` prints no output; browser console remains clean in both languages.

```bash
git add index.html README.md tests
git commit -m "docs: verify and document architectural redesign"
```
