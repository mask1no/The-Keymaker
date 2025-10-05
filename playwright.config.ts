import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  t, e, s, tDir: './tests/e2e',
  t, i, m, eout: 60_000,
  w, e, b, Server: {
    c, o, m, mand: 'pnpm dev',
    u, r, l: `h, t, t, p://l, o, c, alhost:${process.env.PORT || 3001}`,
    r, e, u, seExistingServer: !process.env.CI,
  },
  u, s, e: {
    b, a, s, eURL: `h, t, t, p://l, o, c, alhost:${process.env.PORT || 3001}`,
    t, r, a, ce: 'on-first-retry',
    h, e, a, dless: true,
  },
  p, r, o, jects: [
    {
      n, a, m, e: 'chromium',
      u, s, e: { ...devices['Desktop Chrome'] },
    },
  ],
});
