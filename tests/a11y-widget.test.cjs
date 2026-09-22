// Accessibility widget: it must be accessible itself — keyboard operable,
// focus-trapped while open, Escape-closable with focus return, logically
// positioned for RTL/LTR, and never covering the cookie controls.
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
    if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { response.writeHead(404).end(); return; }
    const type = file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8';
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

async function open(lang = 'en', { consent = 'essential', blockStorage = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await ctx.route(/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/plain', body: '' }));
  if (blockStorage) await ctx.addInitScript(() => {
    const boom = () => { throw new Error('blocked'); };
    try { Object.defineProperty(window, 'localStorage', { configurable: true, get: () => ({ getItem: boom, setItem: boom, removeItem: boom }) }); } catch (e) {}
  });
  else if (consent) await ctx.addInitScript(v => { try { localStorage.setItem('cookie-consent', v); } catch (e) {} }, consent);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto(`${origin}/?lang=${lang}`);
  return { ctx, page, errors };
}

test('opening the panel moves focus in; Escape closes and returns focus to the trigger', async () => {
  const { ctx, page } = await open('en');
  const fab = page.locator('#fabA11y');
  await fab.click();
  assert.equal(await fab.getAttribute('aria-expanded'), 'true');
  const focusInside = await page.evaluate(() => document.getElementById('a11yPanel').contains(document.activeElement));
  assert.equal(focusInside, true, 'focus moves into the panel on open');
  await page.keyboard.press('Escape');
  assert.equal(await fab.getAttribute('aria-expanded'), 'false');
  assert.equal(await fab.evaluate(el => el === document.activeElement), true, 'focus returns to the trigger');
  await ctx.close();
});

test('focus is trapped within the panel while open', async () => {
  const { ctx, page } = await open('en');
  await page.locator('#fabA11y').click();
  const ids = await page.evaluate(() => {
    const panel = document.getElementById('a11yPanel');
    const focusable = [...panel.querySelectorAll('a[href],button,input,[tabindex]')].filter(n => !n.disabled && n.tabIndex >= 0 && n.getClientRects().length);
    return { firstText: focusable[0].textContent.trim(), lastIsLink: focusable[focusable.length - 1].classList.contains('a11y-statement') };
  });
  assert.ok(ids.lastIsLink, 'accessibility statement link is the last focusable');
  // Shift+Tab from the first focusable wraps to the last (the statement link).
  await page.evaluate(() => {
    const panel = document.getElementById('a11yPanel');
    panel.querySelector('a[href],button,input').focus();
  });
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('a11y-statement')), true);
  // Tab from the last wraps back to the first.
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.getElementById('a11yPanel').contains(document.activeElement)), true);
  await ctx.close();
});

test('toggles are keyboard-operable switches with aria-checked state', async () => {
  const { ctx, page } = await open('en');
  await page.locator('#fabA11y').click();
  const contrast = page.locator('[data-toggle="a11y-contrast"]');
  assert.equal(await contrast.getAttribute('role'), 'switch');
  assert.equal(await contrast.getAttribute('aria-checked'), 'false');
  await contrast.focus();
  await page.keyboard.press('Enter');
  assert.equal(await contrast.getAttribute('aria-checked'), 'true');
  assert.equal(await page.evaluate(() => document.body.classList.contains('a11y-contrast')), true);
  await page.keyboard.press(' ');
  assert.equal(await contrast.getAttribute('aria-checked'), 'false');
  await ctx.close();
});

test('the panel links to the accessibility statement and carries the language', async () => {
  const { ctx, page } = await open('en');
  const link = page.locator('#a11yPanel .a11y-statement');
  assert.match(await link.getAttribute('href'), /legal\/accessibility\.html\?lang=en/);
  await ctx.close();
});

test('widget is positioned on the logical start side in both directions', async () => {
  for (const [lang, side] of [['en', 'left'], ['he', 'right']]) {
    const { ctx, page } = await open(lang);
    const box = await page.locator('.fab-stack').boundingBox();
    const width = await page.evaluate(() => document.documentElement.clientWidth);
    if (side === 'left') assert.ok(box.x < width / 2, `${lang}: fab stack should sit on the left`);
    else assert.ok(box.x > width / 2, `${lang}: fab stack should sit on the right`);
    await ctx.close();
  }
});

test('the accessibility panel never stacks above the cookie banner', async () => {
  // Fresh visit (no prior consent) so the banner is present.
  const { ctx, page } = await open('en', { consent: null });
  await page.locator('#cookieAccept').waitFor({ state: 'visible', timeout: 4000 });
  await page.locator('#fabA11y').click();
  const z = await page.evaluate(() => ({
    banner: parseInt(getComputedStyle(document.getElementById('cookieBanner')).zIndex, 10),
    panel: parseInt(getComputedStyle(document.getElementById('a11yPanel')).zIndex, 10)
  }));
  assert.ok(z.banner > z.panel, `cookie banner (${z.banner}) must stack above the a11y panel (${z.panel})`);
  await ctx.close();
});

test('toggles tolerate blocked localStorage without errors', async () => {
  const { ctx, page, errors } = await open('en', { blockStorage: true });
  await page.locator('#fabA11y').click();
  await page.locator('[data-toggle="a11y-readable"]').click();
  assert.equal(await page.evaluate(() => document.body.classList.contains('a11y-readable')), true);
  assert.deepEqual(errors, [], 'no console errors with storage blocked');
  await ctx.close();
});
