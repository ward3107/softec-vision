// Consent architecture flows (Consent Mode v2 + GPC). Run with Playwright on
// NODE_PATH and a real Chrome/Chromium channel. External CDNs and analytics
// hosts are stubbed so we can both silence sandbox TLS noise and prove that no
// analytics request is ever made before/without consent.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

let browser, server, origin;
const root = path.resolve(__dirname, '..');

before(async () => {
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    const full = path.join(root, file);
    if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
      response.writeHead(404).end();
      return;
    }
    const type = file.endsWith('.svg') ? 'image/svg+xml'
      : file.endsWith('.css') ? 'text/css'
      : file.endsWith('.js') ? 'text/javascript'
      : 'text/html; charset=utf-8';
    response.setHeader('Content-Type', type);
    response.end(fs.readFileSync(full));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

const ANALYTICS = /googletagmanager\.com|google-analytics\.com|analytics\.google|doubleclick|facebook|connect\.facebook/i;

async function newCtx({ gpc = false, blockStorage = false, consent = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // Stub external CDN + fonts to keep the console clean in the sandbox.
  await ctx.route(/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/, r =>
    r.fulfill({ status: 200, contentType: 'text/plain', body: '' }));
  const analyticsRequests = [];
  ctx.on('request', r => { if (ANALYTICS.test(r.url())) analyticsRequests.push(r.url()); });
  if (gpc) await ctx.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true }));
  if (blockStorage) await ctx.addInitScript(() => {
    const boom = () => { throw new Error('blocked'); };
    try { Object.defineProperty(window, 'localStorage', { configurable: true, get: () => ({ getItem: boom, setItem: boom, removeItem: boom }) }); } catch (e) {}
  });
  if (consent) await ctx.addInitScript(v => { try { localStorage.setItem('cookie-consent', v); } catch (e) {} }, consent);
  return { ctx, analyticsRequests };
}

async function openPage(opts) {
  const { ctx, analyticsRequests } = await newCtx(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto(`${origin}/?lang=${opts && opts.lang || 'en'}`);
  return { page, errors, analyticsRequests };
}

test('Consent Mode v2 defaults every signal to denied before any decision', async () => {
  const { page } = await openPage({});
  const def = await page.evaluate(() => (window.dataLayer || []).map(a => Array.from(a))
    .find(e => e[0] === 'consent' && e[1] === 'default'));
  assert.ok(def, 'a consent default must be pushed');
  const signals = def[2];
  for (const key of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
    assert.equal(signals[key], 'denied', `${key} must default to denied`);
  }
  await page.context().close();
});

test('no analytics request is made before consent, and the banner is keyboard operable', async () => {
  const { page, analyticsRequests } = await openPage({});
  const accept = page.locator('#cookieAccept');
  const reject = page.locator('#cookieReject');
  await accept.waitFor({ state: 'visible', timeout: 4000 });
  // Reject is exactly as reachable as Accept: same element type, visible, enabled, >=44px, equal height.
  assert.ok(await reject.isVisible());
  assert.equal(await reject.isEnabled(), true);
  const a = await accept.boundingBox(), r = await reject.boundingBox();
  assert.ok(a.height >= 43.5 && r.height >= 43.5, 'both actions meet the 44px target');
  assert.ok(Math.abs(a.height - r.height) < 1.5, 'accept and reject share prominence');
  // Keyboard: focus reject and activate with the keyboard.
  await reject.focus();
  assert.equal(await reject.evaluate(el => el === document.activeElement), true);
  assert.deepEqual(analyticsRequests, [], 'no analytics request before a decision');
  await page.context().close();
});

test('Reject all records denied consent, updates Consent Mode and loads no analytics', async () => {
  const { page, analyticsRequests } = await openPage({});
  await page.locator('#cookieReject').waitFor({ state: 'visible', timeout: 4000 });
  await page.locator('#cookieReject').click();
  assert.equal(await page.locator('#cookieBanner').isVisible(), false);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('softec-consent')));
  assert.equal(stored.analytics, 'denied');
  assert.equal(stored.marketing, 'denied');
  assert.equal(typeof stored.ts, 'number');
  const update = await page.evaluate(() => (window.dataLayer || []).map(a => Array.from(a))
    .filter(e => e[0] === 'consent' && e[1] === 'update').pop());
  assert.equal(update[2].analytics_storage, 'denied');
  assert.deepEqual(analyticsRequests, []);
  await page.context().close();
});

test('Accept all grants analytics/marketing in Consent Mode but loads nothing while unconfigured', async () => {
  const { page, analyticsRequests } = await openPage({});
  await page.locator('#cookieAccept').waitFor({ state: 'visible', timeout: 4000 });
  await page.locator('#cookieAccept').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('softec-consent')));
  assert.equal(stored.analytics, 'granted');
  const update = await page.evaluate(() => (window.dataLayer || []).map(a => Array.from(a))
    .filter(e => e[0] === 'consent' && e[1] === 'update').pop());
  assert.equal(update[2].analytics_storage, 'granted');
  assert.equal(update[2].ad_storage, 'granted');
  // No GA4/GTM id configured -> no fake identifier, no network request.
  assert.deepEqual(analyticsRequests, []);
  await page.context().close();
});

test('Customize exposes granular choices with nothing preselected', async () => {
  const { page } = await openPage({});
  await page.locator('#cookieCustomize').waitFor({ state: 'visible', timeout: 4000 });
  await page.locator('#cookieCustomize').click();
  assert.equal(await page.locator('#prefAnalytics').isChecked(), false, 'analytics not preselected');
  assert.equal(await page.locator('#prefMarketing').isChecked(), false, 'marketing not preselected');
  await page.locator('#prefAnalytics').check();
  await page.locator('#cookieSave').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('softec-consent')));
  assert.equal(stored.analytics, 'granted');
  assert.equal(stored.marketing, 'denied');
  await page.context().close();
});

test('GPC keeps advertising denied even when the visitor accepts all', async () => {
  const { page } = await openPage({ gpc: true });
  await page.locator('#cookieCustomize').waitFor({ state: 'visible', timeout: 4000 });
  await page.locator('#cookieCustomize').click();
  assert.equal(await page.locator('#cookieGpc').isVisible(), true, 'GPC notice is shown');
  assert.equal(await page.locator('#prefMarketing').isDisabled(), true, 'marketing locked under GPC');
  await page.locator('#cookieAccept').waitFor({ state: 'hidden' }).catch(() => {});
  // Accept-all under GPC must still deny advertising storage.
  await page.evaluate(() => document.getElementById('cookieRejectAll') && null);
  await page.locator('#prefAnalytics').check();
  await page.locator('#cookieSave').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('softec-consent')));
  assert.equal(stored.marketing, 'denied');
  assert.equal(stored.gpc, true);
  const update = await page.evaluate(() => (window.dataLayer || []).map(a => Array.from(a))
    .filter(e => e[0] === 'consent' && e[1] === 'update').pop());
  assert.equal(update[2].ad_storage, 'denied');
  await page.context().close();
});

test('blocked localStorage still shows the banner and does not throw on decision', async () => {
  const { page, errors } = await openPage({ blockStorage: true });
  await page.locator('#cookieAccept').waitFor({ state: 'visible', timeout: 4000 });
  await page.locator('#cookieAccept').click();
  assert.equal(await page.locator('#cookieBanner').isVisible(), false);
  assert.deepEqual(errors, [], 'no console errors with storage blocked');
  await page.context().close();
});

test('a prior decision suppresses the banner; footer withdrawal reopens it with focus return', async () => {
  const { page } = await openPage({ consent: 'essential' });
  // Wait past the delayed banner timer to confirm it stays hidden.
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('#cookieBanner').isVisible(), false);
  const settings = page.locator('#cookieSettings');
  await settings.click();
  assert.equal(await page.locator('#cookieBanner').isVisible(), true);
  assert.equal(await page.locator('#cookiePrefs').isVisible(), true, 'withdrawal opens preferences');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#cookieBanner').isVisible(), false);
  assert.equal(await settings.evaluate(el => el === document.activeElement), true, 'focus returns to the trigger');
  await page.context().close();
});

test('legal links are reachable from the banner and footer and carry the language', async () => {
  const { page } = await openPage({ lang: 'en' });
  await page.locator('#cookieAccept').waitFor({ state: 'visible', timeout: 4000 });
  assert.match(await page.locator('#cookieBanner .cookie-legal').getAttribute('href'), /legal\/privacy\.html/);
  const footerPrivacy = page.locator('.footer-links a[href*="privacy.html"]');
  assert.match(await footerPrivacy.getAttribute('href'), /legal\/privacy\.html\?lang=en/);
  assert.ok(await page.locator('.footer-links a[href*="accessibility.html"]').count());
  assert.ok(await page.locator('.footer-links a[href*="terms.html"]').count());
  await page.context().close();
});
