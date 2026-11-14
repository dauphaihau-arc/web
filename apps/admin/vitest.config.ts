import { defineVitestConfig } from '@nuxt/test-utils/config'
import { coverageConfig } from '../../vitest.coverage'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    coverage: coverageConfig('./coverage/nuxt'),
    // Nuxt's client prefetch scheduler resolves `new URL(path, location.href)`;
    // the default `about:blank` base is not a valid URL base.
    environmentOptions: {
      happyDOM: { url: 'http://localhost:3000/' },
    },
    include: [
      'src/**/*.nuxt.test.{ts,tsx}',
      'test/**/*.nuxt.test.{ts,tsx}',
    ],
    setupFiles: './test/vitest.setup.ts',
    passWithNoTests: true,
  },
})
