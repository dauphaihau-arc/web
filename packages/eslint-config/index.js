import dauphaihauConfig from '@dauphaihau/eslint-config';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';

const duplicatedNuxtPlugins = new Set([
  '@stylistic',
  '@typescript-eslint',
  'vue',
]);

const namingConventionRules = {
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
};

export const ignoresConfig = {
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
};

function stripDuplicatedPlugins(config) {
  if (!config?.plugins) {
    return config;
  }

  const plugins = Object.fromEntries(
    Object.entries(config.plugins).filter(([name]) => !duplicatedNuxtPlugins.has(name)),
  );

  if (Object.keys(plugins).length > 0) {
    return { ...config, plugins };
  }

  const configWithoutPlugins = { ...config };
  delete configWithoutPlugins.plugins;

  return configWithoutPlugins;
}

function createTypeScriptFilesConfigs({ tailwindConfigPath, tsconfigRootDir } = {}) {
  const sharedLanguageOptions = {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      tsconfigRootDir,
    },
  };

  const typeScriptConfig = {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsParser,
    },
  };

  const vueConfig = {
    files: ['**/*.vue'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      ...sharedLanguageOptions,
      parser: vueParser,
      parserOptions: {
        ...sharedLanguageOptions.parserOptions,
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        tsconfigRootDir,
      },
    },
  };

  if (tailwindConfigPath) {
    typeScriptConfig.settings = {
      tailwindcss: {
        config: tailwindConfigPath,
      },
    };
    vueConfig.settings = {
      tailwindcss: {
        config: tailwindConfigPath,
      },
    };
  }

  return [typeScriptConfig, vueConfig];
}

export async function createSharedConfig({
  stripNuxtPlugins = false,
  tailwindConfigPath,
  tsconfigRootDir,
} = {}) {
  const baseConfig = await dauphaihauConfig();

  const normalizedBaseConfig = stripNuxtPlugins
    ? baseConfig.map(stripDuplicatedPlugins)
    : baseConfig;

  return [
    ...normalizedBaseConfig,
    ...createTypeScriptFilesConfigs({ tailwindConfigPath, tsconfigRootDir }),
    {
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
        'tailwindcss/no-custom-classname': 'off',
      },
    },
  ];
}

export function createDomainNamingConventionConfig(files) {
  return {
    files,
    rules: namingConventionRules,
  };
}

export function createSingleWordVueComponentNameConfig(files) {
  return {
    files,
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  };
}

function createNuxtAppDefaultOverrides() {
  return [
    {
      files: [
        'src/app/pages/**/\\[*\\].vue',
        'src/app/pages/**/\\[...*\\].vue',
      ],
      rules: {
        'check-file/filename-naming-convention': 'off',
      },
    },
    {
      files: ['e2e/**/*.ts'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'typeProperty',
            format: null,
          },
        ],
      },
    },
    {
      files: ['scripts/**/*.{js,mjs,cjs,ts}'],
      rules: {
        'no-console': 'off',
      },
    },
  ];
}

export async function createNuxtAppConfig(
  withNuxt,
  {
    domainNamingConventionFiles,
    overrides = [],
    singleWordVueComponentFiles,
    tailwindConfigPath,
    tsconfigRootDir,
  },
) {
  return withNuxt(
    ...(await createSharedConfig({
      stripNuxtPlugins: true,
      tailwindConfigPath,
      tsconfigRootDir,
    })),
    createDomainNamingConventionConfig(domainNamingConventionFiles),
    createSingleWordVueComponentNameConfig(singleWordVueComponentFiles),
    ...createNuxtAppDefaultOverrides(),
    ...overrides,
    ignoresConfig,
  );
}
