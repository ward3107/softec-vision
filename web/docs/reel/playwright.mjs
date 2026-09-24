/**
 * Playwright is intentionally not a project dependency (see web/README.md).
 * Use a local install if there is one, otherwise fall back to the global
 * `npm i -g playwright` — ESM imports ignore NODE_PATH, so resolve it by hand.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

async function load() {
  try {
    return await import('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return createRequire(join(globalRoot, 'noop.js'))('playwright');
  }
}

export const { chromium } = await load();
