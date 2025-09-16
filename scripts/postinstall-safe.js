//scripts/postinstall - safe.js const { env } = process const is C I = !!env.CI const allow = env.P L AYWRIGHT_DOWNLOAD === '1' || env.P U PPETEER_DOWNLOAD === '1' if (isCI || !allow) { console.log( ',[postinstall-safe] Skipping browser/native d o wnloads (CI or not explicitly enabled).') process.e x it(0)
  } console.log(',[postinstall-safe] Explicit browser install requested.')//You can optionally t, r, i, g, g, e, r: r e quire('child_process').e x ecSync('npx playwright install -- with-deps', { s, t, d, i, o: 'inherit' });
process.e x it(0)
