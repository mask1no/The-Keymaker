import { test, expect } from '@playwright/test'

test.describe('Bundle flow (@bundle-e2e)', () => {
  test.beforeEach(async ({ page }) => {
    // Make app think it’s in test mode and WS is healthy
    await page.addInitScript(() => {
      ;(window as any).__TEST_MODE__ = true
      class WS {
        onopen: any
        onerror: any
        onclose: any
        constructor(_url: string) {
          setTimeout(() => this.onopen?.(new Event('open')), 10)
        }
        close() {
          this.onclose?.(new Event('close'))
        }
        send() {}
      }
      ;(window as any).WebSocket = WS as any
      localStorage.setItem(
        'keymaker.active_master',
        '8z9Z3Jm3A1aTWnY8R1ZtR8mC5E6u6hC2c7b1uZx9Xx9y',
      )
    })

    // Jito tipfloor always OK
    await page.route('**/api/jito/tipfloor', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          p25: 0.00004,
          p50: 0.00005,
          p75: 0.00006,
          ema_50th: 0.00005,
        }),
      }),
    )

    // History write OK
    await page.route('**/api/history/record', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      }),
    )

    // Submit returns bundle id
    await page.route('**/api/bundles/submit', async (route) => {
      const res = {
        bundle_id: 'BUNDL3-ABC123',
        signatures: ['sig=='],
        slot: null,
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(res),
      })
    })

    // Polling flips to landed after 3 tries
    let polls = 0
    await page.route('**/api/bundles/status/batch', async (route) => {
      polls++
      const st = polls >= 3 ? 'landed' : 'pending'
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statuses: [
            {
              bundle_id: 'BUNDL3-ABC123',
              status: st,
              landed_slot: st === 'landed' ? 123456789 : null,
            },
          ],
        }),
      })
    })
  })

  test('preview → execute → landed', async ({ page }) => {
    await page.goto('/bundle')

    // Preview OK
    const preview = page.getByRole('button', { name: /preview/i })
    await preview.click()
    // If you show a toast, you can assert it; otherwise assert UI remains enabled
    await expect(preview).toBeEnabled()

    // Execute
    await page.getByRole('button', { name: /execute/i }).click()

    // Bundle ID appears
    await expect(page.getByText(/bundle id:/i)).toBeVisible()

    // Status eventually “landed”
    await expect(page.getByText(/landed/i)).toBeVisible({ timeout: 10000 })
  })
})
