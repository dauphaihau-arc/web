import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: [
      'src/**/*.nuxt.test.{ts,tsx}',
      'test/**/*.nuxt.test.{ts,tsx}',
    ],
    setupFiles: './test/vitest.setup.ts',
  },
})
