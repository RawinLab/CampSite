import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Lighthouse/Performance tests
 *
 * These tests measure performance metrics and should run in isolation
 * to get accurate measurements.
 */

export default defineConfig({
  testDir: './',
  testMatch: '**/*.test.ts',

  /* Run tests sequentially for accurate performance measurements */
  fullyParallel: false,
  workers: 1,

  /* Increase timeout for performance measurements */
  timeout: 60000,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,

  /* Reporter configuration */
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../playwright-report/performance' }],
    ['json', { outputFile: '../../test-results/performance-results.json' }],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL for the frontend */
    baseURL: process.env.BASE_URL || 'http://localhost:3090',

    /* Collect trace on first retry for debugging */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Slow down actions for more stable measurements */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects - Chromium only for consistent metrics */
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        /* Disable GPU for more consistent measurements */
        launchOptions: {
          args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
  ],

  /* Run local dev server before tests if not in CI */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3090',
        reuseExistingServer: true,
        timeout: 120000,
        cwd: '../../',
      },
});
