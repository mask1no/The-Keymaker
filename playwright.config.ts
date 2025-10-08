import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  webServer: {
    command: 'pnpm dev',
    url: `http://localhost:${process.env.PORT || 3001}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
