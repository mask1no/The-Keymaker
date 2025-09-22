/* eslint-disable no-console */
// Safe postinstall: avoid heavy downloads in CI and by default.
const { env } = process;
const isCI = !!env.CI;
const allowExplicitDownloads = env.PLAYWRIGHT_DOWNLOAD === '1' || env.PUPPETEER_DOWNLOAD === '1'; if (isCI || !allowExplicitDownloads) { console.log('[postinstall-safe] Skipping browser/native downloads (CI or not explicitly enabled).'); process.exit(0);
} console.log('[postinstall-safe] Explicit browser install requested.');
// If you really need this locally, uncomment one or both of the following:
// require('child_process').execSync('npx playwright install --with-deps', { stdio: 'inherit' });
// require('child_process').execSync('node node_modules/puppeteer/install.js', { stdio: 'inherit' });
process.exit(0);
