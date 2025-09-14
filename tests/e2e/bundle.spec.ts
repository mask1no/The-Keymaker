import { test, expect } from '@playwright/test';

test.describe('Bundle Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bundle');
    await page.waitForURL('**/bundle');
    await expect(page.getByRole('heading', { name: 'Bundle Builder' })).toBeVisible();
  });

  test('should display the "Add Transaction" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Transaction/i })).toBeVisible();
  });

  test('should allow a user to add a transaction to the bundle', async ({ page }) => {
    await expect(page.locator('[data-testid^="transaction-card-"]')).toHaveCount(1);
    await page.getByRole('button', { name: /Add Transaction/i }).click();
    await expect(page.locator('[data-testid^="transaction-card-"]')).toHaveCount(2, { timeout: 5000 });
  });

  test('should allow configuring a transaction', async ({ page }) => {
    const card = page.locator('[data-testid^="transaction-card-"]').first();
    await card.locator('input[placeholder="Amount"]').fill('0.01');
    await card.locator('input[placeholder="Slippage (%)"]').fill('1');
    await expect(card.locator('input[placeholder="Amount"]')).toHaveValue('0.01');
    await expect(card.locator('input[placeholder="Slippage (%)"]')).toHaveValue('1');
  });

  test('should allow adding multiple transactions', async ({ page }) => {
    await page.getByRole('button', { name: /Add Transaction/i }).click();
    await page.getByRole('button', { name: /Add Transaction/i }).click();
    await expect(page.locator('[data-testid^="transaction-card-"]')).toHaveCount(3, { timeout: 5000 });
  });

  test('should allow removing a transaction', async ({ page }) => {
    await expect(page.locator('[data-testid^="transaction-card-"]')).toHaveCount(1);
    await page.getByTestId('remove-transaction-button').first().click();
    await expect(page.locator('[data-testid^="transaction-card-"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('should show an error for invalid input', async ({ page }) => {
    const card = page.locator('[data-testid^="transaction-card-"]').first();
    await card.locator('input[placeholder="Amount"]').fill('-1');
    await card.locator('input[placeholder="Slippage (%)"]').click(); 
    await expect(page.getByText(/Invalid swap parameters/i)).toBeVisible();
  });

  test('should execute a bundle', async ({ page }) => {
    const card = page.locator('[data-testid^="transaction-card-"]').first();
    await card.locator('input[placeholder="Amount"]').fill('0.01');
    
    await page.route('/api/bundles/submit', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ bundle_id: 'mock_bundle_id' }),
      });
    });

    await page.getByTestId('execute-bundle-button').click();
    
    await expect(page.getByText(/Bundle executed successfully/i)).toBeVisible({ timeout: 15000 });
  });
});
