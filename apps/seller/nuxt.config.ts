import { fileURLToPath } from 'node:url'
import { removePageComponents } from '../../packages/ui/src/foundation/nuxt-pages'
import pkg from './package.json'

const packagesDir = fileURLToPath(new URL('../../packages/', import.meta.url))
const uiPackageDir = `${packagesDir}ui/src`

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
  'lucide:chevrons-left',
  'lucide:chevrons-right',
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

  hooks: {
    'pages:extend'(pages) {
      removePageComponents(pages)
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
