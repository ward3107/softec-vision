/**
 * Step 2 of the social reel: renders reel.html to MP4, frame by frame.
 *
 * From web/ (after `node docs/reel/capture.mjs`), with ffmpeg on PATH:
 *   node docs/reel/render.mjs          # both languages
 *   node docs/reel/render.mjs he       # one language
 *
 * Output (docs/reel/out/): softec-reel-{lang}.mp4 — 1080x1920, 30fps, H.264
 * High + AAC (silent track, so music can be added in the Instagram/Facebook
 * app), faststart — and softec-reel-{lang}-cover.jpg for the Reels cover.
 * The URL shown on screen defaults to the live site; override with REEL_URL.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from './playwright.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const WEB = join(DIR, '..', '..');
const OUT = join(DIR, 'out');
const URL_TEXT = process.env.REEL_URL ?? 'softecvision.vercel.app';
const COVER_AT = 2.6; // seconds — the hook frame, headline fully in
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['he', 'en'];

/** The reel's words, taken from the site's own translation files. */
function copyFor(lang) {
  const m = JSON.parse(readFileSync(join(WEB, 'messages', `${lang}.json`), 'utf8'));
  const cut = m.hero.title.indexOf(',');
  const wa = readFileSync(join(WEB, 'src/lib/catalog/seed.ts'), 'utf8').match(/WA_NUMBER = '972(\d{2})(\d{3})(\d{4})'/);
  return {
    lang,
    dir: lang === 'he' ? 'rtl' : 'ltr',
    eyebrow: m.hero.eyebrow,
    titleA: m.hero.title.slice(0, cut + 1),
    titleB: m.hero.title.slice(cut + 1).trim(),
    code: 'RAV-500',
    model: m.hero.model,
    avSub: m.capabilities.avSub,
    storyLead: m.hero.storyLead,
    s1: m.hero.s1,
    s2: m.hero.s2,
    s3: m.hero.s3,
    c1t: m.capabilities.custom,
    c1s: m.capabilities.customSub,
    c2t: m.capabilities.av,
    c2s: m.capabilities.avSub,
    c3t: m.capabilities.accessible,
    c3s: m.capabilities.accessibleSub,
    builtFor: m.hero.eyebrow.split('. ').slice(1).join('. '),
    explore: m.hero.explore,
    quote: m.hero.quote,
    delivery: m.hero.delivery,
    url: URL_TEXT,
    phone: wa ? `0${wa[1]}-${wa[2]}-${wa[3]}` : ''
  };
}

mkdirSync(OUT, { recursive: true });
mkdirSync(join(DIR, 'assets'), { recursive: true });
const copies = Object.fromEntries(['he', 'en'].map((l) => [l, copyFor(l)]));
writeFileSync(join(DIR, 'assets', 'copy.js'), `window.REEL_COPIES = ${JSON.stringify(copies, null, 2)};\n`);

const browser = await chromium.launch();
for (const lang of langs) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${pathToFileURL(join(DIR, 'reel.html')).href}?lang=${lang}`);
  await page.evaluate(() => window.reelReady);
  if (errors.length) throw new Error(`reel.html errors (${lang}): ${errors.join('; ')}`);
  const { FPS, DURATION } = await page.evaluate(() => ({ FPS: window.REEL.FPS, DURATION: window.REEL.DURATION }));
  const frames = Math.round(DURATION * FPS);

  // REEL_STILLS="1.5,5,9" — render just those moments as JPEGs (quick layout check).
  if (process.env.REEL_STILLS) {
    for (const t of process.env.REEL_STILLS.split(',').map(Number)) {
      await page.evaluate((s) => window.REEL.seek(s), t);
      await page.screenshot({ path: join(OUT, `still-${lang}-${t}.jpg`), type: 'jpeg', quality: 85 });
    }
    console.log(`${lang}: stills written`);
    await page.close();
    continue;
  }

  const file = join(OUT, `softec-reel-${lang}.mp4`);
  const ff = spawn('ffmpeg', [
    '-y', '-v', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-map', '0:v', '-map', '1:a', '-shortest',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', file
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = once(ff, 'close');

  const started = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.REEL.seek(t), f / FPS);
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await once(ff.stdin, 'drain');
    if (f % 90 === 0) process.stdout.write(`\r${lang}: frame ${f}/${frames}`);
  }
  ff.stdin.end();
  const [code] = await done;
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);

  await page.evaluate((t) => window.REEL.seek(t), COVER_AT);
  await page.screenshot({ path: join(OUT, `softec-reel-${lang}-cover.jpg`), type: 'jpeg', quality: 92 });
  console.log(`\r${lang}: ${frames} frames in ${((Date.now() - started) / 1000).toFixed(0)}s -> ${file}`);
  await page.close();
}
await browser.close();
