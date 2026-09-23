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
await browser.close();
console.log('done');
