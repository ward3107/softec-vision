// Run with Playwright available through NODE_PATH; the shipped page has no dependency.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

let browser, server, origin;
before(async () => {
  const root = path.resolve(__dirname, '..');
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!['index.html', 'logo.svg', 'logo-dark.svg'].includes(file)) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', file.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8');
    response.end(fs.readFileSync(path.join(root, file)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel:'chrome', headless:true, ignoreDefaultArgs:['--hide-scrollbars'] });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function createPage(language) {
  const page = await browser.newPage({ viewport:{ width:320, height:740 } });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'essential'));
  await page.goto(`${origin}/?lang=${language}`);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test('menu accessible names track initial language, disclosure, language changes and Escape', async () => {
  const names = { he:{ closed:'פתיחת תפריט', open:'סגירת תפריט' }, en:{ closed:'Open menu', open:'Close menu' } };
  for (const initial of ['he', 'en']) {
    const page = await createPage(initial);
    try {
      const menu = page.locator('#menuToggle');
      const other = initial === 'he' ? 'en' : 'he';
      assert.equal(await menu.getAttribute('aria-label'), names[initial].closed, `${initial}: initial closed name`);
      await menu.click();
      assert.equal(await menu.getAttribute('aria-label'), names[initial].open, `${initial}: open name`);
      await page.locator('#languageToggle').click();
      assert.equal(await menu.getAttribute('aria-label'), names[other].closed, `${other}: language switch closes menu`);
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-label'), names[other].open, `${other}: reopened name after language switch`);
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-label'), names[other].closed, `${other}: closed name after Escape`);
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      assert.equal(await menu.evaluate(element => element === document.activeElement), true);
      await page.locator('#languageToggle').click();
      assert.equal(await menu.getAttribute('aria-label'), names[initial].closed, `${initial}: closed name after language switch`);
    } finally { await page.close(); }
  }
});

test('mobile language keyboard activation closes the menu and returns focus to its trigger', async () => {
  const page = await createPage('he');
  try {
    const menuToggle = page.locator('#menuToggle');
    const mobileLanguageToggle = page.locator('#mobileLanguageToggle');
    await menuToggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#mobileMenu').getAttribute('hidden'), null);
    await mobileLanguageToggle.focus();
    assert.equal(await mobileLanguageToggle.evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#mobileMenu').getAttribute('hidden'), '');
    assert.equal(await menuToggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await menuToggle.evaluate(element => element === document.activeElement), true);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
    assert.match(page.url(), /[?&]lang=en(?:&|#|$)/);
  } finally { await page.close(); }
});

test('320px header fits both directions with a visible scrollbar and 44px menu/language targets', async () => {
  for (const language of ['he', 'en']) {
    const page = await createPage(language);
    try {
      // Reserve a real 15px desktop scrollbar: mobile emulation uses overlay scrollbars.
      await page.addStyleTag({ content:'html { overflow-y:scroll; scrollbar-gutter:stable; } ::-webkit-scrollbar { width:15px; }' });
      const layout = await page.evaluate(() => {
        const header = document.querySelector('.nav-inner');
        const bounds = header.getBoundingClientRect();
        return {
          clientWidth:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth,
          viewport:innerWidth,
          bounds:{ left:bounds.left, right:bounds.right },
          controls:[...header.querySelectorAll('.brand,.nav-cta,#languageToggle,#menuToggle')].map(element => {
            const box = element.getBoundingClientRect();
            return { name:element.id || element.className, left:box.left, right:box.right, width:box.width, height:box.height };
          })
        };
      });
      assert.equal(layout.viewport, 320);
      assert.equal(layout.clientWidth, 305, `${language}: visible scrollbar must be reserved`);
      assert.ok(layout.scrollWidth <= layout.clientWidth, `${language}: document overflows: ${JSON.stringify(layout)}`);
      for (const control of layout.controls) {
        assert.ok(control.left >= layout.bounds.left && control.right <= layout.bounds.right + .1, `${language}: clipped ${JSON.stringify(control)}`);
        if (['languageToggle','menuToggle'].includes(control.name)) {
          assert.ok(control.width >= 43.9 && control.height >= 43.9, `${language}: undersized ${control.name}`);
        }
      }
    } finally { await page.close(); }
  }
});

test('English renders generated catalog, dialog, comparison and language URL state', async () => {
  const page = await createPage('en');
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => consoleErrors.push(error.message));
  try {
    assert.deepEqual(await page.locator('html').evaluate(element => ({ lang:element.lang, dir:element.dir })), { lang:'en', dir:'ltr' });
    assert.equal(await page.title(), 'Softec Vision | Lecturer, Control and Display Stations');
    assert.equal(await page.locator('#catalogTitle').textContent(), 'Product Families');
    assert.ok(await page.locator('#catBar').getByText('Computer Charging Carts', { exact:true }).isVisible());
    assert.equal(await page.locator('.card .name').first().textContent(), 'Compact Lecturer Station');

    await page.locator('.zoom-btn').first().click();
    assert.equal(await page.locator('#lbName').textContent(), 'Compact Lecturer Station');
    assert.match(await page.locator('#lbSpecs').textContent(), /Technical SpecificationsDisplays/);
    assert.equal(await page.locator('#lbWa span').textContent(), 'Ask About This Product on WhatsApp');
    await page.locator('#lbClose').click();

    await page.locator('[data-cmp="0"]').evaluate(element => element.click());
    await page.locator('[data-cmp="1"]').evaluate(element => element.click());
    await page.locator('#cmpGo').click();
    assert.match(await page.locator('#cmpTable').textContent(), /Compact Lecturer Station/);
    assert.doesNotMatch(await page.locator('#cmpTable').textContent(), /[\u0590-\u05ff]/);
    await page.locator('#cmpClose').click();

    await page.locator('#catBar').getByText('Computer Charging Carts', { exact:true }).click();
    assert.match(await page.locator('#catEmpty').textContent(), /No models are currently listed/);
    await page.locator('#languageToggle').click();
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.match(page.url(), /[?&]lang=he(?:&|#|$)/);
    assert.equal(await page.locator('#catBar').getByText('עגלות טעינה למחשבים', { exact:true }).count(), 0);
    assert.equal(await page.locator('#catalogStatus').textContent(), 'השפה הוחלפה לעברית.');
    assert.deepEqual(consoleErrors, []);
  } finally { await page.close(); }
});
