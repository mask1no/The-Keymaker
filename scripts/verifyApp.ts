import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token'
import WebSocket from 'ws'

interface HealthCheck {
  name: string
  status: 'ok' | 'error'
  message?: string
  latency?: number
}

async function checkRPC(endpoint: string): Promise<HealthCheck> {
  try {
    const start = Date.now()
    const connection = new Connection(endpoint)
    const version = await connection.getVersion()
    const latency = Date.now() - start

    return {
      name: 'RPC Connection',
      status: 'ok',
      message: `Connected to ${endpoint} (v${version['solana-core']})`,
      latency,
    }
  } catch (error: any) {
    return {
      name: 'RPC Connection',
      status: 'error',
      message: error.message,
    }
  }
}

async function checkWebSocket(endpoint: string): Promise<HealthCheck> {
  return new Promise((resolve) => {
    const start = Date.now()
    const ws = new WebSocket(endpoint)

    const timeout = setTimeout(() => {
      ws.close()
      resolve({
        name: 'WebSocket Connection',
        status: 'error',
        message: 'Connection timeout',
      })
    }, 5000)

    ws.on('open', () => {
      clearTimeout(timeout)
      const latency = Date.now() - start
      ws.close()
      resolve({
        name: 'WebSocket Connection',
        status: 'ok',
        message: `Connected to ${endpoint}`,
        latency,
      })
    })

    ws.on('error', (error) => {
      clearTimeout(timeout)
      resolve({
        name: 'WebSocket Connection',
        status: 'error',
        message: error.message,
      })
    })
  })
}

async function checkJito(): Promise<HealthCheck> {
  try {
    const start = Date.now()
    const response = await fetch(
      'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBundleStatuses',
          params: [[]],
        }),
      },
    )

    if (response.ok) {
      const latency = Date.now() - start
      return {
        name: 'Jito Bundle API',
        status: 'ok',
        message: 'Connected to Jito block engine',
        latency,
      }
    }

    return {
      name: 'Jito Bundle API',
      status: 'error',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error: any) {
    return {
      name: 'Jito Bundle API',
      status: 'error',
      message: error.message,
    }
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')

    if (!fs.existsSync(dbPath)) {
      return {
        name: 'Database',
        status: 'error',
        message: 'Database file not found',
      }
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    // Check required tables
    const requiredTables = [
      'wallets',
      'tokens',
      'trades',
      'errors',
      'settings',
      'execution_logs',
      'pnl_records',
      'bundles',
    ]

    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'",
    )
    const tableNames = tables.map((t) => t.name)
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t))

    await db.close()

    if (missingTables.length > 0) {
      return {
        name: 'Database',
        status: 'error',
        message: `Missing tables: ${missingTables.join(', ')}`,
      }
    }

    return {
      name: 'Database',
      status: 'ok',
      message: 'All required tables exist',
    }
  } catch (error: any) {
    return {
      name: 'Database',
      status: 'error',
      message: error.message,
    }
  }
}

async function checkPhantomConnection(): Promise<HealthCheck> {
  try {
    // In a server environment, we can't actually connect to Phantom
    // But we can verify that the wallet adapter packages are installed
    const adapterPath = path.join(
      process.cwd(),
      'node_modules',
      '@solana/wallet-adapter-phantom',
    )

    if (!fs.existsSync(adapterPath)) {
      return {
        name: 'Phantom Wallet Adapter',
        status: 'error',
        message: 'Phantom adapter not installed',
      }
    }

    return {
      name: 'Phantom Wallet Adapter',
      status: 'ok',
      message: 'Phantom adapter package found',
    }
  } catch (error: any) {
    return {
      name: 'Phantom Wallet Adapter',
      status: 'error',
      message: error.message,
    }
  }
}

async function runDevnetTest(): Promise<HealthCheck> {
  try {
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    )

    // Create a test wallet
    const payer = Keypair.generate()

    // Request airdrop
    console.log('🪂 Requesting devnet airdrop...')
    const airdropSig = await connection.requestAirdrop(
      payer.publicKey,
      2 * LAMPORTS_PER_SOL,
    )
    await connection.confirmTransaction(airdropSig)

    // Create SPL token
    console.log('🪙 Creating test SPL token...')
    const mint = await createMint(connection, payer, payer.publicKey, null, 9)

    // Create token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey,
    )

    // Mint tokens
    await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer,
      1000000000, // 1 token with 9 decimals
    )

    return {
      name: 'Devnet Test Flow',
      status: 'ok',
      message: `Created token ${mint.toBase58().slice(0, 8)}... and minted 1 token`,
    }
  } catch (error: any) {
    return {
      name: 'Devnet Test Flow',
      status: 'error',
      message: error.message,
    }
  }
}

export async function verifyApp() {
  console.log('🔍 Running Keymaker verification...\n')

  const checks: HealthCheck[] = []

  // Run all checks
  const rpcEndpoint =
    process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com'
  const wsEndpoint = rpcEndpoint.replace('https', 'wss')

  checks.push(await checkRPC(rpcEndpoint))
  checks.push(await checkWebSocket(wsEndpoint))
  checks.push(await checkJito())
  checks.push(await checkDatabase())
  checks.push(await checkPhantomConnection())

  // Run devnet test if requested
  if (process.env.RUN_DEVNET_TEST === 'true') {
    checks.push(await runDevnetTest())
  }

  // Display results
  console.log('📊 Verification Results:\n')
  checks.forEach((check) => {
    const icon = check.status === 'ok' ? '✅' : '❌'
    console.log(`${icon} ${check.name}`)
    if (check.message) {
      console.log(`   ${check.message}`)
    }
    if (check.latency) {
      console.log(`   Latency: ${check.latency}ms`)
    }
    console.log('')
  })

  // Overall status
  const allOk = checks.every((c) => c.status === 'ok')
  const result = {
    ok: allOk,
    checks: checks.reduce(
      (acc, check) => {
        acc[check.name.toLowerCase().replace(/\s+/g, '_')] =
          check.status === 'ok'
        return acc
      },
      {} as Record<string, boolean>,
    ),
    timestamp: new Date().toISOString(),
  }

  if (allOk) {
    console.log('✨ All checks passed!')
  } else {
    console.log('⚠️  Some checks failed. Please review the issues above.')
  }

  return result
}

// Run if called directly
if (require.main === module) {
  verifyApp()
    .then((result) => {
      process.exit(result.ok ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error)
      process.exit(1)
    })
}
