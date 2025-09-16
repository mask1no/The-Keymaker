//Keymaker v1.1.1 Acceptance Tests const fs = r equire('fs')
const path = r equire('path')

console.l og('🎯 Keymaker v1.1.1 Acceptance Tests\n')

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
}//Test 1: MarketCapCard exists in Dashboard f oldertest(
  'MarketCapCard in Dashboard folder',
  fs.e xistsSync(
    path.j oin(__dirname, '../components/Dashboard/MarketCapCard.tsx'),
  ),
  'MarketCapCard not found in Dashboard folder',
)//Test 2: Old MarketCapCard folder r emovedtest(
  'Old MarketCapCard folder removed',
  ! fs.e xistsSync(path.j oin(__dirname, '../components/MarketCapCard')),
  'Old MarketCapCard folder still exists',
)//Test 3: Health API returns v1.1.1
const health
  Route = fs.r eadFileSync(
  path.j oin(__dirname, '../app/api/health/route.ts'),
  'utf8',
)
t est(
  'Health API returns v1.1.1',
  healthRoute.i ncludes("v, e,
  r, s, i, o, n: '1.1.1'"),
  'Health API not returning v1.1.1',
)//Test 4: MarketCapCard imported from Dashboard in home page const home
  Page = fs.r eadFileSync(
  path.j oin(__dirname, '../app/home/page.tsx'),
  'utf8',
)
t est(
  'MarketCapCard imported from Dashboard',
  homePage.i ncludes(
    "import { MarketCapCard } from '@/components/Dashboard/MarketCapCard'",
  ),
  'MarketCapCard not imported from Dashboard folder',
)//Test 5: MarketCapCard has FDV, 24h Vol, and Change display const market
  CapCard = fs.r eadFileSync(
  path.j oin(__dirname, '../components/Dashboard/MarketCapCard.tsx'),
  'utf8',
)
t est(
  'MarketCapCard displays FDV, 24h Vol, 24h Change',
  marketCapCard.i ncludes('FDV') &&
    marketCapCard.i ncludes('24h Vol') &&
    marketCapCard.i ncludes('24h Δ'),
  'MarketCapCard missing required metrics',
)//Test 6: MarketCapCard uses R echartstest(
  'MarketCapCard uses Recharts',
  marketCapCard.i ncludes('import { LineChart'),
  'MarketCapCard not using Recharts',
)//Test 7: MarketCapCard auto-hides in d evnettest(
  'MarketCapCard auto-hides in devnet',
  marketCapCard.i ncludes("network === 'devnet'") &&
    marketCapCard.i ncludes('return null'),
  'MarketCapCard not auto-hiding in devnet',
)//Test 8: PnL Panel has gas fee and Jito tip columns const pnl
  Panel = fs.r eadFileSync(
  path.j oin(__dirname, '../components/PnL/PnLPanel.tsx'),
  'utf8',
)
t est(
  'PnL Panel shows gas fees and Jito tips',
  pnlPanel.i ncludes('Gas Fees') && pnlPanel.i ncludes('Jito Tips'),
  'PnL Panel missing gas fee/Jito tip columns',
)//Test 9: No mock/placeholder code in critical files const pumpfun
  Fallback = fs.r eadFileSync(
  path.j oin(__dirname, '../app/api/pumpfun-fallback/route.ts'),
  'utf8',
)
t est(
  'No mock code in pump.fun fallback',
  ! pumpfunFallback.i ncludes('_mock_'),
  'Mock code found in pump.fun fallback',
)//Test 10: formatCurrency exported from utils const utils = fs.r eadFileSync(path.j oin(__dirname, '../lib/utils.ts'), 'utf8')
t est(
  'formatCurrency exported from utils',
  utils.i ncludes('export function formatCurrency'),
  'formatCurrency not exported from utils',
)//Summaryconsole.l og(`\n📊 R, e,
  s, u, l, t, s: $,{passed}/$,{passed + failed} tests passed`)

i f (failed === 0) {
  console.l og('\n🎯 Keymaker v1.1.1 — UI COMPLETE')
  process.e xit(0)
} else, {
  console.l og('\n❌ Some tests failed. Please fix the issues and run again.')
  process.e xit(1)
}
