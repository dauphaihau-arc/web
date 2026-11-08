#!/usr/bin/env node
// Assert that the storefront build actually emits usable ISR rules.
//
// `isr` is inert unless the build runs the Netlify (or Vercel) preset, and it is
// silently downgraded to a static file if a route is prerendered. Neither shows
// up in nuxt.config.ts, so the contract is read from the build artifact that
// nuxt.config.ts writes at `nitro.hooks.compiled`.
//
// usage: node scripts/assert-isr.mjs [--contract <path>]
// exit:  0 = contract satisfied, 1 = violation, 2 = contract artifact missing
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Product decisions pinned here on purpose: a change to one of these TTLs has to
// be acknowledged in this file too.
const EXPECTED_ISR = {
  '/': 3600,
  '/**': 300,
};

const args = process.argv.slice(2);
const contractArg = args.includes('--contract') ? args[args.indexOf('--contract') + 1] : undefined;

// Nitro writes the contract into its output dir, which depends on the preset.
// CI builds with the netlify preset; `.output` is the node-server layout.
const contractCandidates = contractArg
  ? [resolve(contractArg)]
  : [
    join(appDir, '.netlify/functions-internal/isr-contract.json'),
    join(appDir, '.output/isr-contract.json'),
  ];

const contractPath = contractCandidates.find(path => existsSync(path));

const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }

  console.log(`${condition ? 'PASS' : 'FAIL'} ${message}`);
}

if (!contractPath) {
  console.error(`No ISR contract artifact found. Looked in:\n${contractCandidates.map(path => `  ${path}`).join('\n')}`);
  console.error('Build first with the Netlify preset: NITRO_PRESET=netlify pnpm build:storefront');
  process.exit(2);
}

const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
const routeRules = contract.routeRules ?? {};

check(typeof contract.preset === 'string' && contract.preset.startsWith('netlify'), `build preset is netlify (got ${contract.preset})`);

for (const [route, maxAge] of Object.entries(EXPECTED_ISR)) {
  const rule = routeRules[route];
  check(rule?.isr === maxAge, `route ${route} has isr: ${maxAge} (got ${JSON.stringify(rule?.isr)})`);
}

for (const [route, rule] of Object.entries(routeRules)) {
  if (!rule?.isr) {
    continue;
  }

  check(rule.cache !== false, `route ${route} with isr does not set cache: false`);
  check(rule.ssr !== false, `route ${route} with isr does not set ssr: false`);
  check(!rule.prerender, `route ${route} with isr is not also prerendered`);
}

for (const [route, rule] of Object.entries(routeRules)) {
  if (rule?.cache === false) {
    check(!rule.isr, `route ${route} with cache: false has no isr`);
  }
}

const prerenderedIndex = contract.publicDir ? join(contract.publicDir, 'index.html') : undefined;
check(Boolean(prerenderedIndex), 'build reports a public dir');
check(Boolean(prerenderedIndex) && !existsSync(prerenderedIndex), '/ is not prerendered into public/index.html');

if (failures.length > 0) {
  console.error(`\nISR contract violated (${failures.length}):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`\nISR contract satisfied (${contractPath})`);
