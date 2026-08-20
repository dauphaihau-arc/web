import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const srcDir = fileURLToPath(new URL('./src/', import.meta.url))
const packagesDir = fileURLToPath(new URL('../../packages/', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': srcDir,
      '@': srcDir,
      '@arc/ui': `${packagesDir}ui/src`,
      '@arc/contracts': `${packagesDir}contracts/src`,
      '@arc/models': `${packagesDir}models/src`,
      '@arc/enums': `${packagesDir}enums/src`,
      '@arc/schemas': `${packagesDir}schemas/src`,
      '@arc/utils': `${packagesDir}utils/src`,
      '@arc/lib': `${packagesDir}lib/src`,
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.{ts,tsx}',
      'test/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'src/**/*.nuxt.test.{ts,tsx}',
      'test/**/*.nuxt.test.{ts,tsx}',
    ],
  },
})
