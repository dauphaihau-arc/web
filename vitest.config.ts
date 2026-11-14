import { defineConfig } from 'vitest/config'

/**
 * Workspace packages share one Vitest project: they are plain TypeScript with
 * no Nuxt runtime, so node is enough and the app configs stay untouched.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/*/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/packages',
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'packages/*/src/**/*.{test,spec}.{ts,tsx}',
        'packages/schemas/src/api/generated/**',
      ],
    },
  },
})
