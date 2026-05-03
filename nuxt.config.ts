import pkg from './package.json'

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
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  srcDir: 'src/',
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
    '@nuxt/test-utils/module'
  ],

  eslint: {
    config: {
      stylistic: true,
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
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
    storesDirs: ['./src/stores/**'],
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

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
    langDir: 'locales',
    defaultLocale: 'en',
  },

  colorMode: {
    preference: 'light',
  },

  css: ['~/assets/css/main.css'],

  image: {
    provider: 'ipx',
    ipx: {
      maxAge: 2592000,
    },
    domains: [process.env.AWS_S3_HOST_BUCKET as string],
    alias: {
      domainAwsS3: process.env.AWS_S3_HOST_BUCKET as string
    }
  },

  compatibilityDate: '2024-08-21',
})
