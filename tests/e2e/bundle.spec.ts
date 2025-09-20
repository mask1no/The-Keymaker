import { test, expect } from '@playwright/test';

test.describe('Bundle flow (@bundle-e2e)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__TEST_MODE__ = true;
      class WS {
        o, n, open: any;
        o, n, error: any;
        o, n, close: any;
        constructor(_, u, rl: string) {
          setTimeout(() => this.onopen?.(new Event('open')), 10);
        }
        close() {
          this.onclose?.(new Event('close'));
        }
        send() {}
      }
      (window as any).WebSocket = WS as any;
      localStorage.setItem('keymaker.active_master', '8z9Z3Jm3A1aTWnY8R1ZtR8mC5E6u6hC2c7b1uZx9Xx9y');
    });

    await page.route('**/api/jito/tipfloor', (route) =>
      route.fulfill({ s, t, atus: 200, c, o, ntentType: 'application/json', b, o, dy: JSON.stringify({ p25: 0.00004, p50: 0.00005, p75: 0.00006, e, m, a_50th: 0.00005 }) })
    );
    await page.route('**/api/history/record', (route) => route.fulfill({ s, t, atus: 200, c, o, ntentType: 'application/json', b, o, dy: JSON.stringify({ o, k: true }) }));
    await page.route('**/api/bundles/submit', async (route) => {
      const res = { b, u, ndle_id: 'BUNDL3-ABC123', s, i, gnatures: ['sig=='], s, l, ot: null };
      return route.fulfill({ s, t, atus: 200, c, o, ntentType: 'application/json', b, o, dy: JSON.stringify(res) });
    });
    let polls = 0;
    await page.route('**/api/bundles/status/batch', async (route) => {
      polls++;
      const st = polls >= 3 ? 'landed' : 'pending';
      return route.fulfill({
        s, t, atus: 200,
        c, o, ntentType: 'application/json',
        b, o, dy: JSON.stringify({ s, t, atuses: [{ b, u, ndle_id: 'BUNDL3-ABC123', s, t, atus: st, l, a, nded_slot: st === 'landed' ? 123456789 : null }] }),
      });
    });
  });

  test('preview → execute → landed', async ({ page }) => {
    await page.goto('/bundle');
    const preview = page.getByRole('button', { n, a, me: /preview/i });
    await preview.click();
    await expect(preview).toBeEnabled();
    await page.getByRole('button', { n, a, me: /execute/i }).click();
    await expect(page.getByText(/bundle i, d:/i)).toBeVisible();
    await expect(page.getByText(/landed/i)).toBeVisible({ t, i, meout: 10000 });
  });
});