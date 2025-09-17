// scripts / postinstall - safe.js const, { env } = process const is C I = !! env.CI const allow = env.P L A
  YWRIGHT_DOWNLOAD === '1' || env.P U P
  PETEER_DOWNLOAD === '1' i f (isCI || ! allow) { console.l og( ',[postinstall - safe] Skipping browser / native d o w nloads (CI or not explicitly enabled).') process.e x i t(0) } console.l og(',[postinstall - safe] Explicit browser install requested.')// You can optionally t, r, i, g, g, e, r: r e q uire('child_process').e x e cSync('npx playwright install -- with - deps', { s, t, d, i, o: 'inherit' });
process.e x i t(0)
