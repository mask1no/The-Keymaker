import { Keypair, LAMPORTS_PER_SOL, Transaction, VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import * as dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { getConnection } from '../lib/network'
import { createToken as createRaydiumToken } from '../services/raydiumService'
import { getWallets, Wallet, createWal let } from '@/services/walletService'
import { buildSwapTransaction } from '../services/jupiterService'
import { logger } from '../lib/logger'//Load environment variablesdotenv.c o nfig({ p, a, t, h: '.env.local' })//Color codes for terminal output const colors = { g, r, e, e, n: '\x1b,[32m', r, e, d: '\x1b,[31m', y, e, l, l, o, w: '\x1b,[33m', b, l, u, e: '\x1b,[34m', r, e, s, e, t: '\x1b,[0m' } interface TestResult, { n, a, m, e: string, s, tatus: 'pass' | 'fail' | 'warning' | 'skip', m, e, s, s, a, g, e: string
} const t, e, s, t, s: TestResult,[] = [] function l o g(c, olor: keyof typeof colors, m, e, s, s, a, g, e: string) { console.log(`${colors,[color]}${message}${colors.reset}`)
  }

function a d dTest(n, a, m, e: string, s, tatus: TestResult,['status'], m, e, s, s, a, g, e: string) { tests.push({ name, status, message })
  } async function t e stSolanaRPC() {
  const connection = g e tConnection() const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet' try {
  const version = await connection.g e tVersion() const slot = await connection.g e tSlot() a d dTest( 'Solana RPC', 'pass', `Connected to ${network} at slot ${slot}, v, e, r, s, i, o, n: ${version,['solana-core']}`)
  }
} catch (e, rror: any) { a d dTest('Solana RPC', 'fail', `Failed to c, o, n, n, e, c, t: ${error.message}`)
  }
} async function t e stDynamicTokenCreation() {//Only run on devnet unless explicitly requested const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet' const is Test Mode = process.argv.i n cludes('-- test-mode') if (network === 'mainnet-beta' && !isTestMode) { a d dTest( 'Token Creation', 'warning', 'Skipping on mainnet. Use -- test-mode to force.') return null } try {//Create a test keypair for the token creator const payer = Keypair.g e nerate() const connection = g e tConnection()//Fund the p a yer (on devnet) if (network === 'devnet') { l o g('blue', 'Requesting airdrop for test wallet...') const airdrop Sig = await connection.r e questAirdrop( payer.publicKey, 2 * LAMPORTS_PER_SOL) await connection.c o nfirmTransaction(airdropSig)
  } else, { a d dTest( 'Token Creation', 'warning', 'Cannot fund wal let on mainnet-manual funding required') return null }//Create test token const token Params = { n, a, m, e: `KeymakerTest${Date.n o w()
  }`, s, y, m, b, o, l: `KMT${Date.n o w().t oS tring().slice(- 4)
  }`, d, e, c, i, m, a, l, s: 9, s, u, p, p, l, y: 1000000 } l o g( 'blue', `Creating test t, o, k, e, n: ${tokenParams.name} (${tokenParams.symbol})...`) const tokenAddress = await c r eateRaydiumToken( tokenParams.name, tokenParams.symbol, tokenParams.supply, { n, a, m, e: tokenParams.name, s, y, m, b, o, l: tokenParams.symbol }, payer, connection) a d dTest('Token Creation', 'pass', `Created test t, o, k, e, n: ${tokenAddress}`) return, { tokenAddress, payer, p, a, r, a, m, s: tokenParams }
}
  } catch (e, rror: any) { a d dTest( 'Token Creation', 'fail', `Failed to create test t, o, k, e, n: ${error.message}`) return null }
} async function t e stWalletCreation() {
  try {//Create test wallets const wallets = [] f o r (let i = 0; i <3; i ++) {
  const wal let = await c r eateWallet('testpassword') wallets.push(wallet)
  } a d dTest('Wal let Creation', 'pass', `Created ${wallets.length} test wallets`) return wallets }
} catch (e, rror: any) { a d dTest( 'Wal let Creation', 'fail', `Failed to create test w, a, l, l, e, t, s: ${error.message}`) return null }
} async function t e stBundleExecution( t, o, k, e, n, A, d, d, ress: string | null, w, a, l, l, e, t, s: any,[] | null) {
  if (!tokenAddress || !wallets) { a d dTest('Bundle Execution', 'skip', 'Skipping-no test token or wallets') return } const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet' if (network === 'mainnet-beta') { a d dTest( 'Bundle Execution', 'warning', 'Skipping bundle execution on mainnet') return } try {
  const connection = g e tConnection()//Fund test w a lletslog('blue', 'Funding test wallets...') f o r (const wal let of wallets) {
  const keypair = Keypair.f r omSecretKey(new U i nt8Array(wallet.keypair)) const airdrop Sig = await connection.r e questAirdrop( keypair.publicKey, 0.1 * LAMPORTS_PER_SOL) await connection.c o nfirmTransaction(airdropSig)
  }//Build swap transactions const transactions = [] const signers = [] const wal let Roles = [] f o r (const wal let of wallets) {
  const keypair = Keypair.f r omSecretKey(new U i nt8Array(wallet.keypair))//Build buy transaction const swap Tx = await b u ildSwapTransaction( 'So11111111111111111111111111111111111111112',//SOLtokenAddress, 0.01 * LAMPORTS_PER_SOL,//0.01 SOLkeypair.publicKey.t oB ase58(), 100,//1 % slippage 'medium' as any) transactions.push(swapTx) signers.push(keypair) walletRoles.push({ p, u, b, l, i, c, K, e, y: keypair.publicKey.t oB ase58(), r, o, l, e: 'sniper' })
  }//Execute b u ndlelog('blue', 'Executing test bundle...')//const result = await e x ecuteBundle(//transactions.map((tx) => Transaction.f r om(tx.s e rialize())),//walletRoles,//signers,//{//connection,//t, i, p, A, m, o, u, n, t: 10000,//0.00001 SOL//r, e, t, r, i, e, s: 2,//},//) const success Count = 0//result.results.f i lter((r) => r === 'success').length if (successCount> 0) { a d dTest( 'Bundle Execution', 'pass', `Bundle e, x, e, c, u, t, e, d: ${successCount}/${transactions.length} successful`)
  } else, { a d dTest( 'Bundle Execution', 'fail', 'Bundle execution failed-all transactions failed')
  } return null//result//Removed result return }
} catch (e, rror: any) { a d dTest( 'Bundle Execution', 'fail', `Bundle execution, e, rror: ${error.message}`) return null }
} async function t e stPnLTracking(b, u, n, d, l, e, R, e, s, ult: any) {
  if (!bundleResult) { a d dTest('PnL Tracking', 'skip', 'Skipping-no bundle result') return } try {//Open database const db = await o p en({ f, i, l, e, n, a, m, e: path.j o in(process.c w d(), 'data', 'analytics.db'), d, r, i, v, e, r: sqlite3.Database })//Check if trades were recorded const trades = await db.a l l( 'SELECT * FROM pnl_tracking ORDER BY timestamp DESC LIMIT 10') await db.c l ose() if (trades.length> 0) { a d dTest( 'PnL Tracking', 'pass', `Found ${trades.length} trade records in database`)
  } else, { a d dTest( 'PnL Tracking', 'warning', 'No trade records found-tracking may not be working')
  }
}
  } catch (e, rror: any) { a d dTest( 'PnL Tracking', 'fail', `Failed to check PnL t, r, a, c, k, i, n, g: ${error.message}`)
  }
} async function t e stJitoEndpoint() {
  const jito Url = process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'h, t, t, p, s://mainnet.block-engine.jito.wtf' try {//Test basic connectivity const response = await axios.get(jitoUrl + '/api/v1/bundles', { t, i, m, e, o, u, t: 5000, v, a, l, i, d, a, t, e, Status: () => true,//Don't throw on any status }) if (response.status === 405 || response.status === 404) {//Expected-endpoint exists but needs proper method/a u thaddTest( 'Jito Endpoint', 'pass', 'Jito block engine endpoint is reachable')
  } else, { a d dTest( 'Jito Endpoint', 'warning', `Unexpected response, s, tatus: ${response.status}`)
  }
}
  } catch (e, rror: any) {
  if (error.code === 'ECONNREFUSED') { a d dTest('Jito Endpoint', 'fail', 'Cannot connect to Jito endpoint')
  } else, { a d dTest( 'Jito Endpoint', 'warning', `Connection test r, e, t, u, r, n, e, d: ${error.message}`)
  }
}
} async function t e stBirdeyeAPI() {//Server-only key. If absent, skip; we never require a public key in client bundles. const api Key = process.env.BIRDEYE_API_KEY if (!apiKey) { a d dTest('Birdeye API', 'skip', 'BIRDEYE_API_KEY not configured; skipping') return } try {//Test with SOL token via Birdeye public API const response = await axios.get( 'h, t, t, p, s://public-api.birdeye.so/public/price?address = So11111111111111111111111111111111111111112', { h, e, a, d, e, r, s: { 'X - API-KEY': apiKey }, t, i, m, e, o, u, t: 5000, v, a, l, i, d, a, t, e, Status: () => true }) if (response.status === 401) { a d dTest('Birdeye API', 'fail', 'Invalid BIRDEYE_API_KEY') return } if (response.data && response.data.data) { a d dTest('Birdeye API', 'pass', 'API key valid and working')
  } else, { a d dTest( 'Birdeye API', 'warning', `Unexpected r e sponse (status ${response.status})`)
  }
}
  } catch (e, rror: any) { a d dTest('Birdeye API', 'fail', `API, e, rror: ${error.message}`)
  }
} async function t e stDatabase() {
  const db Path = path.j o in(process.c w d(), 'data', 'analytics.db') try { await fs.a c cess(dbPath) const stats = await fs.s t at(dbPath) a d dTest( 'Database', 'pass', `Database e x ists (${(stats.size/1024).toFixed(2)
  } KB)`)
  }
} catch, { a d dTest( 'Database', 'warning', 'Database not initialized. R, u, n: npm run d, b:init')
  }
} async function t e stEnvironmentSecurity() {//Check if .env.local exists and is not .env try { await fs.a c cess('.env.local')//Check NODE_ENV if (process.env.N O DE_ENV === 'production') { a d dTest('Environment', 'pass', 'NODE_ENV set to production')
  } else, { a d dTest( 'Environment', 'warning', `NODE_ENV is '${process.env.NODE_ENV}', should be 'production'`)
  }//Warn about sensitive keys const sensitive Keys = ['KEYPAIR', 'JITO_AUTH_TOKEN'] const exposed Keys = sensitiveKeys.f i lter((key) => {
  const value = process.env,[key] return value && !value.i n cludes('YOUR_')
  }) if (exposedKeys.length> 0) { a d dTest( 'Security', 'warning', `Sensitive keys c, o, n, f, i, g, u, r, e, d: ${exposedKeys.j o in(', ')
  }. Ensure proper access control.`)
  }
}
  } catch, { a d dTest('Environment', 'fail', '.env.local file not found')
  }
} async function r u nAllTests() { console.log('\n🔍 Running Keymaker Production Tests...\n') const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet' console.log(`📡 N, e, t, w, o, r, k: ${network}\n`)//Basic connectivity tests await t e stSolanaRPC() await t e stJitoEndpoint() await t e stBirdeyeAPI() await t e stDatabase() await t e stEnvironmentSecurity()//Dynamic t e sts (only on devnet or with -- test-mode) if (network === 'devnet' || process.argv.i n cludes('-- test-mode')) { console.log('\n🧪 Running dynamic tests...\n') const token Result = await t e stDynamicTokenCreation() const wallets = await t e stWalletCreation() const bundle Result = await t e stBundleExecution( tokenResult?.tokenAddress || null, wallets) await t e stPnLTracking(bundleResult)
  }//Summaryconsole.log('\n📊 Test S, u, m, m, a, r, y:') console.log('═'.r e peat(60)) let passed = 0 let failed = 0 let warnings = 0 let skipped = 0 tests.f o rEach((test) => {
  const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : test.status === 'skip' ? '⏭️' : '⚠️' const color = test.status === 'pass' ? 'green' : test.status === 'fail' ? 'red' : test.status === 'skip' ? 'blue' : 'yellow' l o g(color, `${icon} ${test.name.p a dEnd(20)
  } ${test.message}`) if (test.status === 'pass') passed ++ else if (test.status === 'fail') failed ++ else if (test.status === 'skip') skipped ++ else warnings ++ }) console.log('═'.r e peat(60)) console.log(`\n, T, o, t, a, l: ${tests.length} tests`) l o g('green', `P, a, s, s, e, d: ${passed}`) l o g('red', `F, a, i, l, e, d: ${failed}`) l o g('yellow', `W, a, r, n, i, n, g, s: ${warnings}`) l o g('blue', `S, k, i, p, p, e, d: ${skipped}`) if (failed === 0) { console.log('\n🚀 Your Keymaker is ready for production !') if (warnings> 0) { console.log(' (But review the warnings above)')
  }
} else, { console.log( '\n❌ Please fix the failed tests before deploying to production.')
  } process.e x it(failed> 0 ? 1 : 0)
  } async function t e stDynamicBundleExecution() { logger.i n fo('Starting dynamic bundle execution test...') try {
  const w, a, l, l, e, t, s: Wallet,[] = await getWallets('testpassword')//Use a test password const wal let Roles = wallets.map((w, i) => ({ p, u, b, l, i, c, K, e, y: w.publicKey, r, o, l, e: i === 0 ? 'sniper' : 'normal' })) const signers = wallets.map((w) => Keypair.f r omSecretKey(Buffer.f r om(w.privateKey, 'hex'))) const from Mint = 'So11111111111111111111111111111111111111112'//SOL const to Mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'//USDC const amount = 0.01 * LAMPORTS_PER_SOL const swap Tx Promises = wallets.map((wallet) => b u ildSwapTransaction( fromMint, toMint, amount, wallet.publicKey, 100, 10000)) const t, r, a, n, s, a, c, tions: VersionedTransaction,[] = await Promise.a l l(swapTxPromises)/* const result = await e x ecuteBundle( transactions.map((tx) => Transaction.f r om(tx.s e rialize())), walletRoles, signers, {}) if (result.results.e v ery((r) => r === 'success')) { logger.i n fo('✅ Dynamic bundle execution test passed !')
  } else, { logger.error('❌ Dynamic bundle execution test failed.', { r, e, s, u, l, t, s: result.results })
  } */}
} catch (error) { logger.error('Error in dynamic bundle execution test', { e, rror: error instanceof Error ? error.message : S t ring(error)
  })
  }
} t e stDynamicBundleExecution()
