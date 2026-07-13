import { fileURLToPath } from 'node:url'
import pkg from './package.json'

const packagesDir = fileURLToPath(new URL('../../packages/', import.meta.url))
const uiPackageDir = `${packagesDir}ui/src`

const assetHost = process.env.ASSET_HOST || ''
const awsHostBucketAlias = assetHost.replace(/\/+$/, '')

export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: `%s - ${pkg.name}`,
      meta: [
        { charset: 'utf-8' },
        {
          hid: 'viewport',
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        { hid: 'description', name: 'description', content: pkg.description },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  alias: {
    '@arc/ui': uiPackageDir,
    '@arc/contracts': `${packagesDir}contracts/src`,
    '@arc/models': `${packagesDir}models/src`,
    '@arc/enums': `${packagesDir}enums/src`,
    '@arc/schemas': `${packagesDir}schemas/src`,
    '@arc/utils': `${packagesDir}utils/src`,
  },

  devServer: {
    host: '0.0.0.0',
    port: 4001,
  },

  srcDir: 'src/',
  dir: {
    assets: 'app/assets',
    layouts: 'app/layouts',
    middleware: 'app/middleware',
    pages: 'app/pages',
    plugins: 'app/plugins',
  },
  ssr: false,
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/devtools',
    '@pinia/nuxt',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    'nuxt-security',
    '@formkit/auto-animate/nuxt',
    '@nuxt/image',
    '@samk-dev/nuxt-vcalendar',
    '@hebilicious/vue-query-nuxt',
  ],

  eslint: {
    config: {
      stylistic: true,
    },
  },

  typescript: {
    strict: true,
    typeCheck: process.env.NUXT_TYPECHECK === 'true',
  },

  security: {
    headers: {
      contentSecurityPolicy: false,
      // crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp',
      crossOriginEmbedderPolicy: false
    },
  },

  runtimeConfig: {
    public: {
      apiBaseURL: process.env.API_BASE_URL,
      apiVersion: process.env.API_VERSION,
      assetHost: process.env.ASSET_HOST,
      storefrontAppURL: process.env.STOREFRONT_APP_URL || 'http://localhost:4000',
    },
  },

  pinia: {
    storesDirs: ['./src/shared/stores/**'],
  },

  components: [
    {
      path: 'app/components',
      pathPrefix: false,
    },
    {
      path: 'shared/ui',
      pathPrefix: false,
    },
    {
      path: uiPackageDir,
      pathPrefix: false,
    },
  ],

  imports: {
    dirs: ['shared/composables', 'shared/utils', `${packagesDir}utils/src`, `${packagesDir}composables/src`],
  },

  i18n: {
    locales: [
      {
        code: 'en',
        file: 'en-us.js',
      },
      {
        code: 'fr',
        file: 'fr-fr.js',
      },
      {
        code: 'la',
        file: 'la-la.js',
      },
    ],
    lazy: true,
    langDir: 'app/locales',
    defaultLocale: 'en',
  },

  colorMode: {
    preference: 'light',
  },

  css: ['~/app/assets/css/main.css'],

  image: {
    provider: 'none',
    alias: {
      assetHost: awsHostBucketAlias
    }
  },

  compatibilityDate: '2024-08-21',
})
