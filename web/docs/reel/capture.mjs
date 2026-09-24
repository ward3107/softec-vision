/**
 * Step 1 of the social reel: captures the live site as it looks on a phone,
 * for the "website" scene (a phone mockup scrolling through the homepage).
 *
 * From web/, with a production server running (npm run build && npx next start -p 3100):
 *   node docs/reel/capture.mjs
 *
 * Writes docs/reel/assets/site-{he,en}.png — a tall, retina-resolution
 * screenshot of the mobile homepage per locale. Override the target with
 * BASE_URL. Floating widgets (WhatsApp, accessibility, consent) are hidden so
 * the scroll reads as clean page content.
 */
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from './playwright.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'assets');
const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
// Enough of the page to cover the hero, the capabilities band and the first
// product rows — the scroll in the reel is ~3.5s, so more would blur past.
const MAX_HEIGHT = 3400;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const lang of ['he', 'en']) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    colorScheme: 'light'
  });
  // Skip the first-visit brand splash so the page is captured at rest.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('softec-brand-intro-seen', '1');
    } catch {}
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${lang}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `.fixed:not(header):not(header *){display:none!important}
      [data-reveal],.reveal{opacity:1!important;transform:none!important}`
  });
  await page.waitForTimeout(1200);
  const height = Math.min(MAX_HEIGHT, await page.evaluate(() => document.documentElement.scrollHeight));
  await page.screenshot({
    path: join(OUT, `site-${lang}.png`),
    clip: { x: 0, y: 0, width: 390, height },
    fullPage: true
  });
  console.log(`captured site-${lang}.png (390x${height} @3x)`);
  await ctx.close();
}
await browser.close();
