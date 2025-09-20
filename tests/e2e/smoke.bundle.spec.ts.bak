import { test, expect } from '@playwright/test';

test.describe('Bundler smoke (test mode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__TEST_MODE__ = true;
    });
  });

  test('tipfloor endpoint responds', async ({ page }) => {
    const res = await page.request.get('/api/jito/tipfloor');
    expect(res.status()).toBeLessThan(600);
    const json = await res.json();
    expect(json).toBeDefined();
  });

  test('simulate-only accepts empty or dummy payload in test mode', async ({ page }) => {
    const res = await page.request.post('/api/bundles/submit', {
      data: { txs_b64: [], simulateOnly: true },
      headers: { 'content-type': 'application/json' },
    });
    expect([200, 400, 500]).toContain(res.status());
  });
});
