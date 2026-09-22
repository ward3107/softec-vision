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

test('product dialog exposes modal semantics, its title and close control without positive tabindex', () => {
  const dialog = html.match(/<div[^>]*id="lightbox"[^>]*>/)?.[0] || '';
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby="lbName"/);
  assert.match(dialog, /\bhidden\b/);
  assert.match(html, /<h[23][^>]*id="lbName"/);
  assert.match(html, /<button[^>]*id="lbClose"[^>]*aria-label="[^"]+"/);
  assert.doesNotMatch(html, /tabindex=["'][1-9]\d*["']/i);
});

// ---------- Task 6: SEO semantics and crawlable charging-cart content ----------
test('charging carts stays crawlable in English and Hebrew without display:none', () => {
  const aside = html.match(/<aside[^>]*id="seo-charging-carts"[^>]*>[\s\S]*?<\/aside>/)?.[0] || '';
  assert.ok(aside, 'a semantic aside#seo-charging-carts must exist');
  // Both language phrases are present in the crawlable block.
  assert.match(aside, /Computer Charging Carts/);
  assert.match(aside, /עגלות טעינה למחשבים/);
  // A real heading gives the block document structure.
  assert.match(aside, /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/);
  // The block must never be removed from the render tree with display:none or the boolean hidden attribute.
  assert.doesNotMatch(aside, /style=["'][^"']*display\s*:\s*none/i);
  assert.doesNotMatch(aside, /<aside[^>]*\shidden(?=[\s>=])/);
  // The visually-hidden utility clips content off-screen instead of using display:none.
  const seoRule = html.match(/\.seo-only[^{]*\{[^}]*\}/)?.[0] || '';
  assert.ok(seoRule, '.seo-only utility rule must exist');
  assert.match(seoRule, /clip\s*:/);
  assert.doesNotMatch(seoRule, /display\s*:\s*none/);
});

test('charging carts category is English-only in the data contract', () => {
  const chargingBlock = html.match(/key:'charging-carts'[\s\S]{0,220}?visibleIn:\[[^\]]*\]/)?.[0] || '';
  assert.ok(chargingBlock, 'charging-carts category must be defined');
  assert.match(chargingBlock, /visibleIn:\['en'\]/);
});

// ---------- Task 6: custom-manufacturing Need -> Engineering -> Result story ----------
test('custom section tells a three-stage Need to Result story with a consultation action', () => {
  const custom = html.match(/<section[^>]*id="custom"[^>]*>[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(custom, 'a #custom section must exist');
  assert.match(custom, /aria-labelledby="customTitle"/);
  const stages = custom.match(/<li[\s\S]*?<\/li>/g) || [];
  assert.ok(stages.length >= 3, `expected at least three custom stages, found ${stages.length}`);
  // Ordered list keeps the narrative sequence explicit.
  assert.match(custom, /<ol[^>]*class="custom-stages"/);
  // The section routes to a consultation rather than interrupting catalog discovery.
  assert.match(custom, /href="#contact"/);
  // Narrative keys resolve for the three stages.
  for (const key of ['custom.stepNeed', 'custom.stepEngineering', 'custom.stepResult']) {
    assert.match(html, new RegExp(`'${key.replace('.', '\\.')}':\\s*\\{[^}]*he:[^}]*en:`));
  }
});

test('localized metadata keys expose both Hebrew and English values', () => {
  for (const key of ['meta.title', 'meta.description']) {
    assert.match(html, new RegExp(`'${key.replace('.', '\\.')}':\\s*\\{\\s*he:[^}]*en:[^}]*\\}`));
  }
});
