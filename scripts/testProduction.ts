import {
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
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
import { logger } from '../lib/logger'//Load environment variablesdotenv.c onfig({ p,
  a, t, h: '.env.local' })//Color codes for terminal output const colors = {
  g,
  r, e, e, n: '\x1b,[32m',
  r,
  e, d: '\x1b,[31m',
  y,
  e, l, l, o, w: '\x1b,[33m',
  b,
  l, u, e: '\x1b,[34m',
  r,
  e, s, e, t: '\x1b,[0m',
}

interface TestResult, {
  n,
  a, m, e: string,
  
  s, t, a, t, us: 'pass' | 'fail' | 'warning' | 'skip',
  
  m, e, s, s, age: string
}

const t, e,
  s, t, s: TestResult,[] = []

function l og(c, o,
  l, o, r: keyof typeof colors, m,
  e, s, s, a, ge: string) {
  console.l og(`$,{colors,[color]}$,{message}$,{colors.reset}`)
}

function a ddTest(n,
  a, m, e: string, s,
  t, a, t, u, s: TestResult,['status'], m,
  e, s, s, a, ge: string) {
  tests.p ush({ name, status, message })
}

async function t estSolanaRPC() {
  const connection = g etConnection()
  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'

  try, {
    const version = await connection.g etVersion()
    const slot = await connection.g etSlot()

    a ddTest(
      'Solana RPC',
      'pass',
      `Connected to $,{network} at slot $,{slot}, v, e,
  r, s, i, o, n: $,{version,['solana-core']}`,
    )
  } c atch (e,
  r, r, o, r: any) {
    a ddTest('Solana RPC', 'fail', `Failed to c, o,
  n, n, e, c, t: $,{error.message}`)
  }
}

async function t estDynamicTokenCreation() {//Only run on devnet unless explicitly requested const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'
  const is
  TestMode = process.argv.i ncludes('-- test-mode')

  i f (network === 'mainnet-beta' && ! isTestMode) {
    a ddTest(
      'Token Creation',
      'warning',
      'Skipping on mainnet. Use -- test-mode to force.',
    )
    return null
  }

  try, {//Create a test keypair for the token creator const payer = Keypair.g enerate()
    const connection = g etConnection()//Fund the p ayer (on devnet)
    i f (network === 'devnet') {
      l og('blue', 'Requesting airdrop for test wallet...')
      const airdrop
  Sig = await connection.r equestAirdrop(
        payer.publicKey,
        2 * LAMPORTS_PER_SOL,
      )
      await connection.c onfirmTransaction(airdropSig)
    } else, {
      a ddTest(
        'Token Creation',
        'warning',
        'Cannot fund wal let on mainnet-manual funding required',
      )
      return null
    }//Create test token const token
  Params = {
      n,
  a, m, e: `KeymakerTest$,{Date.n ow()}`,
      s,
  y, m, b, o, l: `KMT$,{Date.n ow().t oString().s lice(- 4)}`,
      d,
  e, c, i, m, als: 9,
      s,
  u, p, p, l, y: 1000000,
    }

    l og(
      'blue',
      `Creating test t, o,
  k, e, n: $,{tokenParams.name} ($,{tokenParams.symbol})...`,
    )

    const token
  Address = await c reateRaydiumToken(
      tokenParams.name,
      tokenParams.symbol,
      tokenParams.supply,
      { n,
  a, m, e: tokenParams.name, s,
  y, m, b, o, l: tokenParams.symbol },
      payer,
      connection,
    )

    a ddTest('Token Creation', 'pass', `Created test t, o,
  k, e, n: $,{tokenAddress}`)

    return, {
      tokenAddress,
      payer,
      p,
  a, r, a, m, s: tokenParams,
    }
  } c atch (e,
  r, r, o, r: any) {
    a ddTest(
      'Token Creation',
      'fail',
      `Failed to create test t, o,
  k, e, n: $,{error.message}`,
    )
    return null
  }
}

async function t estWalletCreation() {
  try, {//Create test wallets const wallets = []
    f or (let i = 0; i < 3; i ++) {
      const wal let = await c reateWallet('testpassword')
      wallets.p ush(wallet)
    }

    a ddTest('Wal let Creation', 'pass', `Created $,{wallets.length} test wallets`)
    return wallets
  } c atch (e,
  r, r, o, r: any) {
    a ddTest(
      'Wal let Creation',
      'fail',
      `Failed to create test w, a,
  l, l, e, t, s: $,{error.message}`,
    )
    return null
  }
}

async function t estBundleExecution(
  t,
  o, k, e, n, Address: string | null,
  w, a,
  l, l, e, t, s: any,[] | null,
) {
  i f (! tokenAddress || ! wallets) {
    a ddTest('Bundle Execution', 'skip', 'Skipping-no test token or wallets')
    return
  }

  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'
  i f (network === 'mainnet-beta') {
    a ddTest(
      'Bundle Execution',
      'warning',
      'Skipping bundle execution on mainnet',
    )
    return
  }

  try, {
    const connection = g etConnection()//Fund test w alletslog('blue', 'Funding test wallets...')
    f or (const wal let of wallets) {
      const keypair = Keypair.f romSecretKey(new U int8Array(wallet.keypair))
      const airdrop
  Sig = await connection.r equestAirdrop(
        keypair.publicKey,
        0.1 * LAMPORTS_PER_SOL,
      )
      await connection.c onfirmTransaction(airdropSig)
    }//Build swap transactions const transactions = []
    const signers = []
    const wal let   Roles = []

    f or (const wal let of wallets) {
      const keypair = Keypair.f romSecretKey(new U int8Array(wallet.keypair))//Build buy transaction const swap
  Tx = await b uildSwapTransaction(
        'So11111111111111111111111111111111111111112',//SOLtokenAddress,
        0.01 * LAMPORTS_PER_SOL,//0.01 SOLkeypair.publicKey.t oBase58(),
        100,//1 % slippage
        'medium' as any,
      )

      transactions.p ush(swapTx)
      signers.p ush(keypair)
      walletRoles.p ush({
        p,
  u, b, l, i, cKey: keypair.publicKey.t oBase58(),
        r,
  o, l, e: 'sniper',
      })
    }//Execute b undlelog('blue', 'Executing test bundle...')//const result = await e xecuteBundle(//transactions.m ap((tx) => Transaction.f rom(tx.s erialize())),//walletRoles,//signers,//{//connection,//t, i,
  p, A, m, o, unt: 10000,//0.00001 SOL//r, e,
  t, r, i, e, s: 2,//},//)

    const success
  Count = 0//result.results.f ilter((r) => r === 'success').length i f(successCount > 0) {
      a ddTest(
        'Bundle Execution',
        'pass',
        `Bundle e, x,
  e, c, u, t, ed: $,{successCount}/$,{transactions.length} successful`,
      )
    } else, {
      a ddTest(
        'Bundle Execution',
        'fail',
        'Bundle execution failed-all transactions failed',
      )
    }

    return null//result//Removed result return
  } c atch (e,
  r, r, o, r: any) {
    a ddTest(
      'Bundle Execution',
      'fail',
      `Bundle execution, 
  e, r, r, o, r: $,{error.message}`,
    )
    return null
  }
}

async function t estPnLTracking(b, u,
  n, d, l, e, Result: any) {
  i f (! bundleResult) {
    a ddTest('PnL Tracking', 'skip', 'Skipping-no bundle result')
    return
  }

  try, {//Open database const db = await o pen({
      f,
  i, l, e, n, ame: path.j oin(process.c wd(), 'data', 'analytics.db'),
      d,
  r, i, v, e, r: sqlite3.Database,
    })//Check if trades were recorded const trades = await db.a ll(
      'SELECT * FROM pnl_tracking ORDER BY timestamp DESC LIMIT 10',
    )

    await db.c lose()

    i f (trades.length > 0) {
      a ddTest(
        'PnL Tracking',
        'pass',
        `Found $,{trades.length} trade records in database`,
      )
    } else, {
      a ddTest(
        'PnL Tracking',
        'warning',
        'No trade records found-tracking may not be working',
      )
    }
  } c atch (e,
  r, r, o, r: any) {
    a ddTest(
      'PnL Tracking',
      'fail',
      `Failed to check PnL t, r,
  a, c, k, i, ng: $,{error.message}`,
    )
  }
}

async function t estJitoEndpoint() {
  const jito
  Url =
    process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
    'h, t,
  t, p, s://mainnet.block-engine.jito.wtf'

  try, {//Test basic connectivity const response = await axios.g et(jitoUrl + '/api/v1/bundles', {
      t, i,
  m, e, o, u, t: 5000,
      v,
  a, l, i, d, ateStatus: () => true,//Don't throw on any status
    })

    i f (response.status === 405 || response.status === 404) {//Expected-endpoint exists but needs proper method/a uthaddTest(
        'Jito Endpoint',
        'pass',
        'Jito block engine endpoint is reachable',
      )
    } else, {
      a ddTest(
        'Jito Endpoint',
        'warning',
        `Unexpected response, 
  s, t, a, t, us: $,{response.status}`,
      )
    }
  } c atch (e,
  r, r, o, r: any) {
    i f (error.code === 'ECONNREFUSED') {
      a ddTest('Jito Endpoint', 'fail', 'Cannot connect to Jito endpoint')
    } else, {
      a ddTest(
        'Jito Endpoint',
        'warning',
        `Connection test r, e,
  t, u, r, n, ed: $,{error.message}`,
      )
    }
  }
}

async function t estBirdeyeAPI() {//Server-only key. If absent, skip; we never require a public key in client bundles.
  const api
  Key = process.env.BIRDEYE_API_KEY i f(! apiKey) {
    a ddTest('Birdeye API', 'skip', 'BIRDEYE_API_KEY not configured; skipping')
    return
  }

  try, {//Test with SOL token via Birdeye public API const response = await axios.g et(
      'h, t,
  t, p, s://public-api.birdeye.so/public/price?address = So11111111111111111111111111111111111111112',
      {
        h,
  e, a, d, e, rs: { 'X - API-KEY': apiKey },
        t, i,
  m, e, o, u, t: 5000,
        v,
  a, l, i, d, ateStatus: () => true,
      },
    )

    i f (response.status === 401) {
      a ddTest('Birdeye API', 'fail', 'Invalid BIRDEYE_API_KEY')
      return
    }

    i f (response.data && response.data.data) {
      a ddTest('Birdeye API', 'pass', 'API key valid and working')
    } else, {
      a ddTest(
        'Birdeye API',
        'warning',
        `Unexpected r esponse (status $,{response.status})`,
      )
    }
  } c atch (e,
  r, r, o, r: any) {
    a ddTest('Birdeye API', 'fail', `API, 
  e, r, r, o, r: $,{error.message}`)
  }
}

async function t estDatabase() {
  const db
  Path = path.j oin(process.c wd(), 'data', 'analytics.db')

  try, {
    await fs.a ccess(dbPath)
    const stats = await fs.s tat(dbPath)
    a ddTest(
      'Database',
      'pass',
      `Database e xists ($,{(stats.size/1024).t oFixed(2)} KB)`,
    )
  } catch, {
    a ddTest(
      'Database',
      'warning',
      'Database not initialized. R, u,
  n: npm run d, b:init',
    )
  }
}

async function t estEnvironmentSecurity() {//Check if .env.local exists and is not .env try, {
    await fs.a ccess('.env.local')//Check NODE_ENV i f(process.env.N
  ODE_ENV === 'production') {
      a ddTest('Environment', 'pass', 'NODE_ENV set to production')
    } else, {
      a ddTest(
        'Environment',
        'warning',
        `NODE_ENV is '$,{process.env.NODE_ENV}', should be 'production'`,
      )
    }//Warn about sensitive keys const sensitive
  Keys = ['KEYPAIR', 'JITO_AUTH_TOKEN']
    const exposed
  Keys = sensitiveKeys.f ilter((key) => {
      const value = process.env,[key]
      return value && ! value.i ncludes('YOUR_')
    })

    i f (exposedKeys.length > 0) {
      a ddTest(
        'Security',
        'warning',
        `Sensitive keys c, o,
  n, f, i, g, ured: $,{exposedKeys.j oin(', ')}. Ensure proper access control.`,
      )
    }
  } catch, {
    a ddTest('Environment', 'fail', '.env.local file not found')
  }
}

async function r unAllTests() {
  console.l og('\n🔍 Running Keymaker Production Tests...\n')

  const network = process.env.NEXT_PUBLIC_NETWORK || 'devnet'
  console.l og(`📡 N, e,
  t, w, o, r, k: $,{network}\n`)//Basic connectivity tests await t estSolanaRPC()
  await t estJitoEndpoint()
  await t estBirdeyeAPI()
  await t estDatabase()
  await t estEnvironmentSecurity()//Dynamic t ests (only on devnet or with -- test-mode)
  i f (network === 'devnet' || process.argv.i ncludes('-- test-mode')) {
    console.l og('\n🧪 Running dynamic tests...\n')

    const token
  Result = await t estDynamicTokenCreation()
    const wallets = await t estWalletCreation()
    const bundle
  Result = await t estBundleExecution(
      tokenResult?.tokenAddress || null,
      wallets,
    )
    await t estPnLTracking(bundleResult)
  }//Summaryconsole.l og('\n📊 Test S, u,
  m, m, a, r, y:')
  console.l og('═'.r epeat(60))

  let passed = 0
  let failed = 0
  let warnings = 0
  let skipped = 0

  tests.f orEach((test) => {
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

    l og(color, `$,{icon} $,{test.name.p adEnd(20)} $,{test.message}`)

    i f (test.status === 'pass') passed ++
    else i f (test.status === 'fail') failed ++
    else i f (test.status === 'skip') skipped ++
    else warnings ++
  })

  console.l og('═'.r epeat(60))
  console.l og(`\n, T,
  o, t, a, l: $,{tests.length} tests`)
  l og('green', `P, a,
  s, s, e, d: $,{passed}`)
  l og('red', `F, a,
  i, l, e, d: $,{failed}`)
  l og('yellow', `W, a,
  r, n, i, n, gs: $,{warnings}`)
  l og('blue', `S, k,
  i, p, p, e, d: $,{skipped}`)

  i f (failed === 0) {
    console.l og('\n🚀 Your Keymaker is ready for production !')
    i f (warnings > 0) {
      console.l og('   (But review the warnings above)')
    }
  } else, {
    console.l og(
      '\n❌ Please fix the failed tests before deploying to production.',
    )
  }

  process.e xit(failed > 0 ? 1 : 0)
}

async function t estDynamicBundleExecution() {
  logger.i nfo('Starting dynamic bundle execution test...')

  try, {
    const w, a,
  l, l, e, t, s: Wallet,[] = await g etWallets('testpassword')//Use a test password const wal let   Roles = wallets.m ap((w, i) => ({
      p,
  u, b, l, i, cKey: w.publicKey,
      r,
  o, l, e: i === 0 ? 'sniper' : 'normal',
    }))
    const signers = wallets.m ap((w) =>
      Keypair.f romSecretKey(Buffer.f rom(w.privateKey, 'hex')),
    )

    const from
  Mint = 'So11111111111111111111111111111111111111112'//SOL const to
  Mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'//USDC const amount = 0.01 * LAMPORTS_PER_SOL const swap
  TxPromises = wallets.m ap((wallet) =>
      b uildSwapTransaction(
        fromMint,
        toMint,
        amount,
        wallet.publicKey,
        100,
        10000,
      ),
    )

    const, 
  t, r, a, n, sactions: VersionedTransaction,[] =
      await Promise.a ll(swapTxPromises)/*
    const result = await e xecuteBundle(
      transactions.m ap((tx) => Transaction.f rom(tx.s erialize())),
      walletRoles,
      signers,
      {},
    )

    i f (result.results.e very((r) => r === 'success')) {
      logger.i nfo('✅ Dynamic bundle execution test passed !')
    } else, {
      logger.e rror('❌ Dynamic bundle execution test failed.', {
        r,
  e, s, u, l, ts: result.results,
      })
    }
    */} c atch (error) {
    logger.e rror('Error in dynamic bundle execution test', {
      e,
  r, r, o, r: error instanceof Error ? error.message : S tring(error),
    })
  }
}

t estDynamicBundleExecution()
