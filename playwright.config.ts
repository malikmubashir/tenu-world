import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Tenu.World E2E tests.
 *
 * Prerequisites:
 *   - `npm run dev` must be running in a separate terminal before executing tests.
 *   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and
 *     SUPABASE_SERVICE_ROLE_KEY must be populated in .env.local for auth
 *     shortcuts to work.
 *
 * Run: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
