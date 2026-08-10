// @ts-nocheck

import { createNuxtAppConfig } from '@arc/eslint-config';
import withNuxt from './.nuxt/eslint.config.mjs';

export default await createNuxtAppConfig(withNuxt, {
  tsconfigRootDir: import.meta.dirname,
  tailwindConfigPath: `${import.meta.dirname}/tailwind.config.ts`,
  domainNamingConventionFiles: [
    'src/domains/**/api/**/*.ts',
    'src/domains/**/mutations/**/*.ts',
    'src/domains/**/queries/**/*.ts',
    'src/server/api/**/*.ts',
  ],
  singleWordVueComponentFiles: [
    'src/app/pages/**/*.vue',
    'apps/storefront/src/app/pages/**/*.vue',
    'src/app/components/**/*.vue',
    'apps/storefront/src/app/components/**/*.vue',
    'src/app/layouts/**/*.vue',
    'apps/storefront/src/app/layouts/**/*.vue',
  ],
});
