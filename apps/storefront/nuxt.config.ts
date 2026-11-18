import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NuxtI18nOptions } from '@nuxtjs/i18n'
import { APP_ICON_CLIENT_BUNDLE_ICONS, APP_ICON_COLLECTIONS } from '../../packages/ui/src/foundation/app-icon.constants'
import { sharedFonts } from '../../packages/ui/src/foundation/nuxt-fonts'
import { removePageComponents } from '../../packages/ui/src/foundation/nuxt-pages'
import pkg from './package.json'

const packagesDir = fileURLToPath(new URL('../../packages/', import.meta.url))
const uiPackageDir = `${packagesDir}ui/src`
const sharedUiDir = fileURLToPath(new URL('./src/shared/ui', import.meta.url))
const appComponentsDir = fileURLToPath(new URL('./src/app/components', import.meta.url))
const require = createRequire(import.meta.url)
const debugEntry = require.resolve('debug/src/index.js')

const assetHost = process.env.ASSET_HOST || ''
const awsHostBucketAlias = assetHost.replace(/\/+$/, '')

// Every locale/area pair is a separate lazy-loaded resource so a new area can
// be filled in by one domain slice without touching the module config.
const localeFiles = ['common.json', 'header.json', 'footer.json', 'home.json', 'preferences.json', 'catalog.json', 'cart.json', 'checkout.json', 'account.json']

// `lazy` no longer exists in @nuxtjs/i18n v10 (locale files are always loaded
// on demand), but it stays part of the storefront i18n contract so the config
// reads the same across apps.
const i18nOptions: NuxtI18nOptions & { lazy?: boolean } = {
  strategy: 'prefix_except_default',
  defaultLocale: 'en',
  vueI18n: './i18n.config.ts',
  restructureDir: 'src/i18n',
  langDir: 'locales',
  lazy: true,
  detectBrowserLanguage: false,
  locales: [
    {
      code: 'en',
      language: 'en-US',
      name: 'English',
      files: localeFiles.map(file => `en/${file}`),
    },
    {
      code: 'vi',
      language: 'vi-VN',
      name: 'Tiếng Việt',
      files: localeFiles.map(file => `vi/${file}`),
    },
  ],
}

export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: `%s - ${pkg.name}`,
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        { name: 'description', content: pkg.description },
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
    port: 4001,
  },

  srcDir: 'src/',
  serverDir: 'src/server',
  dir: {
    assets: 'app/assets',
    public: 'src/public',
    layouts: 'app/layouts',
    middleware: 'app/middleware',
    pages: 'app/pages',
    plugins: 'app/plugins',
  },
  ssr: true,
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-security',
    '@formkit/auto-animate/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    ['@arc/nuxt-vue-query', { categoryIdentityPolicy: true }],
  ],

  i18n: i18nOptions,

  icon: {
    fallbackToApi: false,
    serverBundle: {
      collections: [...APP_ICON_COLLECTIONS],
    },
    clientBundle: {
      icons: [...APP_ICON_CLIENT_BUNDLE_ICONS],
      scan: true,
    },
  },

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
      crossOriginEmbedderPolicy: false,
      xFrameOptions: 'DENY',
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubdomains: true
      }
    },
  },

  runtimeConfig: {
    public: {
      apiBaseURL: process.env.API_BASE_URL,
      apiVersion: process.env.API_VERSION,
      assetHost: process.env.ASSET_HOST,
      categoryIdentityContractVersion: process.env.NUXT_PUBLIC_CATEGORY_IDENTITY_CONTRACT_VERSION,
      sellerAppURL: process.env.SELLER_APP_URL || 'http://localhost:4002',
    },
  },

  pinia: {
    storesDirs: ['./domains/**/*.store.ts'],
  },

  components: [
    ...(existsSync(appComponentsDir)
      ? [{
          path: 'app/components',
          pathPrefix: false,
        }]
      : []),
    ...(existsSync(sharedUiDir)
      ? [{
          path: 'shared/ui',
          pathPrefix: false,
        }]
      : []),
    {
      path: uiPackageDir,
      pathPrefix: false,
      extensions: ['.vue'],
    },
  ],

  imports: {
    dirs: ['shared/composables', 'shared/utils', `${packagesDir}utils/src`, `${packagesDir}composables/src`],
  },

  hooks: {
    'pages:extend'(pages) {
      removePageComponents(pages)
    },
    // ISR is only honoured by the Netlify/Vercel presets, so assert the built
    // artifact rather than trusting the config source. See scripts/assert-isr.mjs.
    'nitro:init'(nitro) {
      if (nitro.options.dev) {
        return
      }

      nitro.hooks.hook('compiled', async () => {
        const contract = {
          preset: nitro.options.preset,
          publicDir: nitro.options.output.publicDir,
          routeRules: nitro.options.routeRules,
        }

        await writeFile(
          join(nitro.options.output.dir, 'isr-contract.json'),
          `${JSON.stringify(contract, null, 2)}\n`,
        )
      })
    },
  },

  // The Vietnamese routes are real, separately cached URLs; every policy is
  // mirrored under `/vi/**` so the prefix never falls through to `/**`.
  routeRules: {
    '/': { isr: 3600 },
    '/vi': { isr: 3600 },
    '/c/**': { ssr: true, isr: false, cache: false },
    '/vi/c/**': { ssr: true, isr: false, cache: false },
    '/search': { ssr: true, isr: false, cache: false },
    '/vi/search': { ssr: true, isr: false, cache: false },
    '/success': { ssr: false, isr: false, cache: false },
    '/vi/success': { ssr: false, isr: false, cache: false },
    '/guest-orders/**': { ssr: false, isr: false, cache: false },
    '/vi/guest-orders/**': { ssr: false, isr: false, cache: false },
    '/cart/**': { ssr: false, isr: false, cache: false },
    '/vi/cart/**': { ssr: false, isr: false, cache: false },
    '/checkout/**': { ssr: false, isr: false, cache: false },
    '/vi/checkout/**': { ssr: false, isr: false, cache: false },
    '/account/**': { ssr: false, isr: false, cache: false },
    '/vi/account/**': { ssr: false, isr: false, cache: false },
    '/messages': { ssr: false, isr: false, cache: false },
    '/vi/messages': { ssr: false, isr: false, cache: false },
    '/orders/**': { ssr: false, isr: false, cache: false },
    '/vi/orders/**': { ssr: false, isr: false, cache: false },
    '/reset/**': { ssr: false, isr: false, cache: false },
    '/vi/reset/**': { ssr: false, isr: false, cache: false },
    '/**': { isr: 300 },
    '/vi/**': { isr: 300 },
  },

  nitro: {
    prerender: {
      ignore: [
        '/search',
        '/success',
        '/vi/search',
        '/vi/success',
      ],
    },
  },

  colorMode: {
    preference: 'light',
  },

  css: ['~/app/assets/css/main.css'],

  fonts: sharedFonts,

  image: {
    dir: 'src/public',
    provider: 'none',
    // The module defu-merges density arrays with its [1, 2] default, so use
    // densities="1" on NuxtImg instances that point at a single stored asset.
    alias: {
      assetHost: awsHostBucketAlias
    }
  },
  compatibilityDate: '2024-08-21',
})
