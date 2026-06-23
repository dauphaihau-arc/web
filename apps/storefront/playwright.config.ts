import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? 4110)
const baseURL = `http://127.0.0.1:${port}`
const videoMode = process.env.PLAYWRIGHT_VIDEO_MODE ?? 'retain-on-failure'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  outputDir: './test-results',
  use: {
    baseURL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: videoMode as 'off' | 'on' | 'retain-on-failure' | 'on-first-retry',
  },
  webServer: {
    command: `pnpm e2e:serve && npx serve .output/public --listen tcp://127.0.0.1:${port}`,
    url: baseURL,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
