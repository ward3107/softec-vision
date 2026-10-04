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

test('footer renders the supplied Vasia dev. creator mark with verified contact links', () => {
  const signature = read('web', 'src', 'components', 'CreatorSignature.tsx');
  const footer = read('web', 'src', 'components', 'Footer.tsx');

  assert.match(signature, /\/brand\/vasia-dev-signature\.png/);
  assert.match(signature, /https:\/\/www\.vasia\.dev\//);
  assert.match(signature, /mailto:vasyaward@gmail\.com/);
  assert.match(signature, /https:\/\/wa\.me\/972544742520/);
  assert.match(signature, /https:\/\/github\.com\/ward3107/);
  assert.match(signature, /https:\/\/www\.linkedin\.com\/in\/waseem-abu-akel-334486374\//);
  assert.match(footer, /<CreatorSignature/);
  assert.match(footer, /pb-24 pt-6/);
  assert.doesNotMatch(signature, /bg-\\[#020716\\]/);
});

test('floating controls keep WhatsApp left and accessibility right', () => {
  const dock = read('web', 'src', 'components', 'widgets', 'FloatingDock.tsx');
  const widget = read('web', 'src', 'components', 'a11y', 'AccessibilityWidget.tsx');

  assert.match(dock, /fixed bottom-5 left-4[^\n]*[\s\S]*wa\.me/);
  assert.ok(dock.includes('className="fixed right-4 top-1/2'));
  assert.ok(widget.includes('absolute right-[calc(100%+0.75rem)] top-1/2'));
});
