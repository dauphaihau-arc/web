import pkg from './package.json'

const awsHostBucket = process.env.AWS_S3_HOST_BUCKET || ''
const awsHostBucketDomain = awsHostBucket
  ? new URL(awsHostBucket).hostname
  : ''
const awsHostBucketAlias = awsHostBucket.replace(/\/+$/, '')

export default defineNuxtConfig({
  experimental: {
    viteEnvironmentApi: true,
  },

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
  ssr: false,
  devtools: { enabled: true },

  alias: {
    '~/app': './src/app',
    '~/modules': './src/modules',
    '~/shared': './src/shared',
    '~/assets': './src/app/assets',
    '~/components': './src/modules',
    '~/composables': './src/shared/composables',
    '~/config': './src/shared/config',
    '~/schemas': './src/shared/schemas',
    '~/services': './src/shared/services',
    '~/stores': './src/shared/stores',
    '~/types': './src/shared/types',
    '~/utils': './src/shared/utils',
  },

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
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'require-corp',
    },
  },

  runtimeConfig: {
    ipDataKey: process.env.IP_DATA_KEY,
    public: {
      apiBaseURL: process.env.API_BASE_URL,
      apiVersion: process.env.API_VERSION,
      awsHostBucket: process.env.AWS_S3_HOST_BUCKET,
      accessTokenExpirationMins: process.env.ACCESS_TOKEN_EXPIRATION_MINS,
      refreshTokenExpirationDays: process.env.REFRESH_TOKEN_EXPIRATION_DAYS,
    },
  },

  pinia: {
    storesDirs: ['./src/shared/stores/**'],
  },

  components: [
    {
      path: 'shared/components',
      pathPrefix: false,
    },
    {
      path: 'modules/common',
      pathPrefix: false,
    },
    {
      path: 'modules/dialogs',
      pathPrefix: false,
    },
    {
      path: 'modules/layouts',
      pathPrefix: false,
    },
    {
      path: 'modules/pages',
      pathPrefix: false,
    },
  ],

  imports: {
    dirs: ['shared/composables', 'shared/utils'],
  },

  i18n: {
    locales: [
      {
        code: 'en',
        file: 'en-US.js',
      },
      {
        code: 'fr',
        file: 'fr-FR.js',
      },
      {
        code: 'la',
        file: 'la-LA.js',
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
    provider: 'ipx',
    ipx: {
      maxAge: 2592000,
    },
    domains: awsHostBucketDomain ? [awsHostBucketDomain] : [],
    alias: {
      domainAwsS3: awsHostBucketAlias
    }
  },

  compatibilityDate: '2024-08-21',
})
