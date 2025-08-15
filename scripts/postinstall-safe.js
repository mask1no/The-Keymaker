// scripts/postinstall-safe.js
const { env } = process;
const isCI = !!env.CI;
const allow = env.PLAYWRIGHT_DOWNLOAD === '1' || env.PUPPETEER_DOWNLOAD === '1';

if (isCI || !allow) {
  console.log('[postinstall-safe] Skipping browser/native downloads (CI or not explicitly enabled).');
  process.exit(0);
}

console.log('[postinstall-safe] Explicit browser install requested.');
// You can optionally trigger: require('child_process').execSync('npx playwright install --with-deps', { stdio: 'inherit' });
process.exit(0);

