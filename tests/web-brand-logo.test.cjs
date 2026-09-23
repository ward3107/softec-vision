const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('the supplied logo is the shared visual brand asset', () => {
  const logo = path.join(root, 'web', 'public', 'brand', 'softec-vision-logo.png');
  assert.ok(fs.existsSync(logo));
  assert.ok(fs.statSync(logo).size > 10_000);

  const component = read('web', 'src', 'components', 'BrandLogo.tsx');
  assert.match(component, /\/brand\/softec-vision-logo\.png/);
  assert.match(component, /alt="Softec Vision"/);
});

test('header, footer and about page use the shared logo component', () => {
  for (const file of [
    ['web', 'src', 'components', 'Header.tsx'],
    ['web', 'src', 'components', 'Footer.tsx'],
    ['web', 'src', 'app', '[locale]', 'about', 'page.tsx']
  ]) {
    assert.match(read(...file), /<BrandLogo/);
  }
});

test('first-visit splash persists its completed state and respects reduced motion', () => {
  const splash = read('web', 'src', 'components', 'BrandSplash.tsx');
  const layout = read('web', 'src', 'app', '[locale]', 'layout.tsx');
  const css = read('web', 'src', 'app', 'globals.css');

  assert.match(splash, /softec-brand-intro-seen/);
  assert.match(splash, /localStorage\.setItem/);
  assert.match(splash, /prefers-reduced-motion/);
  assert.match(layout, /<BrandSplash/);
  assert.match(layout, /brand-splash-seen/);
  assert.match(css, /\.brand-splash-seen \.brand-splash/);
});

test('footer renders the saved creator signature letter by letter', () => {
  const signature = read('web', 'src', 'components', 'CreatorSignature.tsx');
  const footer = read('web', 'src', 'components', 'Footer.tsx');
  const css = read('web', 'src', 'app', 'globals.css');

  assert.match(signature, /const HEART = '❤️'/);
  assert.match(signature, /https:\/\/waseemp\.vercel\.app\//);
  assert.match(signature, /creator-signature__character/);
  assert.match(footer, /<CreatorSignature/);
  assert.match(css, /@keyframes signatureWrite/);
  assert.match(css, /prefers-reduced-motion/);
});

test('floating controls keep WhatsApp left and accessibility right', () => {
  const dock = read('web', 'src', 'components', 'widgets', 'FloatingDock.tsx');
  const widget = read('web', 'src', 'components', 'a11y', 'AccessibilityWidget.tsx');

  assert.match(dock, /fixed bottom-5 left-4[^\n]*[\s\S]*wa\.me/);
  assert.match(dock, /fixed bottom-5 right-4[^\n]*[\s\S]*<AccessibilityWidget/);
  assert.match(widget, /absolute bottom-14 right-0/);
});
