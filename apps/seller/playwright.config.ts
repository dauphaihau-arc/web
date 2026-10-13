import { defineConfig, devices } from '@playwright/test'
import { loadSellerE2eEnvironment } from './e2e/support/environment'

// Validate the externally provisioned API origin and fixtures synchronously,
// at config load, so a missing or malformed value fails before Playwright boots
// any frontend server. The API itself is provisioned and owned elsewhere (the
// API checkout's `e2e:seller` launcher or CI); the web checkout never launches
// it or reads a shared readiness file.
const { apiOrigin, compatibleGeneration } = loadSellerE2eEnvironment()

const sellerPort = Number(process.env.SELLER_E2E_PORT ?? 4399)

// A second, isolated seller runtime speaks the expected API generation.
// The first runtime simulates a prepared client's stale generation, so
// mismatch coverage does not depend on changing the production API contract.
const compatibleSellerPort = Number(process.env.SELLER_E2E_COMPATIBLE_PORT ?? 4400)

const sellerServerEnv = {
  API_ORIGIN: apiOrigin,
  API_BASE_URL: apiOrigin,
  API_VERSION: '1',
}

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  outputDir: './test-results',
  globalSetup: './e2e/support/global-setup.ts',
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      // Simulated stale-client generation `1` must be rejected by the public-ID
      // API. Never reuse a server pointed at a different API.
      command: `nuxt dev --port ${sellerPort}`,
      cwd: '.',
      env: {
        ...sellerServerEnv,
        NUXT_PUBLIC_CATEGORY_IDENTITY_CONTRACT_VERSION: '1',
      },
      url: `http://127.0.0.1:${sellerPort}/`,
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      // Isolated compatible seller bundle: pinned to the API's generation so
      // category-bearing requests proceed. Mirrors a deployed upgraded bundle.
      command: `nuxt dev --port ${compatibleSellerPort}`,
      cwd: '.',
      env: {
        ...sellerServerEnv,
        NUXT_PUBLIC_CATEGORY_IDENTITY_CONTRACT_VERSION: compatibleGeneration,
      },
      url: `http://127.0.0.1:${compatibleSellerPort}/`,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
  projects: [
    {
      // Default (mismatched) bundle: the browser must not send a generation
      // header the app did not set, so the guard blocks and no category-bearing
      // request leaves the browser.
      name: 'mismatch',
      testMatch: 'category-identity-blocking.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${sellerPort}`,
      },
    },
    {
      // Compatible bundle: the real app must supply its own generation header
      // on every observed category-bearing request.
      name: 'compatible',
      testMatch: 'category-assignment.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${compatibleSellerPort}`,
      },
    },
  ],
})
