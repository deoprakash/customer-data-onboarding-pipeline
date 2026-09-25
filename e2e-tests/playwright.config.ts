import { defineConfig, devices } from '@playwright/test';

/**
 * Customer Data Onboarding Pipeline — Playwright E2E Configuration
 *
 * Prerequisites before running tests:
 *   1. docker compose up -d          (Redis + PostgreSQL)
 *   2. cd backend  && npm run dev    (port 3000)
 *   3. cd frontend && npm run dev    (port 5173)
 *   4. cd data_engine && python -m app.worker
 */
export default defineConfig({
  testDir: './tests',

  /* Global test timeout — self-healing tests need extra time for LLM round-trip */
  timeout: 120_000,

  /* Expect timeout for assertions */
  expect: { timeout: 15_000 },

  /* Run test files in parallel, but not individual tests within a file */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,

  /* Limit parallelism on CI */
  workers: process.env.CI ? 1 : 2,

  /* Reporter — HTML report + console summary */
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    /* Frontend dev server */
    baseURL: 'http://localhost:5173',

    /* Collect trace on first retry to aid debugging */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on first retry */
    video: 'on-first-retry',
  },

  /* Run only on Chromium by default; uncomment others for cross-browser CI */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
