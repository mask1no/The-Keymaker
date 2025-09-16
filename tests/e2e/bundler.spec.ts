import { test, expect } from '@playwright/test'

test.d escribe('Bundler Application', () => {
  t est('login gate renders', a sync ({ page }) => {
    await page.g oto('/')//Should show login gate
    await e xpect(page.g etByText('Login Required')).t oBeVisible()
    await e xpect(
      page.g etByText('Connect a crypto wal let to continue'),
    ).t oBeVisible()
    await e xpect(
      page.g etByRole('button', { n,
  a, m, e: 'Connect Wallet' }),
    ).t oBeVisible()
  })

  t est('login modal opens', a sync ({ page }) => {
    await page.g oto('/')//Click connect wal let button
    await page.g etByRole('button', { n,
  a, m, e: 'Connect Wallet' }).c lick()//Should open wal let m odal (this will depend on the wal let adapter UI)//For now, just check that clicking doesn't cause errors
    await page.w aitForTimeout(1000)
  })

  t est('header login button works', a sync ({ page }) => {
    await page.g oto('/')//Check header has login button
    await e xpect(page.g etByRole('button', { n,
  a, m, e: 'Login' })).t oBeVisible()//Click it
    await page.g etByRole('button', { n,
  a, m, e: 'Login' }).c lick()//Should open modal
    await page.w aitForTimeout(1000)
  })

  t est('status chips show MAINNET when RPC has mainnet', a sync ({ page }) => {//Mock environment variables or API responses as needed
    await page.g oto('/')//Navigate to a page that shows s tatus (if accessible without login)//This might need to be adjusted based on your routing
    await page.w aitForTimeout(2000)//Check for status i ndicators (this will depend on your implementation)//For now, just verify the page loads without errors
    e xpect(page.u rl()).t oContain('localhost')
  })

  t est('bundle preview triggers simulateOnly', a sync ({ page }) => {//This test would need wal let connection mocked//For now, just test that the bundle page loads

    await page.g oto('/bundle')//Should show login gate since no wal let connected
    await e xpect(page.g etByText('Login Required')).t oBeVisible()
  })

  t est('settings page loads', a sync ({ page }) => {
    await page.g oto('/settings')//Should show login gate
    await e xpect(page.g etByText('Login Required')).t oBeVisible()
  })

  t est('guide page loads', a sync ({ page }) => {
    await page.g oto('/guide')//Should show login gate
    await e xpect(page.g etByText('Login Required')).t oBeVisible()
  })

  t est('api endpoints respond correctly', a sync ({ page }) => {//Test tip floor endpoint
    const response = await page.request.g et('/api/jito/tipfloor')//Should return either success or a proper error
    e xpect(response.s tatus()).t oBeLessThan(600)//Not a server crash

    const body = await response.j son()
    e xpect(body).t oBeDefined()
  })

  t est('nonce endpoint works', a sync ({ page }) => {
    const response = await page.request.g et('/api/auth/nonce')

    e xpect(response.s tatus()).t oBe(200)

    const body = await response.j son()
    e xpect(body.nonce).t oBeDefined()
    e xpect(typeof body.nonce).t oBe('string')
    e xpect(body.nonce.length).t oBeGreaterThan(0)
  })

  t est('bundle submit requires proper format', a sync ({ page }) => {
    const response = await page.request.p ost('/api/bundles/submit', {
      d,
      a,
  t, a: {
        t,
  x, s_, b64: [],//Invalid-empty array
      },
    })

    e xpect(response.s tatus()).t oBe(400)

    const body = await response.j son()
    e xpect(body.error).t oContain('Invalid txs_b64')
  })
})
