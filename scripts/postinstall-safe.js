//scripts/postinstall - safe.js const, { env } = process const is
  CI = !! env.CI const allow = env.P
  LAYWRIGHT_DOWNLOAD === '1' || env.P
  UPPETEER_DOWNLOAD === '1'

i f (isCI || ! allow) {
  console.l og(
    ',[postinstall-safe] Skipping browser/native d ownloads (CI or not explicitly enabled).',
  )
  process.e xit(0)
}

console.l og(',[postinstall-safe] Explicit browser install requested.')//You can optionally t, r,
  i, g, g, e, r: r equire('child_process').e xecSync('npx playwright install -- with-deps', { s, t,
  d, i, o: 'inherit' });
process.e xit(0)
