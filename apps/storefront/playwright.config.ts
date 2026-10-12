import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? 4110)
const baseURL = `http://127.0.0.1:${port}`
const videoMode = process.env.PLAYWRIGHT_VIDEO_MODE ?? 'retain-on-failure'
const e2eSuite = process.env.E2E_SUITE ?? 'regression'

// Explicit SSR mode: build `.output` with `pnpm e2e:ssr:build`, then Playwright
// launches the real Node server (`.output/server/index.mjs`) plus a
// deterministic backend fixture. The default mode stays the static
// `generate` + `serve` flow. Static output cannot prove SSR/HTTP semantics.
const ssrMode = process.env.E2E_MODE === 'ssr'
const fixturePort = Number(process.env.E2E_FIXTURE_PORT ?? 4310)
const fixtureBaseURL = `http://127.0.0.1:${fixturePort}`

const staticWebServer = {
  command: `pnpm e2e:serve && npx serve .output/public --listen tcp://127.0.0.1:${port}`,
  url: baseURL,
  timeout: 240_000,
  reuseExistingServer: !process.env.CI,
}

const ssrWebServers: NonNullable<PlaywrightTestConfig['webServer']> = [
  {
    command: 'node ./e2e/support/ssr-fixture-server.mjs',
    url: `${fixtureBaseURL}/health/ready`,
    timeout: 60_000,
    reuseExistingServer: false,
    env: { E2E_FIXTURE_PORT: String(fixturePort) },
  },
  {
    command: 'node .output/server/index.mjs',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      HOST: '127.0.0.1',
      PORT: String(port),
      API_BASE_URL: fixtureBaseURL,
      API_VERSION: '1',
      ASSET_HOST: '',
      NUXT_PUBLIC_CATEGORY_IDENTITY_CONTRACT_VERSION: '2',
    },
  },
]

export default defineConfig({
  testDir: './e2e',
  // The SSR fixture server keeps one shared request log, so SSR specs run
  // single-worker to keep request-count assertions deterministic.
  fullyParallel: !ssrMode,
  workers: ssrMode ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  grep: e2eSuite === 'smoke' ? /@smoke/ : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  outputDir: './test-results',
  use: {
    baseURL,
    testIdAttribute: 'data-testid',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: videoMode as 'off' | 'on' | 'retain-on-failure' | 'on-first-retry',
  },
  webServer: ssrMode ? ssrWebServers : staticWebServer,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
