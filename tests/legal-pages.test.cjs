const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const legalDir = path.resolve(__dirname, '..', 'legal');
function read(file) {
  return fs.readFileSync(path.join(legalDir, file), 'utf8');
}

const PAGES = ['privacy.html', 'accessibility.html', 'terms.html'];

test('shared legal stylesheet and controller exist', () => {
  assert.ok(fs.existsSync(path.join(legalDir, 'legal.css')), 'legal.css must exist');
  assert.ok(fs.existsSync(path.join(legalDir, 'legal.js')), 'legal.js must exist');
  const js = read('legal.js');
  // Uses the same language preference key as the main site and tolerates blocked storage.
  assert.match(js, /'softec-language'/);
  assert.match(js, /try\s*\{[\s\S]*localStorage/);
});

for (const page of PAGES) {
  test(`${page}: bilingual document with TOC, anchors, contact, review warning`, () => {
    const html = read(page);
    // Wired to the shared assets.
    assert.match(html, /href="legal\.css"/);
    assert.match(html, /src="legal\.js"/);
    // Language toggle + back-to-site + starts in Hebrew RTL.
    assert.match(html, /<html lang="he" dir="rtl">/);
    assert.match(html, /id="legalLang"/);
    assert.match(html, /data-keep-lang/);
    // Table of contents that links to in-page anchors.
    assert.match(html, /class="toc"/);
    assert.match(html, /<a href="#[a-z-]+"/);
    // Every TOC target resolves to a real section id.
    const targets = [...html.matchAll(/<a href="#([a-z-]+)"/g)].map(m => m[1]);
    assert.ok(targets.length >= 5, `${page} should have a substantial TOC`);
    for (const id of targets) {
      assert.match(html, new RegExp(`id="${id}"`), `${page}: missing section for #${id}`);
    }
    // Last-updated date and the legal-review warning are present in both languages.
    assert.match(html, /ui\.lastUpdated'/);
    assert.match(html, /review\.banner'/);
    assert.match(html, /he:'⚠[^']*ייעוץ משפטי/);
    assert.match(html, /en:'⚠[^']*legal counsel/);
    // Careful wording, never an unsupported positive "fully compliant" claim.
    assert.doesNotMatch(html, /\bis fully compliant\b/i);
    assert.doesNotMatch(html, /האתר תואם באופן מלא|אתר תואם במלואו/);
    // Correct business contact details.
    assert.match(html, /Softec Vision Ltd/);
    assert.match(html, /\+?972\s*-?54|972544742520/);
    assert.match(html, /03-6968777|\+97236968777/);
    // Every LEGAL_I18N entry that is a section/meta title provides Hebrew and English.
    assert.match(html, /'meta\.title':\s*\{\s*he:[^}]*en:/);
  });
}

test('privacy policy covers consent, GPC, jurisdictions and flagged review items', () => {
  const html = read('privacy.html');
  // Consent Mode v2 default-denied signals are all named.
  for (const signal of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
    assert.match(html, new RegExp(signal));
  }
  assert.match(html, /denied/);
  assert.match(html, /Global Privacy Control|GPC/);
  assert.match(html, /Do Not Sell or Share/i);
  assert.match(html, /12 (months|חודשים)|12 months/);
  // Jurisdiction coverage.
  for (const t of ['EU/EEA', 'United Kingdom', 'California', 'CCPA', 'PIPEDA', 'Québec', 'Law 25']) {
    assert.match(html, new RegExp(t.replace('/', '\\/')), `privacy must mention ${t}`);
  }
  // Careful wording and the "designed to support" phrasing.
  assert.match(html, /designed to support/i);
  // No nationwide US claim.
  assert.match(html, /do not claim nationwide US compliance/i);
  // Missing business address flagged for legal review.
  assert.match(html, /physical business address has not yet been supplied/i);
  // Québec French flagged.
  assert.match(html, /Qu[eé]bec may require French/i);
  // Privacy contact.
  assert.match(html, /Alon@softec\.co\.il/);
});

test('accessibility statement targets WCAG 2.2 AA and does not oversell the widget', () => {
  const html = read('accessibility.html');
  assert.match(html, /WCAG\s*2\.2/);
  assert.match(html, /Level AA|רמה AA/);
  assert.match(html, /designed (and built )?to support|implement against|implemented against/i);
  // The widget is explicitly not a substitute for real accessibility.
  assert.match(html, /not a substitute/i);
  assert.match(html, /IS 5568/);
  // Accessibility coordinator + email.
  assert.match(html, /Waseem/);
  assert.match(html, /vasyaward@gmail\.com/);
  // Review date.
  assert.match(html, /22 September 2026|22 בספטמבר 2026/);
});
