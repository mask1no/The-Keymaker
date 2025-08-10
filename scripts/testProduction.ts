import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import axios from 'axios'
import * as dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { getConnection } from '../lib/network'
import { createToken as createRaydiumToken } from '../services/raydiumService'
import { createWallet } from '../services/walletService'
import { executeBundle } from '../services/bundleService'
import { buildSwapTransaction } from '../services/jupiterService'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'skip'
  message: string
}

const tests: TestResult[] = []

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function addTest(name: string, status: TestResult['status'], message: string) {
  tests.push({ name, status, message })
}

async function testSolanaRPC() {
  const connection = getConnection()
  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

  try {
    const version = await connection.getVersion()
    const slot = await connection.getSlot()

    addTest(
      'Solana RPC',
      'pass',
      `Connected to ${network} at slot ${slot}, version: ${version['solana-core']}`,
    )
  } catch (error: any) {
    addTest('Solana RPC', 'fail', `Failed to connect: ${error.message}`)
  }
}

async function testDynamicTokenCreation() {
  // Only run on devnet unless explicitly requested
  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'
  const isTestMode = process.argv.includes('--test-mode')

  if (network === 'mainnet-beta' && !isTestMode) {
    addTest(
      'Token Creation',
      'warning',
      'Skipping on mainnet. Use --test-mode to force.',
    )
    return null
  }

  try {
    // Create a test keypair for the token creator
    const payer = Keypair.generate()
    const connection = getConnection()

    // Fund the payer (on devnet)
    if (network === 'devnet') {
      log('blue', 'Requesting airdrop for test wallet...')
      const airdropSig = await connection.requestAirdrop(
        payer.publicKey,
        2 * LAMPORTS_PER_SOL,
      )
      await connection.confirmTransaction(airdropSig)
    } else {
      addTest(
        'Token Creation',
        'warning',
        'Cannot fund wallet on mainnet - manual funding required',
      )
      return null
    }

    // Create test token
    const tokenParams = {
      name: `KeymakerTest${Date.now()}`,
      symbol: `KMT${Date.now().toString().slice(-4)}`,
      decimals: 9,
      supply: 1000000,
    }

    log(
      'blue',
      `Creating test token: ${tokenParams.name} (${tokenParams.symbol})...`,
    )

    const tokenAddress = await createRaydiumToken(
      tokenParams.name,
      tokenParams.symbol,
      tokenParams.supply,
      { name: tokenParams.name, symbol: tokenParams.symbol },
      payer,
      connection,
    )

    addTest('Token Creation', 'pass', `Created test token: ${tokenAddress}`)

    return {
      tokenAddress,
      payer,
      params: tokenParams,
    }
  } catch (error: any) {
    addTest(
      'Token Creation',
      'fail',
      `Failed to create test token: ${error.message}`,
    )
    return null
  }
}

async function testWalletCreation() {
  try {
    // Create test wallets
    const wallets = []
    for (let i = 0; i < 3; i++) {
      const wallet = await createWallet(`test-sniper-${i}`, 'sniper')
      wallets.push(wallet)
    }

    addTest('Wallet Creation', 'pass', `Created ${wallets.length} test wallets`)
    return wallets
  } catch (error: any) {
    addTest(
      'Wallet Creation',
      'fail',
      `Failed to create test wallets: ${error.message}`,
    )
    return null
  }
}

async function testBundleExecution(
  tokenAddress: string | null,
  wallets: any[] | null,
) {
  if (!tokenAddress || !wallets) {
    addTest('Bundle Execution', 'skip', 'Skipping - no test token or wallets')
    return
  }

  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'
  if (network === 'mainnet-beta') {
    addTest(
      'Bundle Execution',
      'warning',
      'Skipping bundle execution on mainnet',
    )
    return
  }

  try {
    const connection = getConnection()

    // Fund test wallets
    log('blue', 'Funding test wallets...')
    for (const wallet of wallets) {
      const keypair = Keypair.fromSecretKey(new Uint8Array(wallet.keypair))
      const airdropSig = await connection.requestAirdrop(
        keypair.publicKey,
        0.1 * LAMPORTS_PER_SOL,
      )
      await connection.confirmTransaction(airdropSig)
    }

    // Build swap transactions
    const transactions = []
    const signers = []
    const walletRoles = []

    for (const wallet of wallets) {
      const keypair = Keypair.fromSecretKey(new Uint8Array(wallet.keypair))

      // Build buy transaction
      const swapTx = await buildSwapTransaction(
        'So11111111111111111111111111111111111111112', // SOL
        tokenAddress,
        0.01 * LAMPORTS_PER_SOL, // 0.01 SOL
        keypair.publicKey.toBase58(),
        100, // 1% slippage
        'medium' as any,
      )

      transactions.push(swapTx)
      signers.push(keypair)
      walletRoles.push({
        publicKey: keypair.publicKey.toBase58(),
        role: 'sniper',
      })
    }

    // Execute bundle
    log('blue', 'Executing test bundle...')
    const result = await executeBundle(transactions, walletRoles, signers, {
      connection,
      tipAmount: 10000, // 0.00001 SOL
      retries: 2,
    })

    const successCount = result.results.filter((r) => r === 'success').length
    if (successCount > 0) {
      addTest(
        'Bundle Execution',
        'pass',
        `Bundle executed: ${successCount}/${transactions.length} successful`,
      )
    } else {
      addTest(
        'Bundle Execution',
        'fail',
        'Bundle execution failed - all transactions failed',
      )
    }

    return result
  } catch (error: any) {
    addTest(
      'Bundle Execution',
      'fail',
      `Bundle execution error: ${error.message}`,
    )
    return null
  }
}

async function testPnLTracking(bundleResult: any) {
  if (!bundleResult) {
    addTest('PnL Tracking', 'skip', 'Skipping - no bundle result')
    return
  }

  try {
    // Open database
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'analytics.db'),
      driver: sqlite3.Database,
    })

    // Check if trades were recorded
    const trades = await db.all(
      'SELECT * FROM pnl_tracking ORDER BY timestamp DESC LIMIT 10',
    )

    await db.close()

    if (trades.length > 0) {
      addTest(
        'PnL Tracking',
        'pass',
        `Found ${trades.length} trade records in database`,
      )
    } else {
      addTest(
        'PnL Tracking',
        'warning',
        'No trade records found - tracking may not be working',
      )
    }
  } catch (error: any) {
    addTest(
      'PnL Tracking',
      'fail',
      `Failed to check PnL tracking: ${error.message}`,
    )
  }
}

async function testJitoEndpoint() {
  const jitoUrl =
    process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
    'https://mainnet.block-engine.jito.wtf'

  try {
    // Test basic connectivity
    const response = await axios.get(jitoUrl + '/api/v1/bundles', {
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status
    })

    if (response.status === 405 || response.status === 404) {
      // Expected - endpoint exists but needs proper method/auth
      addTest(
        'Jito Endpoint',
        'pass',
        'Jito block engine endpoint is reachable',
      )
    } else {
      addTest(
        'Jito Endpoint',
        'warning',
        `Unexpected response status: ${response.status}`,
      )
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      addTest('Jito Endpoint', 'fail', 'Cannot connect to Jito endpoint')
    } else {
      addTest(
        'Jito Endpoint',
        'warning',
        `Connection test returned: ${error.message}`,
      )
    }
  }
}

async function testBirdeyeAPI() {
  // Server-only key. If absent, skip; we never require a public key in client bundles.
  const apiKey = process.env.BIRDEYE_API_KEY

  if (!apiKey) {
    addTest('Birdeye API', 'skip', 'BIRDEYE_API_KEY not configured; skipping')
    return
  }

  try {
    // Test with SOL token via Birdeye public API
    const response = await axios.get(
      'https://public-api.birdeye.so/public/price?address=So11111111111111111111111111111111111111112',
      {
        headers: { 'X-API-KEY': apiKey },
        timeout: 5000,
        validateStatus: () => true,
      },
    )

    if (response.status === 401) {
      addTest('Birdeye API', 'fail', 'Invalid BIRDEYE_API_KEY')
      return
    }

    if (response.data && response.data.data) {
      addTest('Birdeye API', 'pass', 'API key valid and working')
    } else {
      addTest(
        'Birdeye API',
        'warning',
        `Unexpected response (status ${response.status})`,
      )
    }
  } catch (error: any) {
    addTest('Birdeye API', 'fail', `API error: ${error.message}`)
  }
}

async function testDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'analytics.db')

  try {
    await fs.access(dbPath)
    const stats = await fs.stat(dbPath)
    addTest(
      'Database',
      'pass',
      `Database exists (${(stats.size / 1024).toFixed(2)} KB)`,
    )
  } catch {
    addTest(
      'Database',
      'warning',
      'Database not initialized. Run: npm run db:init',
    )
  }
}

async function testEnvironmentSecurity() {
  // Check if .env.local exists and is not .env
  try {
    await fs.access('.env.local')

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      addTest('Environment', 'pass', 'NODE_ENV set to production')
    } else {
      addTest(
        'Environment',
        'warning',
        `NODE_ENV is '${process.env.NODE_ENV}', should be 'production'`,
      )
    }

    // Warn about sensitive keys
    const sensitiveKeys = ['KEYPAIR', 'JITO_AUTH_TOKEN']
    const exposedKeys = sensitiveKeys.filter((key) => {
      const value = process.env[key]
      return value && !value.includes('YOUR_')
    })

    if (exposedKeys.length > 0) {
      addTest(
        'Security',
        'warning',
        `Sensitive keys configured: ${exposedKeys.join(', ')}. Ensure proper access control.`,
      )
    }
  } catch {
    addTest('Environment', 'fail', '.env.local file not found')
  }
}

async function runAllTests() {
  console.log('\n🔍 Running Keymaker Production Tests...\n')

  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'
  console.log(`📡 Network: ${network}\n`)

  // Basic connectivity tests
  await testSolanaRPC()
  await testJitoEndpoint()
  await testBirdeyeAPI()
  await testDatabase()
  await testEnvironmentSecurity()

  // Dynamic tests (only on devnet or with --test-mode)
  if (network === 'devnet' || process.argv.includes('--test-mode')) {
    console.log('\n🧪 Running dynamic tests...\n')

    const tokenResult = await testDynamicTokenCreation()
    const wallets = await testWalletCreation()
    const bundleResult = await testBundleExecution(
      tokenResult?.tokenAddress || null,
      wallets,
    )
    await testPnLTracking(bundleResult)
  }

  // Summary
  console.log('\n📊 Test Summary:')
  console.log('═'.repeat(60))

  let passed = 0
  let failed = 0
  let warnings = 0
  let skipped = 0

  tests.forEach((test) => {
    const icon =
      test.status === 'pass'
        ? '✅'
        : test.status === 'fail'
          ? '❌'
          : test.status === 'skip'
            ? '⏭️'
            : '⚠️'
    const color =
      test.status === 'pass'
        ? 'green'
        : test.status === 'fail'
          ? 'red'
          : test.status === 'skip'
            ? 'blue'
            : 'yellow'

    log(color, `${icon} ${test.name.padEnd(20)} ${test.message}`)

    if (test.status === 'pass') passed++
    else if (test.status === 'fail') failed++
    else if (test.status === 'skip') skipped++
    else warnings++
  })

  console.log('═'.repeat(60))
  console.log(`\nTotal: ${tests.length} tests`)
  log('green', `Passed: ${passed}`)
  log('red', `Failed: ${failed}`)
  log('yellow', `Warnings: ${warnings}`)
  log('blue', `Skipped: ${skipped}`)

  if (failed === 0) {
    console.log('\n🚀 Your Keymaker is ready for production!')
    if (warnings > 0) {
      console.log('   (But review the warnings above)')
    }
  } else {
    console.log(
      '\n❌ Please fix the failed tests before deploying to production.',
    )
  }

  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test runner error:', error)
  process.exit(1)
})
