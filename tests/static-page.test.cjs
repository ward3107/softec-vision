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
