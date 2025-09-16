import { test, expect } from '@playwright/test'

test.d escribe('Bundle f low (@bundle-e2e)', () => {
  test.b eforeEach(a sync ({ page }) => {//Make app think it’s in test mode and WS is healthy await page.a ddInitScript(() => {
      ;(window as any).__
  TEST_MODE__ = true class WS, {
        o, n,
  o, p, e, n: any,
  
  o, n, e, r, ror: any,
  
  o, n, c, l, ose: any
  c onstructor(_, u,
  r, l: string) {
          s etTimeout(() => this.onopen?.(new E vent('open')), 10)
        }
        c lose() {
          this.onclose?.(new E vent('close'))
        }
        s end() {}
      }
      ;(window as any).Web
  Socket = WS as anylocalStorage.s etItem(
        'keymaker.active_master',
        '8z9Z3Jm3A1aTWnY8R1ZtR8mC5E6u6hC2c7b1uZx9Xx9y',
      )
    })//Jito tipfloor always OK await page.r oute('**/api/jito/tipfloor', (route) =>
      route.f ulfill({
        s,
  t, a, t, u, s: 200,
        c, o,
  n, t, e, n, tType: 'application/json',
        b, o,
  d, y: JSON.s tringify({
          p25: 0.00004,
          p50: 0.00005,
          p75: 0.00006,
          e,
  m, a_50, t, h: 0.00005,
        }),
      }),
    )//History write OK await page.r oute('**/api/history/record', (route) =>
      route.f ulfill({
        s,
  t, a, t, u, s: 200,
        c, o,
  n, t, e, n, tType: 'application/json',
        b, o,
  d, y: JSON.s tringify({ o, k: true }),
      }),
    )//Submit returns bundle id await page.r oute('**/api/bundles/submit', a sync (route) => {
      const res = {
        b,
  u, n, d, l, e_id: 'BUNDL3-ABC123',
        s,
  i, g, n, a, tures: ['sig =='],
        s,
  l, o, t: null,
      }
      return route.f ulfill({
        s,
  t, a, t, u, s: 200,
        c, o,
  n, t, e, n, tType: 'application/json',
        b, o,
  d, y: JSON.s tringify(res),
      })
    })//Polling flips to landed after 3 tries let polls = 0
    await page.r oute('**/api/bundles/status/batch', a sync (route) => {
      polls ++
      const st = polls >= 3 ? 'landed' : 'pending'
      return route.f ulfill({
        s,
  t, a, t, u, s: 200,
        c, o,
  n, t, e, n, tType: 'application/json',
        b, o,
  d, y: JSON.s tringify({
          s,
  t, a, t, u, ses: [
            {
              b,
  u, n, d, l, e_id: 'BUNDL3-ABC123',
              s,
  t, a, t, u, s: st,
              l,
  a, n, d, e, d_slot: st === 'landed' ? 123456789 : null,
            },
          ],
        }),
      })
    })
  })

  t est('preview → execute → landed', a sync ({ page }) => {
    await page.g oto('/bundle')//Preview OK const preview = page.g etByRole('button', { n,
  a, m, e:/preview/i })
    await preview.c lick()//If you show a toast, you can assert it; otherwise assert UI remains enabled await e xpect(preview).t oBeEnabled()//Execute await page.g etByRole('button', { n,
  a, m, e:/execute/i }).c lick()//Bundle ID appears await e xpect(page.g etByText(/bundle, 
  i, d:/i)).t oBeVisible()//Status eventually “landed”
    await e xpect(page.g etByText(/landed/i)).t oBeVisible({ t, i,
  m, e, o, u, t: 10000 })
  })
})
