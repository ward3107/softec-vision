const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const seed = fs.readFileSync(path.join(root, 'web', 'src', 'lib', 'catalog', 'seed.ts'), 'utf8');

const expectedCodes = [
  'ACCESSIBLE-TLV',
  'BIO-DOUBLE',
  'G-1',
  'NT-PODIUM',
  'L-2',
  'IL-18',
  'MEMORIAL-HALL',
  'ROTHSCHILD',
  'PREMIUM-LECTERN',
  'SDEROT-HALL'
];

test('new Drive products are present in the typed catalog', () => {
  for (const code of expectedCodes) {
    assert.match(seed, new RegExp(`code: '${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
});

test('every new catalog image is optimized, referenced and available', () => {
  const paths = [...seed.matchAll(/['"](\/products\/new\/[^'"]+\.webp)['"]/g)].map((match) => match[1]);
  const uniquePaths = [...new Set(paths)];

  assert.equal(uniquePaths.length, 17);
  for (const publicPath of uniquePaths) {
    const file = path.join(root, 'web', 'public', ...publicPath.split('/').filter(Boolean));
    assert.ok(fs.existsSync(file), `${publicPath} must exist`);
    assert.ok(fs.statSync(file).size < 200_000, `${publicPath} should stay below 200 KB`);
  }
});

test('every new product supplies localized primary-image alt text', () => {
  const newProductBlock = seed.slice(seed.indexOf("code: 'ACCESSIBLE-TLV'"));
  assert.equal((newProductBlock.match(/imageAlt:\s*\{\s*he:/g) || []).length, expectedCodes.length);
  assert.equal((newProductBlock.match(/imageAlt:\s*\{[^}]*en:/g) || []).length, expectedCodes.length);
});
