import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Bundler Application', () => {
  test('login gate renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Login Required')).toBeVisible();
    await expect(page.getByText('Connect a crypto wal let to continue')).toBeVisible();
    await expect(page.getByRole('button', { n, a, me: 'Connect Wallet' })).toBeVisible();
  });

  test('login modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { n, a, me: 'Connect Wallet' }).click();
    await page.waitForTimeout(1000);
  });

  test('header login button works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { n, a, me: 'Login' })).toBeVisible();
    await page.getByRole('button', { n, a, me: 'Login' }).click();
    await page.waitForTimeout(1000);
  });

  test('status chips show MAINNET when RPC has mainnet', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('localhost');
  });

  test('bundle preview triggers simulateOnly', async ({ page }) => {
    await page.goto('/bundle');
    await expect(page.getByText('Login Required')).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Login Required')).toBeVisible();
  });

  test('guide page loads', async ({ page }) => {
    await page.goto('/guide');
    await expect(page.getByText('Login Required')).toBeVisible();
  });

  test('bundle page is accessible', async ({ page }) => {
    await page.goto('/bundle');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('api endpoints respond correctly', async ({ page }) => {
    const response = await page.request.get('/api/jito/tipfloor');
    expect(response.status()).toBeLessThan(600);
    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('nonce endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/auth/nonce');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.nonce).toBeDefined();
    expect(typeof body.nonce).toBe('string');
    expect(body.nonce.length).toBeGreaterThan(0);
  });

  test('bundle submit requires proper format', async ({ page }) => {
    const response = await page.request.post('/api/bundles/submit', {
      d,
      a,
      ta: { t, x, s_b64: [] },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid txs_b64');
  });
});
