import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: [
      'src/app/**/*.test.{ts,tsx}',
      'src/**/*.nuxt.test.{ts,tsx}',
    ],
    setupFiles: './test/vitest.setup.ts',
  },
})
