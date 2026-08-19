import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { NuxtPage } from '@nuxt/schema'
import pkg from './package.json'

const packagesDir = fileURLToPath(new URL('../../packages/', import.meta.url))
const uiPackageDir = `${packagesDir}ui/src`
const sharedUiDir = fileURLToPath(new URL('./src/shared/ui', import.meta.url))
const require = createRequire(import.meta.url)
const debugEntry = require.resolve('debug/src/index.js')

const assetHost = process.env.ASSET_HOST || ''
const awsHostBucketAlias = assetHost.replace(/\/+$/, '')

const iconCollections = [
  'akar-icons',
  'fluent',
  'heroicons',
  'hugeicons',
  'iconoir',
  'lets-icons',
  'lucide',
  'majesticons',
  'material-symbols',
  'mynaui',
  'nimbus',
  'ph',
  'solar',
  'streamline-flex',
  'tabler',
  'uil',
] as const

const appIconAliases = [
  'tabler:ai',
  'uil:search',
  'majesticons:user-line',
  'uil:cart',
  'akar-icons:bell',
  'heroicons:cog-8-tooth',
  'lets-icons:order',
  'heroicons:archive-box-20-solid',
  'solar:shop-bold-duotone',
  'heroicons:arrow-left-start-on-rectangle',
  'solar:star-bold',
  'solar:shop-linear',
  'ph:warning-duotone',
  'heroicons:plus',
  'lucide:circle-plus',
  'lucide:circle-x',
  'heroicons:minus',
  'lucide:edit',
  'heroicons:trash',
  'material-symbols:cancel-rounded',
  'material-symbols:check-circle-rounded',
  'material-symbols:calendar-month-rounded',
  'material-symbols:location-on-outline',
  'lucide:arrow-up',
  'lucide:arrow-down',
  'lucide:arrow-right',
  'lucide:arrow-left',
  'tabler:arrow-forward',
  'lucide:chevron-left',
  'lucide:chevron-right',
  'heroicons:chevron-up-20-solid',
  'heroicons:chevron-down-20-solid',
  'heroicons:language',
  'mynaui:store',
  'heroicons:ticket',
  'material-symbols:android-camera',
  'tabler:message',
  'lucide:plane',
  'tabler:cube',
  'streamline-flex:dashboard-3',
  'heroicons:banknotes-20-solid',
  'heroicons:chart-bar-20-solid',
  'nimbus:marketing',
  'lets-icons:refund-forward',
  'heroicons:clock-20-solid',
  'hugeicons:package-delivered',
  'lucide:map',
  'fluent:payment-28-regular',
  'heroicons:document-plus-20-solid',
  'heroicons:ellipsis-horizontal-20-solid',
  'lucide:cloud-upload',
  'lucide:frown',
  'lucide:annoyed',
  'lucide:meh',
  'lucide:smile',
  'lucide:laugh',
  'iconoir:import',
  'ph:export',
] as const

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

  icon: {
    fallbackToApi: false,
    serverBundle: {
      collections: [...iconCollections],
    },
    clientBundle: {
      icons: [...appIconAliases],
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
    storesDirs: ['./src/domains/**/*.store.ts'],
  },

  components: [
    {
      path: 'app/components',
      pathPrefix: false,
    },
    ...(existsSync(sharedUiDir)
      ? [{
          path: 'shared/ui',
          pathPrefix: false,
        }]
      : []),
    {
      path: uiPackageDir,
      pathPrefix: false,
    },
  ],

  imports: {
    dirs: ['shared/composables', 'shared/utils', `${packagesDir}utils/src`, `${packagesDir}composables/src`],
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

  nitro: {
    prerender: {
      ignore: [
        '/search',
        '/fr/search',
        '/la/search',
        '/success',
        '/fr/success',
        '/la/success',
      ],
    },
  },

  i18n: {
    locales: [{ code: 'en', language: 'en-US' }],
    defaultLocale: 'en',
    vueI18n: './i18n.config.ts',
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
