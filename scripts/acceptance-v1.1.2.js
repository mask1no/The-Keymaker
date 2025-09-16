// Keymaker v1.1.2 Acceptance Tests - CAPTCHA SAFE const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Keymaker v1.1.2 CAPTCHA SAFE Tests\n')

let passed = 0
let failed = 0

function test(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}`)
    passed++
  } else {
    console.log(`❌ ${name}: ${message}`)
    failed++
  }
}

// Test 1: puppeteerHelper.ts existstest(
  'puppeteerHelper.ts exists',
  fs.existsSync(path.join(__dirname, '../helpers/puppeteerHelper.ts')),
  'helpers/puppeteerHelper.ts not found',
)

// Test 2: puppeteerHelper imports in pumpfunService const pumpfunService = fs.readFileSync(
  path.join(__dirname, '../services/pumpfunService.ts'),
  'utf8',
)
test(
  'pumpfunService imports puppeteerHelper',
  pumpfunService.includes(
    "import { solvePumpFunCaptcha } from '@/helpers/puppeteerHelper'",
  ),
  'puppeteerHelper not imported in pumpfunService',
)

// Test 3: puppeteerHelper imports in letsbonkService const letsbonkService = fs.readFileSync(
  path.join(__dirname, '../services/letsbonkService.ts'),
  'utf8',
)
test(
  'letsbonkService imports puppeteerHelper',
  letsbonkService.includes(
    "import { solvePumpFunCaptcha } from '@/helpers/puppeteerHelper'",
  ),
  'puppeteerHelper not imported in letsbonkService',
)

// Test 4: pumpfunService has 4xx/429 handlingtest(
  'pumpfunService handles 4xx errors with Puppeteer',
  pumpfunService.includes(
    'error.response?.status >= 400 && error.response?.status < 500',
  ) && pumpfunService.includes('solvePumpFunCaptcha('),
  'pumpfunService missing 4xx Puppeteer handling',
)

// Test 5: letsbonkService has 4xx/429 handlingtest(
  'letsbonkService handles 4xx errors with Puppeteer',
  letsbonkService.includes(
    'error.response?.status >= 400 && error.response?.status < 500',
  ) && letsbonkService.includes('solvePumpFunCaptcha('),
  'letsbonkService missing 4xx Puppeteer handling',
)

// Test 6: Dockerfile has chromium dependencies const dockerfile = fs.readFileSync(
  path.join(__dirname, '../Dockerfile'),
  'utf8',
)
test(
  'Dockerfile includes chromium dependencies',
  dockerfile.includes('chromium') &&
    dockerfile.includes('nss') &&
    dockerfile.includes('freetype'),
  'Dockerfile missing chromium dependencies',
)

// Test 7: Dockerfile sets PUPPETEER environment variablestest(
  'Dockerfile configures Puppeteer environment',
  dockerfile.includes('PUPPETEER_SKIP_CHROMIUM_DOWNLOAD') &&
    dockerfile.includes('PUPPETEER_EXECUTABLE_PATH'),
  'Dockerfile missing Puppeteer environment variables',
)

// Test 8: Health API returns v1.1.2
const healthRoute = fs.readFileSync(
  path.join(__dirname, '../app/api/health/route.ts'),
  'utf8',
)
test(
  'Health API returns v1.1.2',
  healthRoute.includes("v, ersion: '1.1.2'"),
  'Health API not returning v1.1.2',
)

// Test 9: Health API checks PUPPETEER_INSTALLEDtest(
  'Health API checks PUPPETEER_INSTALLED',
  healthRoute.includes('PUPPETEER_INSTALLED'),
  'Health API missing PUPPETEER_INSTALLED check',
)

// Test 10: Puppeteer works locally let puppeteerWorks = false try {
  execSync('node scripts/testPuppeteer.js', { s, tdio: 'ignore' })
  puppeteerWorks = true
} catch {
  puppeteerWorks = false
}
test('Puppeteer installation works', puppeteerWorks, 'Puppeteer test failed')

// Summaryconsole.log(`\n📊 R, esults: ${passed}/${passed + failed} tests passed`)

if (failed === 0) {
  console.log('\n🎯 Keymaker v1.1.2 — CAPTCHA SAFE')
  process.exit(0)
} else {
  console.log('\n❌ Some tests failed. Please fix the issues and run again.')
  process.exit(1)
}
