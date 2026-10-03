const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const seed = fs.readFileSync(path.join(root, 'web', 'src', 'lib', 'catalog', 'seed.ts'), 'utf8');
const productCard = fs.readFileSync(path.join(root, 'web', 'src', 'components', 'catalog', 'ProductCard.tsx'), 'utf8');
const productScroller = fs.readFileSync(path.join(root, 'web', 'src', 'components', 'catalog', 'ProductScroller.tsx'), 'utf8');
const categoryExplorer = fs.readFileSync(path.join(root, 'web', 'src', 'components', 'catalog', 'CategoryExplorer.tsx'), 'utf8');
const publicLayout = fs.readFileSync(path.join(root, 'web', 'src', 'app', '[locale]', 'layout.tsx'), 'utf8');

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
    // High-resolution originals (~3200px) so the full-screen viewer can zoom to
    // detail; ordinary browsing is served resized copies via next/image, so the
    // full file only downloads when a visitor opens the zoom viewer. The cap
    // still catches an accidental multi-megabyte upload.
    assert.ok(fs.statSync(file).size < 500_000, `${publicPath} should stay below 500 KB`);
  }
});

test('every new product supplies localized primary-image alt text', () => {
  const newProductBlock = seed.slice(seed.indexOf("code: 'ACCESSIBLE-TLV'"));
  assert.equal((newProductBlock.match(/imageAlt:\s*\{\s*he:/g) || []).length, expectedCodes.length);
  assert.equal((newProductBlock.match(/imageAlt:\s*\{[^}]*en:/g) || []).length, expectedCodes.length);
});

test('legacy catalog products use lightweight transparent WebP cutouts', () => {
  const codes = ['CD-3', 'IX-1', 'RAV-500', 'SD-2', 'V-18W', 'V-19W', 'V-5'];

  for (const code of codes) {
    const publicPath = `/products/${code}-transparent.webp`;
    const file = path.join(root, 'web', 'public', ...publicPath.split('/').filter(Boolean));

    assert.match(seed, new RegExp(`image: '${publicPath}'`));
    assert.ok(fs.existsSync(file), `${publicPath} must exist`);
    // High-resolution transparent cutouts for the zoom viewer; see the note on
    // the new-image cap above. Kept a touch tighter than the photos since a
    // clean cutout on transparency compresses smaller than a full scene.
    assert.ok(fs.statSync(file).size < 350_000, `${publicPath} should stay below 350 KB`);
  }
});

test('product cards are one clickable frame with copy above an enlarged image', () => {
  assert.match(productCard, /className="group flex h-full flex-col overflow-hidden/);
  assert.ok(productCard.indexOf('<h3') < productCard.indexOf('<Image'));
  assert.match(productCard, /scale-\[1\.08\]/);
  assert.doesNotMatch(productCard, /CompareButton|t\('details'\)/);
});

test('product listings stay horizontal while category families stay in a grid', () => {
  assert.match(productScroller, /snap-x snap-mandatory/);
  assert.match(productScroller, /scrollBy/);
  assert.doesNotMatch(productScroller, /sm:grid/);
  assert.match(categoryExplorer, /grid grid-cols-2/);
  assert.match(categoryExplorer, /item\.kind === 'product'/);
});

test('the public shell is light-only and has no comparison tray', () => {
  assert.match(publicLayout, /classList\.remove\('dark'\)/);
  assert.doesNotMatch(publicLayout, /CompareProvider|CompareTray/);
});
