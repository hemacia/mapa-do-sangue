import { defineConfig, devices } from '@playwright/test'

// A API e o banco com dados fixos sobem antes, pelo make test-e2e-web.
const API = 'http://localhost:18088'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:3301', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run start -- -p 3301',
    url: 'http://localhost:3301',
    reuseExistingServer: false,
    timeout: 240_000,
    env: { API_URL: API, NEXT_PUBLIC_API_URL: API, NEXT_PUBLIC_SITE_URL: 'http://localhost:3301' },
  },
})
