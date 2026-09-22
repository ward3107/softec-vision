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

test('catalog family keyboard navigation, filtering and URL reload work in both directions', async () => {
  for (const language of ['en', 'he']) {
    const page = await createPage(language);
    try {
      const first = page.locator('#catBar button').first();
      await first.focus();
      assert.equal(await first.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#catBar button[tabindex="0"]').count(), 1);
      await page.keyboard.press(language === 'en' ? 'ArrowRight' : 'ArrowLeft');
      assert.equal(await page.locator('#catBar button').nth(1).evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#catBar button[aria-pressed="true"]').getAttribute('data-category'), 'podium');
      assert.equal(await page.locator('#catBar button[aria-pressed="true"]').evaluate(element => element === document.activeElement), true);
      assert.match(await page.locator('#catBar [data-category="podium"]').textContent(), /6/);
      await page.locator('#subBar [data-subcategory="smart"]').click();
      assert.equal(await page.locator('#subBar [aria-pressed="true"]').evaluate(element => element === document.activeElement), true);
      assert.equal(await page.locator('#cardGrid .card').count(), 2);
      assert.deepEqual(await page.locator('#cardGrid .code').allTextContents(), ['LS-1000LPT', 'V-19W']);
      assert.match(page.url(), /cat=podium&sub=smart/);
      await page.reload();
      assert.equal(await page.locator('#cardGrid .card').count(), 2);
      assert.equal(await page.locator('#subBar [aria-pressed="true"]').getAttribute('data-subcategory'), 'smart');
      assert.ok(await page.locator('#cardGrid .spec-cue').first().textContent());
      assert.equal(await page.locator('#cardGrid img').first().getAttribute('loading'), 'lazy');
      assert.ok(await page.locator('#cardGrid .zoom-btn').first().textContent());
      await page.locator('#subBar [data-subcategory="no-tech"]').click();
      assert.equal(await page.locator('#cardGrid').isVisible(), false);
      assert.equal(await page.locator('#catEmpty a').getAttribute('href'), '#contact');
      assert.ok(await page.locator('#catEmpty').isVisible());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
    } finally { await page.close(); }
  }
});

test('catalog charging-cart and invalid URL state normalize on language switch and reload', async () => {
  const page = await createPage('en');
  try {
    await page.goto(`${origin}/?lang=en&cat=charging-carts&sub=invalid#catalog`);
    assert.match(page.url(), /cat=charging-carts&sub=all/);
    await page.locator('#languageToggle').click();
    assert.match(page.url(), /lang=he&cat=all&sub=all/);
    assert.doesNotMatch(page.url(), /charging-carts/);
    await page.reload();
    assert.equal(await page.locator('#catBar [aria-pressed="true"]').getAttribute('data-category'), 'all');
    assert.equal(await page.locator('#cardGrid .card').count(), 8);
    await page.goto(`${origin}/?lang=en&cat=podium&sub=operator`);
    assert.match(page.url(), /cat=podium&sub=all/);
    assert.equal(await page.locator('#cardGrid .card').count(), 5);
  } finally { await page.close(); }
});

test('product dialog traps keyboard focus, restores its invoker and hides unavailable media', async () => {
  for (const language of ['en', 'he']) {
    const page = await createPage(language);
    try {
      const trigger = page.locator('.zoom-btn').first();
      await trigger.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#lbClose').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.locator('#lbWa').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('#lbClose').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.locator('#lbPrev').isVisible(), false);
      assert.equal(await page.locator('#lbNext').isVisible(), false);
      assert.equal(await page.locator('#lbThumbs').isVisible(), false);
      assert.equal(await page.locator('#lb3dToggle').isVisible(), false);
      assert.match(new URL(await page.locator('#lbWa').getAttribute('href')).searchParams.get('text'), /LS-1000LPT/);
      await page.locator('#lbCompare').click();
      assert.equal(await page.locator('#lbCompare').getAttribute('aria-pressed'), 'true');
      assert.ok(await page.locator('#lbStatus').textContent());
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#lightbox').isVisible(), false);
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Enter');
      await page.locator('#lightbox').click({ position:{ x:2, y:2 } });
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    } finally { await page.close(); }
  }
});

test('desktop dialog close control stays at the logical viewport edge in both directions', async () => {
  for (const lang of ['en','he']) {
    const page = await createPage(lang);
    try {
      await page.setViewportSize({ width:1440,height:1000 });
      await page.locator('.zoom-btn').first().click();
      const box = await page.locator('#lbClose').boundingBox();
      assert.ok(lang === 'he' ? box.x < 40 : box.x + box.width > 1400, `${lang}: misplaced close control at ${box.x}`);
    } finally { await page.close(); }
  }
});

test('comparison enforces selection limits, announces changes and mirrors accessible table columns', async () => {
  for (const language of ['en', 'he']) {
    const page = await createPage(language);
    try {
      const check = index => page.locator(`[data-cmp="${index}"]`);
      await check(0).check();
      assert.equal(await page.locator('#cmpGo').isDisabled(), true);
      assert.match(await page.locator('#catalogStatus').textContent(), /LS-1000LPT/);
      await check(1).check();
      await check(2).check();
      await check(3).click();
      assert.equal(await check(3).isChecked(), false);
      assert.match(await page.locator('#catalogStatus').textContent(), language === 'en' ? /up to three/ : /שלושה/);
      await check(2).uncheck();
      assert.match(await page.locator('#catalogStatus').textContent(), /IX-1/);
      await page.locator('#cmpGo').click();
      assert.equal(await page.locator('#cmpClose').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.locator('#cmpModal').getAttribute('aria-modal'), 'true');
      const headers = await page.locator('#cmpTable thead th[scope="col"]').evaluateAll(elements => elements.map(el => ({ code:el.textContent, x:el.getBoundingClientRect().x })));
      assert.match(headers[1].code, /LS-1000LPT/);
      assert.ok(language === 'he' ? headers[1].x > headers[2].x : headers[1].x < headers[2].x);
      assert.ok(await page.locator('#cmpTable tbody th[scope="row"]').count());
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'cmpTableScroll');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('#cmpClose').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#cmpModal').isVisible(), false);
      assert.equal(await page.locator('#cmpGo').evaluate(el => el === document.activeElement), true);
      await page.locator('#cmpClear').click();
      assert.equal(await page.locator('#cmpTray').isVisible(), false);
      assert.ok(await page.locator('#catalogStatus').textContent());
    } finally { await page.close(); }
  }
});

async function createMediaFixturePage(language, setup) {
  const page = await browser.newPage({ viewport:{ width:390, height:844 } });
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'essential'));
  await page.route('https://cdnjs.cloudflare.com/**', route => route.fulfill({ contentType:'application/javascript', body:'' }));
  await page.route(`${origin}/?**`, route => route.fulfill({
    contentType:'text/html; charset=utf-8',
    body:fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8').replace('/* APP_CORE_END */', `${setup}\n/* APP_CORE_END */`)
  }));
  await page.goto(`${origin}/?lang=${language}`);
  return page;
}

test('removing a filtered-out comparison product returns focus to the active family', async () => {
  const page = await createPage('en');
  try {
    for (const action of ['chip', 'clear']) {
      await page.locator('#catBar [data-category="all"]').click();
      await page.locator('[data-cmp="0"]').check();
      await page.locator('#catBar [data-category="info-display"]').click();
      await page.locator(action === 'chip' ? '#cmpTrayItems button' : '#cmpClear').click();
      assert.equal(await page.locator('#catBar [aria-pressed="true"]').evaluate(element => element === document.activeElement), true);
      assert.equal(await page.locator('#cmpTray').isVisible(), false);
    }
  } finally { await page.close(); }
});

test('dialog gallery substitutes primary imagery for broken optional thumbnails and omits empty specifications', async () => {
  const page = await createMediaFixturePage('en', "products[0].gallery = [products[0].img, 'data:image/png;base64,broken']; products[0].specs = { he:{}, en:{} };");
  try {
    await page.locator('.zoom-btn').first().click();
    assert.equal(await page.locator('#lbSpecs').isVisible(), false);
    const thumbnails = page.locator('#lbThumbs img');
    await thumbnails.evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
    assert.equal(await thumbnails.nth(1).evaluate(image => image.naturalWidth > 0), true);
    await page.locator('#lbNext').click();
    await page.locator('#lbImg').evaluate(image => image.decode());
    assert.equal(await page.locator('#lbImg').evaluate(image => image.naturalWidth > 0), true);
    assert.match(await page.locator('#lbImg').getAttribute('alt'), /Product Image 2/);
    assert.equal(await page.locator('.lb-thumb').nth(1).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('ArrowLeft');
    assert.match(await page.locator('#lbImg').getAttribute('alt'), /Product Image 1/);
  } finally { await page.close(); }
});

test('dialog 3D action recovers with localized feedback when its renderer is unavailable', async () => {
  for (const lang of ['en', 'he']) {
    const page = await createMediaFixturePage(lang, "products[0].model3d = 'https://example.invalid/model.glb';");
    try {
      await page.locator('.zoom-btn').first().click();
      await page.locator('#lb3dToggle').click();
      assert.equal(await page.locator('#lbImg').isVisible(), true);
      assert.match(await page.locator('#lbStatus').textContent(), lang === 'en' ? /not available/ : /אינה זמינה/);
      assert.equal(await page.locator('#lb3dToggle').getAttribute('aria-pressed'), 'false');
    } finally { await page.close(); }
  }
});
