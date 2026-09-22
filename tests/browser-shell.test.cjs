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
      assert.equal(await menu.getAttribute('aria-label'), names[other].open, `${other}: open name after language switch`);
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-label'), names[other].closed, `${other}: closed name after Escape`);
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      assert.equal(await menu.evaluate(element => element === document.activeElement), true);
      await page.locator('#languageToggle').click();
      assert.equal(await menu.getAttribute('aria-label'), names[initial].closed, `${initial}: closed name after language switch`);
    } finally { await page.close(); }
  }
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
