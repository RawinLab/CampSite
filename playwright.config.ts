import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend .env file
dotenv.config({ path: path.resolve(__dirname, './apps/campsite-backend/.env') });

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/api/**'], // Exclude Jest-based API tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3090',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.SKIP_WEBSERVER ? undefined : [
    {
      command: 'pnpm dev:frontend',
      url: 'http://localhost:3090',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'pnpm dev:backend',
      url: 'http://localhost:3091/api/health',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
