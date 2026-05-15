// @ts-nocheck

import dauphaihauConfig from '@dauphaihau/eslint-config';
import withNuxt from './.nuxt/eslint.config.mjs';

const duplicatedNuxtPlugins = new Set([
  '@stylistic',
  '@typescript-eslint',
  'tailwindcss',
  'vue',
]);

function stripDuplicatedPlugins(config) {
  if (!config?.plugins) {
    return config;
  }

  const plugins = Object.fromEntries(
    Object.entries(config.plugins).filter(([name]) => !duplicatedNuxtPlugins.has(name))
  );

  if (Object.keys(plugins).length > 0) {
    return { ...config, plugins };
  }

  const configWithoutPlugins = { ...config };
  delete configWithoutPlugins.plugins;

  return configWithoutPlugins;
}

export default withNuxt(
  ...(await dauphaihauConfig()).map(stripDuplicatedPlugins),
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    files: ['src/shared/types/**/*.ts', 'src/server/api/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'property',
          format: null,
        },
        {
          selector: 'typeProperty',
          format: null,
        },
        {
          selector: 'objectLiteralProperty',
          format: null,
        },
      ],
    },
  },
  {
    ignores: [
      '**/*.config.js',
      '**/*.config.ts',
      '!**/eslint.config.js',
      '*.d.ts',
      '**/dist/',
      '.idea/',
      '.gitignore',
      'public/*',
      'src/assets/**',
    ],
  }
);
