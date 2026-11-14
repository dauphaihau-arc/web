/**
 * Bundle budgets for the built Nuxt apps.
 *
 * Totals are gzip transfer sizes (zlib level 9) over every emitted client
 * chunk, which is what users download across a session. `largestChunkBytes` is
 * the raw size of the biggest JS chunk, so one dependency ballooning fails
 * without penalizing legitimate route splitting.
 *
 * Usage: node scripts/check-bundle-budget.mjs <app> [<app>...]
 *        node scripts/check-bundle-budget.mjs storefront seller admin
 */
import { readFileSync, readdirSync } from 'node:fs';
import {
  basename, dirname, join, resolve, 
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const budgets = JSON.parse(readFileSync(join(rootDir, 'performance-budgets.json'), 'utf8'));

const apps = process.argv.slice(2);

if (apps.length === 0) {
  console.error('usage: node scripts/check-bundle-budget.mjs <app> [<app>...]');
  process.exit(2);
}

const UNITS = ['B', 'KB', 'MB'];

function format(bytes) {
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${UNITS[unit]}`;
}

function gzipBytes(path) {
  return gzipSync(readFileSync(path), { level: 9 }).length;
}

let failed = false;

for (const app of apps) {
  const budget = budgets[app];

  if (!budget) {
    console.error(`${app}: no budget in performance-budgets.json`);
    failed = true;
    continue;
  }

  const assetsDir = join(rootDir, 'apps', app, '.output', 'public', '_nuxt');

  let files;
  try {
    files = readdirSync(assetsDir);
  }
  catch {
    console.error(`${app}: ${assetsDir} not found — run \`pnpm build:${app}\` first`);
    failed = true;
    continue;
  }

  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));

  if (jsFiles.length === 0) {
    console.error(`${app}: no client JS chunks in ${assetsDir}`);
    failed = true;
    continue;
  }

  let jsGzip = 0;
  let cssGzip = 0;
  let largestChunk = 0;
  let largestName = '';

  for (const file of jsFiles) {
    const path = join(assetsDir, file);
    const raw = readFileSync(path).length;
    jsGzip += gzipBytes(path);

    if (raw > largestChunk) {
      largestChunk = raw;
      largestName = basename(file);
    }
  }

  for (const file of cssFiles) {
    cssGzip += gzipBytes(join(assetsDir, file));
  }

  const checks = [
    ['client JS (gzip)', jsGzip, budget.clientJsGzipBytes],
    ['client CSS (gzip)', cssGzip, budget.clientCssGzipBytes],
    [`largest chunk (raw) ${largestName}`, largestChunk, budget.largestChunkBytes],
  ];

  console.info(`${app} (${jsFiles.length} JS chunks, ${cssFiles.length} CSS chunks)`);

  for (const [label, actual, limit] of checks) {
    const over = actual > limit;
    failed ||= over;
    console.info(`  ${over ? 'FAIL' : 'ok  '}  ${label.padEnd(34)} ${format(actual).padStart(9)} / ${format(limit)}`);
  }
}

if (failed) {
  console.error('\nBundle budget exceeded. Shrink the change or raise performance-budgets.json with a reviewable reason.');
  process.exit(1);
}
