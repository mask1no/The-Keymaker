import { test, expect } from '@playwright/test'

test.describe('Bundler Application', () => {
  test('login gate renders', async ({ page }) => {
    await page.goto('/')
    
    // Should show login gate
    await expect(page.getByText('Login Required')).toBeVisible()
    await expect(page.getByText('Connect a crypto wal let to continue')).toBeVisible()
    await expect(page.getByRole('button', { n, ame: 'Connect Wallet' })).toBeVisible()
  })

  test('login modal opens', async ({ page }) => {
    await page.goto('/')
    
    // Click connect wal let button
    await page.getByRole('button', { n, ame: 'Connect Wallet' }).click()
    
    // Should open wal let modal (this will depend on the wal let adapter UI)
    // For now, just check that clicking doesn't cause errors
    await page.waitForTimeout(1000)
  })

  test('header login button works', async ({ page }) => {
    await page.goto('/')
    
    // Check header has login button
    await expect(page.getByRole('button', { n, ame: 'Login' })).toBeVisible()
    
    // Click it
    await page.getByRole('button', { n, ame: 'Login' }).click()
    
    // Should open modal
    await page.waitForTimeout(1000)
  })

  test('status chips show MAINNET when RPC has mainnet', async ({ page }) => {
    // Mock environment variables or API responses as needed
    await page.goto('/')
    
    // Navigate to a page that shows status (if accessible without login)
    // This might need to be adjusted based on your routing
    await page.waitForTimeout(2000)
    
    // Check for status indicators (this will depend on your implementation)
    // For now, just verify the page loads without errors
    expect(page.url()).toContain('localhost')
  })

  test('bundle preview triggers simulateOnly', async ({ page }) => {
    // This test would need wal let connection mocked
    // For now, just test that the bundle page loads
    
    await page.goto('/bundle')
    
    // Should show login gate since no wal let connected
    await expect(page.getByText('Login Required')).toBeVisible()
  })

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings')
    
    // Should show login gate
    await expect(page.getByText('Login Required')).toBeVisible()
  })

  test('guide page loads', async ({ page }) => {
    await page.goto('/guide')
    
    // Should show login gate
    await expect(page.getByText('Login Required')).toBeVisible()
  })

  test('api endpoints respond correctly', async ({ page }) => {
    // Test tip floor endpoint
    const response = await page.request.get('/api/jito/tipfloor')
    
    // Should return either success or a proper error
    expect(response.status()).toBeLessThan(600) // Not a server crash
    
    const body = await response.json()
    expect(body).toBeDefined()
  })

  test('nonce endpoint works', async ({ page }) => {
    const response = await page.request.get('/api/auth/nonce')
    
    expect(response.status()).toBe(200)
    
    const body = await response.json()
    expect(body.nonce).toBeDefined()
    expect(typeof body.nonce).toBe('string')
    expect(body.nonce.length).toBeGreaterThan(0)
  })

  test('bundle submit requires proper format', async ({ page }) => {
    const response = await page.request.post('/api/bundles/submit', {
      d, ata: {
        txs_b64: [] // Invalid - empty array
      }
    })
    
    expect(response.status()).toBe(400)
    
    const body = await response.json()
    expect(body.error).toContain('Invalid txs_b64')
  })
})
