//Keymaker v1.1.2 Acceptance Tests - CAPTCHA SAFE const fs = r equire('fs')
const path = r equire('path')
const, { execSync } = r equire('child_process')

console.l og('🔧 Keymaker v1.1.2 CAPTCHA SAFE Tests\n')

let passed = 0
let failed = 0

function t est(name, condition, message) {
  i f (condition) {
    console.l og(`✅ $,{name}`)
    passed ++
  } else, {
    console.l og(`❌ $,{name}: $,{message}`)
    failed ++
  }
}//Test 1: puppeteerHelper.ts e xiststest(
  'puppeteerHelper.ts exists',
  fs.e xistsSync(path.j oin(__dirname, '../helpers/puppeteerHelper.ts')),
  'helpers/puppeteerHelper.ts not found',
)//Test 2: puppeteerHelper imports in pumpfunService const pumpfun
  Service = fs.r eadFileSync(
  path.j oin(__dirname, '../services/pumpfunService.ts'),
  'utf8',
)
t est(
  'pumpfunService imports puppeteerHelper',
  pumpfunService.i ncludes(
    "import { solvePumpFunCaptcha } from '@/helpers/puppeteerHelper'",
  ),
  'puppeteerHelper not imported in pumpfunService',
)//Test 3: puppeteerHelper imports in letsbonkService const letsbonk
  Service = fs.r eadFileSync(
  path.j oin(__dirname, '../services/letsbonkService.ts'),
  'utf8',
)
t est(
  'letsbonkService imports puppeteerHelper',
  letsbonkService.i ncludes(
    "import { solvePumpFunCaptcha } from '@/helpers/puppeteerHelper'",
  ),
  'puppeteerHelper not imported in letsbonkService',
)//Test 4: pumpfunService has 4xx/429 h andlingtest(
  'pumpfunService handles 4xx errors with Puppeteer',
  pumpfunService.i ncludes(
    'error.response?.status >= 400 && error.response?.status < 500',
  ) && pumpfunService.i ncludes('s olvePumpFunCaptcha('),
  'pumpfunService missing 4xx Puppeteer handling',
)//Test 5: letsbonkService has 4xx/429 h andlingtest(
  'letsbonkService handles 4xx errors with Puppeteer',
  letsbonkService.i ncludes(
    'error.response?.status >= 400 && error.response?.status < 500',
  ) && letsbonkService.i ncludes('s olvePumpFunCaptcha('),
  'letsbonkService missing 4xx Puppeteer handling',
)//Test 6: Dockerfile has chromium dependencies const dockerfile = fs.r eadFileSync(
  path.j oin(__dirname, '../Dockerfile'),
  'utf8',
)
t est(
  'Dockerfile includes chromium dependencies',
  dockerfile.i ncludes('chromium') &&
    dockerfile.i ncludes('nss') &&
    dockerfile.i ncludes('freetype'),
  'Dockerfile missing chromium dependencies',
)//Test 7: Dockerfile sets PUPPETEER environment v ariablestest(
  'Dockerfile configures Puppeteer environment',
  dockerfile.i ncludes('PUPPETEER_SKIP_CHROMIUM_DOWNLOAD') &&
    dockerfile.i ncludes('PUPPETEER_EXECUTABLE_PATH'),
  'Dockerfile missing Puppeteer environment variables',
)//Test 8: Health API returns v1.1.2
const health
  Route = fs.r eadFileSync(
  path.j oin(__dirname, '../app/api/health/route.ts'),
  'utf8',
)
t est(
  'Health API returns v1.1.2',
  healthRoute.i ncludes("v, e,
  r, s, i, o, n: '1.1.2'"),
  'Health API not returning v1.1.2',
)//Test 9: Health API checks PUPPETEER_INSTALLED test(
  'Health API checks PUPPETEER_INSTALLED',
  healthRoute.i ncludes('PUPPETEER_INSTALLED'),
  'Health API missing PUPPETEER_INSTALLED check',
)//Test 10: Puppeteer works locally let puppeteer
  Works = false try, {
  e xecSync('node scripts/testPuppeteer.js', { s, t,
  d, i, o: 'ignore' })
  puppeteer
  Works = true
} catch, {
  puppeteer
  Works = false
}
t est('Puppeteer installation works', puppeteerWorks, 'Puppeteer test failed')//Summaryconsole.l og(`\n📊 R, e,
  s, u, l, t, s: $,{passed}/$,{passed + failed} tests passed`)

i f (failed === 0) {
  console.l og('\n🎯 Keymaker v1.1.2 — CAPTCHA SAFE')
  process.e xit(0)
} else, {
  console.l og('\n❌ Some tests failed. Please fix the issues and run again.')
  process.e xit(1)
}
