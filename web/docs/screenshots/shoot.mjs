/**
 * Regenerates the README screenshots.
 *
 * Setup (one-off):
 *   npm i -D playwright
 *   npx playwright install chromium
 *
 * Then, from web/, with a production server running (npm run build && npm run start):
 *   node docs/screenshots/shoot.mjs
 *
 * Override the target with BASE_URL, e.g. BASE_URL=http://localhost:3000 node docs/screenshots/shoot.mjs
 * Captured in light mode with reduced motion so the reveal/typing animations
 * resolve to their final state.
 *
 * To also capture the admin dashboard, set ADMIN_EMAIL and ADMIN_PASSWORD (a
 * staff login for the target); with them unset the admin shot is skipped and no
 * credentials live in this file.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const OUT = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? 'http://localhost:3100';

const shots = [
  { name: 'home-desktop', path: '/he', w: 1280, h: 820 },
  { name: 'catalog-desktop', path: '/he/catalog', w: 1280, h: 1120 },
  { name: 'product-desktop', path: '/he/product/RAV-500', w: 1280, h: 860 },
  { name: 'contact-desktop', path: '/he/contact', w: 1280, h: 900 },
  { name: 'catalog-mobile', path: '/he/catalog', w: 390, h: 780 }
];

const browser = await chromium.launch();
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(OUT, `${s.name}.png`) });
  console.log('shot', s.name);
  await ctx.close();
}

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'כניסה עם סיסמה' }).click();
  await page.waitForSelector('input[name="password"]', { state: 'visible', timeout: 15000 });
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'כניסה', exact: true }).click();
  await page.waitForURL('**/admin', { timeout: 25000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(OUT, 'admin-dashboard.png') });
  console.log('shot admin-dashboard');
  await ctx.close();
}

await browser.close();
console.log('done');
