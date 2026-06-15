import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { NuxtPage } from '@nuxt/schema'
import { manualChunks } from '../../packages/utils/src/manual-chunks'
import pkg from './package.json'

const packagesDir = fileURLToPath(new URL('../../packages/', import.meta.url))
const uiPackageDir = `${packagesDir}ui/src`
const require = createRequire(import.meta.url)
const debugEntry = require.resolve('debug/src/index.js')

const assetHost = process.env.ASSET_HOST || ''
const awsHostBucketAlias = assetHost.replace(/\/+$/, '')

function removePageComponents(pages: NuxtPage[]) {
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    const page = pages[index]

    if (page.file?.includes('/pages/') && page.file.includes('/_components/')) {
      pages.splice(index, 1)
      continue
    }

    if (page.children?.length) {
      removePageComponents(page.children)
    }
  }
}

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
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicon.png' },
      ],
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
    debug: debugEntry,
  },

  devServer: {
    host: '0.0.0.0',
    port: 4000,
  },

  srcDir: 'src/',
  dir: {
    assets: 'app/assets',
    layouts: 'app/layouts',
    middleware: 'app/middleware',
    pages: 'app/pages',
    plugins: 'app/plugins',
  },
  ssr: true,
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
      crossOriginEmbedderPolicy: false
    },
  },

  runtimeConfig: {
    public: {
      apiBaseURL: process.env.API_BASE_URL,
      apiVersion: process.env.API_VERSION,
      assetHost: process.env.ASSET_HOST,
      sellerAppURL: process.env.SELLER_APP_URL || 'http://localhost:4001',
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
    dirs: ['shared/composables', 'shared/utils', `${packagesDir}utils/src`],
  },

  hooks: {
    'pages:extend'(pages) {
      removePageComponents(pages)
    },
  },

  routeRules: {
    '/': { isr: 3600 },
    '/c/**': { ssr: false },
    '/search': { ssr: true },
    '/success': { ssr: false },
    '/guest-orders/**': { ssr: false },
    '/cart/**': { ssr: false },
    '/checkout/**': { ssr: false },
    '/account/**': { ssr: false },
    '/orders/**': { ssr: false },
    '/reset/**': { ssr: false },
    '/**': { isr: 300 },
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

  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  },

  compatibilityDate: '2024-08-21',
})
