import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { APP_ICON_CLIENT_BUNDLE_ICONS, APP_ICON_COLLECTIONS } from '../../packages/ui/src/foundation/app-icon.constants'
import { removePageComponents } from '../../packages/ui/src/foundation/nuxt-pages'
import pkg from './package.json'

const packagesDir = fileURLToPath(new URL('../../packages/', import.meta.url))
const uiPackageDir = `${packagesDir}ui/src`
const appComponentsDir = fileURLToPath(new URL('./src/app/components', import.meta.url))

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
    port: 4002,
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
    '@hebilicious/vue-query-nuxt',
  ],

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
      // crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp',
      crossOriginEmbedderPolicy: false
    },
  },

  runtimeConfig: {
    public: {
      apiBaseURL: process.env.API_BASE_URL,
      apiVersion: process.env.API_VERSION,
      assetHost: process.env.ASSET_HOST,
      storefrontAppURL: process.env.STOREFRONT_APP_URL || 'http://localhost:4001',
    },
  },

  pinia: {
    storesDirs: ['./src/shared/stores/**'],
  },

  components: [
    ...(existsSync(appComponentsDir)
      ? [{
          path: 'app/components',
          pathPrefix: false,
        }]
      : []),
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

  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  },

  image: {
    provider: 'none',
    alias: {
      assetHost: awsHostBucketAlias
    }
  },

  compatibilityDate: '2024-08-21',
})

function manualChunks(id: string): string | undefined {
  if (id.includes('/node_modules/.pnpm/@vue+') || id.includes('/node_modules/.pnpm/vue@') || id.includes('/node_modules/.pnpm/vue-router@')) {
    return 'vue'
  }

  if (id.includes('/node_modules/.pnpm/@nuxt+ui@') || id.includes('/node_modules/.pnpm/@headlessui+vue@') || id.includes('/node_modules/.pnpm/@popperjs+core@') || id.includes('/node_modules/.pnpm/@tanstack+virtual-core@') || id.includes('/node_modules/.pnpm/@tanstack+vue-virtual@')) {
    return 'ui'
  }

  if (id.includes('/node_modules/.pnpm/@nuxtjs+i18n@') || id.includes('/node_modules/.pnpm/vue-i18n@') || id.includes('/node_modules/.pnpm/@intlify+')) {
    return 'i18n'
  }

  if (id.includes('/node_modules/.pnpm/@tanstack+query-core@') || id.includes('/node_modules/.pnpm/@tanstack+vue-query@') || id.includes('/node_modules/.pnpm/@hebilicious+vue-query-nuxt@')) {
    return 'query'
  }

  return undefined
}