const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'web', 'src', 'app', '[locale]', 'page.tsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'web', 'src', 'app', 'globals.css'), 'utf8');
const header = fs.readFileSync(path.join(root, 'web', 'src', 'components', 'Header.tsx'), 'utf8');
const he = JSON.parse(fs.readFileSync(path.join(root, 'web', 'messages', 'he.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, 'web', 'messages', 'en.json'), 'utf8'));

test('home opens with the engineered product hero', () => {
  assert.match(home, /className="home-hero/);
  assert.match(home, /home-hero__blueprint/);
  // The showpiece is the real product photo (static), so its colours match the
  // catalog picture — not a grey 3D scan.
  assert.match(home, /src="\/products\/RAV-500-transparent\.webp"/);
  assert.match(home, /home-hero__product/);
  assert.match(css, /\.home-hero__blueprint/);
  assert.match(css, /@keyframes heroProductSettle/);
});

test('hero gives international buyers a clear proposition and proof points', () => {
  for (const messages of [he, en]) {
    assert.ok(messages.hero.title.length >= 30);
    assert.ok(messages.hero.body.length >= 70);
    assert.equal(messages.hero.proof.length, 3);
    assert.ok(messages.hero.delivery);
  }

  assert.match(home, /t\.raw\('proof'\)/);
  assert.match(home, /t\('delivery'\)/);
});

test('hero motion has a reduced-motion fallback', () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.home-hero__product/);
});

test('mobile header keeps the logo and language control without horizontal overflow', () => {
  assert.match(header, /w-\[116px\][^"']*sm:w-\[190px\]/);
  assert.match(css, /body\s*\{[^}]*overflow-x:\s*clip/s);
});
