import { defineConfig, devices } from '@playwright/test'

/**
 * Real-API category-redirect journey.
 *
 * Unlike `playwright.config.ts` (whose SSR mode stubs the backend with the
 * deterministic fixture in `e2e/support/`), this config runs the built storefront
 * server against a **real** API over HTTP backed by a fresh, migrated PostgreSQL
 * database seeded with persisted categories and legacy-path aliases (see
 * `apps/api/api/test/support/category-redirect-e2e-api.ts`). The API origin and
 * fixture paths are provided by that harness through the environment.
 *
 * Run with:
 *   pnpm e2e:ssr:build
 *   CATEGORY_E2E_API_ORIGIN=http://127.0.0.1:4020 \
 *   CATEGORY_E2E_FIXTURES_JSON='[...]' \
 *   npx playwright test --config ./playwright.category-redirect.config.ts
 */
const apiOrigin = process.env.CATEGORY_E2E_API_ORIGIN

if (!apiOrigin) {
  throw new Error(
    'CATEGORY_E2E_API_ORIGIN is required: start the real API harness (apps/api/api/test/support/category-redirect-e2e-api.ts) first and pass its reported origin.',
  )
}

const port = Number(process.env.CATEGORY_E2E_WEB_PORT ?? 4120)

export default defineConfig({
  testDir: './e2e-real-api',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  outputDir: './test-results-real-api',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    testIdAttribute: 'data-testid',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node .output/server/index.mjs',
    url: `http://127.0.0.1:${port}/health/ready`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      HOST: '127.0.0.1',
      PORT: String(port),
      // `runtimeConfig.public.apiBaseURL` is baked at build time; Nuxt overrides
      // a public runtime config value only through its `NUXT_PUBLIC_*` env var,
      // so this is what actually points the running server at the harness API.
      API_BASE_URL: apiOrigin,
      NUXT_PUBLIC_API_BASE_URL: apiOrigin,
      API_VERSION: '1',
      ASSET_HOST: '',
      // The real API advertises the public-identity generation.
      NUXT_PUBLIC_CATEGORY_IDENTITY_CONTRACT_VERSION: '2',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
