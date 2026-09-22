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
