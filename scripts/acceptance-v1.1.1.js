// Keymaker v1.1.1 Acceptance Tests
const fs = require('fs')
const path = require('path')

console.log('🎯 Keymaker v1.1.1 Acceptance Tests\n')

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

// Test 1: MarketCapCard exists in Dashboard folder
test(
  'MarketCapCard in Dashboard folder',
  fs.existsSync(
    path.join(__dirname, '../components/Dashboard/MarketCapCard.tsx'),
  ),
  'MarketCapCard not found in Dashboard folder',
)

// Test 2: Old MarketCapCard folder removed
test(
  'Old MarketCapCard folder removed',
  !fs.existsSync(path.join(__dirname, '../components/MarketCapCard')),
  'Old MarketCapCard folder still exists',
)

// Test 3: Health API returns v1.1.1
const healthRoute = fs.readFileSync(
  path.join(__dirname, '../app/api/health/route.ts'),
  'utf8',
)
test(
  'Health API returns v1.1.1',
  healthRoute.includes("version: '1.1.1'"),
  'Health API not returning v1.1.1',
)

// Test 4: MarketCapCard imported from Dashboard in home page
const homePage = fs.readFileSync(
  path.join(__dirname, '../app/home/page.tsx'),
  'utf8',
)
test(
  'MarketCapCard imported from Dashboard',
  homePage.includes(
    "import { MarketCapCard } from '@/components/Dashboard/MarketCapCard'",
  ),
  'MarketCapCard not imported from Dashboard folder',
)

// Test 5: MarketCapCard has FDV, 24h Vol, and Change display
const marketCapCard = fs.readFileSync(
  path.join(__dirname, '../components/Dashboard/MarketCapCard.tsx'),
  'utf8',
)
test(
  'MarketCapCard displays FDV, 24h Vol, 24h Change',
  marketCapCard.includes('FDV') &&
    marketCapCard.includes('24h Vol') &&
    marketCapCard.includes('24h Δ'),
  'MarketCapCard missing required metrics',
)

// Test 6: MarketCapCard uses Recharts
test(
  'MarketCapCard uses Recharts',
  marketCapCard.includes('import { LineChart'),
  'MarketCapCard not using Recharts',
)

// Test 7: MarketCapCard auto-hides in devnet
test(
  'MarketCapCard auto-hides in devnet',
  marketCapCard.includes("network === 'devnet'") &&
    marketCapCard.includes('return null'),
  'MarketCapCard not auto-hiding in devnet',
)

// Test 8: PnL Panel has gas fee and Jito tip columns
const pnlPanel = fs.readFileSync(
  path.join(__dirname, '../components/PnL/PnLPanel.tsx'),
  'utf8',
)
test(
  'PnL Panel shows gas fees and Jito tips',
  pnlPanel.includes('Gas Fees') && pnlPanel.includes('Jito Tips'),
  'PnL Panel missing gas fee/Jito tip columns',
)

// Test 9: No mock/placeholder code in critical files
const pumpfunFallback = fs.readFileSync(
  path.join(__dirname, '../app/api/pumpfun-fallback/route.ts'),
  'utf8',
)
test(
  'No mock code in pump.fun fallback',
  !pumpfunFallback.includes('_mock_'),
  'Mock code found in pump.fun fallback',
)

// Test 10: formatCurrency exported from utils
const utils = fs.readFileSync(path.join(__dirname, '../lib/utils.ts'), 'utf8')
test(
  'formatCurrency exported from utils',
  utils.includes('export function formatCurrency'),
  'formatCurrency not exported from utils',
)

// Summary
console.log(`\n📊 Results: ${passed}/${passed + failed} tests passed`)

if (failed === 0) {
  console.log('\n🎯 Keymaker v1.1.1 — UI COMPLETE')
  process.exit(0)
} else {
  console.log('\n❌ Some tests failed. Please fix the issues and run again.')
  process.exit(1)
}
