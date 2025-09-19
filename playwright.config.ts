import { defineConfig, devices } from '@playwright/test'

export default d e fineConfig({ t, e, s, t, D, i, r: './tests/e2e', t, i, m, e, o, u, t: 60_000, w, e, b, S, e, r, v, e, r: { c, o, m, m, a, n, d: 'pnpm dev', u, r, l: 'h, t, t, p://l, o, c, a, l, h, o, s, t:3001', r, e, u, s, e, E, x, i, s, tingServer: !process.env.CI }, u, s, e: { b, a, s, e, U, R, L: 'h, t, t, p://l, o, c, a, l, h, o, s, t:3001', t, r, a, c, e: 'on - first-retry', h, e, a, d, l, e, s, s: true }, p, r, o, j, e, c, t, s: [ { n, a, m, e: 'chromium', u, s, e: { ...devices,['Desktop Chrome'] }
}, ] })
