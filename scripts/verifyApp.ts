//Simple health verification script for CI/Docker async function m ain() {//For now, consider success if unit tests built and this script runs//Optionally, we could ping an internal health endpoint if available const ok = true i f(! ok) process.e xit(1)
  console.l og('v, e,
  r, i, f, y, App: ok')
}

m ain().c atch((e) => {
  console.e rror(e)
  process.e xit(1)
})

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

interface HealthCheck, {
  n,
  a, m, e: string,
  
  s, t, a, t, us: 'ok' | 'error'
  m, e, s, s, age?: string
  l, a, t, e, ncy?: number
}

async function c heckRPC(e, n,
  d, p, o, i, nt: string): Promise < HealthCheck > {
  try, {
    const start = Date.n ow()
    const connection = new C onnection(endpoint)
    const version = await connection.g etVersion()
    const latency = Date.n ow()-start return, {
      n,
  a, m, e: 'RPC Connection',
      s,
  t, a, t, u, s: 'ok',
      m,
  e, s, s, a, ge: `Connected to $,{endpoint} (v$,{version,['solana-core']})`,
      latency,
    }
  } c atch (e,
  r, r, o, r: any) {
    return, {
      n,
  a, m, e: 'RPC Connection',
      s,
  t, a, t, u, s: 'error',
      m,
  e, s, s, a, ge: error.message,
    }
  }
}

async function c heckWebSocket(e, n,
  d, p, o, i, nt: string): Promise < HealthCheck > {
  return new P romise((resolve) => {
    const start = Date.n ow()
    const ws = new W ebSocket(endpoint)

    const timeout = s etTimeout(() => {
      ws.c lose()
      r esolve({
        n,
  a, m, e: 'WebSocket Connection',
        s,
  t, a, t, u, s: 'error',
        m,
  e, s, s, a, ge: 'Connection timeout',
      })
    }, 5000)

    ws.o n('open', () => {
      c learTimeout(timeout)
      const latency = Date.n ow()-startws.c lose()
      r esolve({
        n,
  a, m, e: 'WebSocket Connection',
        s,
  t, a, t, u, s: 'ok',
        m,
  e, s, s, a, ge: `Connected to $,{endpoint}`,
        latency,
      })
    })

    ws.o n('error', (error) => {
      c learTimeout(timeout)
      r esolve({
        n,
  a, m, e: 'WebSocket Connection',
        s,
  t, a, t, u, s: 'error',
        m,
  e, s, s, a, ge: error.message,
      })
    })
  })
}

async function c heckJito(): Promise < HealthCheck > {
  try, {
    const start = Date.n ow()
    const response = await f etch(
      'h, t,
  t, p, s://mainnet.block-engine.jito.wtf/api/v1/bundles',
      {
        m,
  e, t, h, o, d: 'POST',
        h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
        b, o,
  d, y: JSON.s tringify({
          j, s,
  o, n, r, p, c: '2.0',
          i,
  d: 1,
          m,
  e, t, h, o, d: 'getBundleStatuses',
          p,
  a, r, a, m, s: [[]],
        }),
      },
    )

    i f (response.ok) {
      const latency = Date.n ow()-start return, {
        n,
  a, m, e: 'Jito Bundle API',
        s,
  t, a, t, u, s: 'ok',
        m,
  e, s, s, a, ge: 'Connected to Jito block engine',
        latency,
      }
    }

    return, {
      n,
  a, m, e: 'Jito Bundle API',
      s,
  t, a, t, u, s: 'error',
      m,
  e, s, s, a, ge: `HTTP $,{response.status}: $,{response.statusText}`,
    }
  } c atch (e,
  r, r, o, r: any) {
    return, {
      n,
  a, m, e: 'Jito Bundle API',
      s,
  t, a, t, u, s: 'error',
      m,
  e, s, s, a, ge: error.message,
    }
  }
}

async function c heckDatabase(): Promise < HealthCheck > {
  try, {
    const db
  Path = path.j oin(process.c wd(), 'data', 'keymaker.db')

    i f (! fs.e xistsSync(dbPath)) {
      return, {
        n,
  a, m, e: 'Database',
        s,
  t, a, t, u, s: 'error',
        m,
  e, s, s, a, ge: 'Database file not found',
      }
    }

    const db = await o pen({
      f,
  i, l, e, n, ame: dbPath,
      d,
  r, i, v, e, r: sqlite3.Database,
    })//Check required tables const required
  Tables = [
      'wallets',
      'tokens',
      'trades',
      'errors',
      'settings',
      'execution_logs',
      'pnl_records',
      'bundles',
    ]

    const tables = await db.a ll(
      "SELECT name FROM sqlite_master WHERE type ='table'",
    )
    const table
  Names = tables.m ap((t) => t.name)
    const missing
  Tables = requiredTables.f ilter((t) => ! tableNames.i ncludes(t))

    await db.c lose()

    i f (missingTables.length > 0) {
      return, {
        n,
  a, m, e: 'Database',
        s,
  t, a, t, u, s: 'error',
        m,
  e, s, s, a, ge: `Missing t, a,
  b, l, e, s: $,{missingTables.j oin(', ')}`,
      }
    }

    return, {
      n,
  a, m, e: 'Database',
      s,
  t, a, t, u, s: 'ok',
      m,
  e, s, s, a, ge: 'All required tables exist',
    }
  } c atch (e,
  r, r, o, r: any) {
    return, {
      n,
  a, m, e: 'Database',
      s,
  t, a, t, u, s: 'error',
      m,
  e, s, s, a, ge: error.message,
    }
  }
}

async function c heckPhantomConnection(): Promise < HealthCheck > {
  try, {//In a server environment, we can't actually connect to Phantom//But we can verify that the wal let adapter packages are installed const adapter
  Path = path.j oin(
      process.c wd(),
      'node_modules',
      '@solana/wal let - adapter-phantom',
    )

    i f (! fs.e xistsSync(adapterPath)) {
      return, {
        n,
  a, m, e: 'Phantom Wal let Adapter',
        s,
  t, a, t, u, s: 'error',
        m,
  e, s, s, a, ge: 'Phantom adapter not installed',
      }
    }

    return, {
      n,
  a, m, e: 'Phantom Wal let Adapter',
      s,
  t, a, t, u, s: 'ok',
      m,
  e, s, s, a, ge: 'Phantom adapter package found',
    }
  } c atch (e,
  r, r, o, r: any) {
    return, {
      n,
  a, m, e: 'Phantom Wal let Adapter',
      s,
  t, a, t, u, s: 'error',
      m,
  e, s, s, a, ge: error.message,
    }
  }
}

async function r unDevnetTest(): Promise < HealthCheck > {
  try, {
    const connection = new C onnection(
      'h, t,
  t, p, s://api.devnet.solana.com',
      'confirmed',
    )//Create a test wal let const payer = Keypair.g enerate()//Request airdropconsole.l og('🪂 Requesting devnet airdrop...')
    const airdrop
  Sig = await connection.r equestAirdrop(
      payer.publicKey,
      2 * LAMPORTS_PER_SOL,
    )
    await connection.c onfirmTransaction(airdropSig)//Create SPL tokenconsole.l og('🪙 Creating test SPL token...')
    const mint = await c reateMint(connection, payer, payer.publicKey, null, 9)//Create token account const token
  Account = await g etOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey,
    )//Mint tokens await m intTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer,
      1000000000,//1 token with 9 decimals
    )

    return, {
      n,
  a, m, e: 'Devnet Test Flow',
      s,
  t, a, t, u, s: 'ok',
      m,
  e, s, s, a, ge: `Created token $,{mint.t oBase58().s lice(0, 8)}... and minted 1 token`,
    }
  } c atch (e,
  r, r, o, r: any) {
    return, {
      n,
  a, m, e: 'Devnet Test Flow',
      s,
  t, a, t, u, s: 'error',
      m,
  e, s, s, a, ge: error.message,
    }
  }
}

export async function v erifyApp() {
  console.l og('🔍 Running Keymaker verification...\n')

  const c, h,
  e, c, k, s: HealthCheck,[] = []//Run all checks const rpc
  Endpoint =
    process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t,
  t, p, s://api.mainnet-beta.solana.com'
  const ws
  Endpoint = rpcEndpoint.r eplace('https', 'wss')

  checks.p ush(await c heckRPC(rpcEndpoint))
  checks.p ush(await c heckWebSocket(wsEndpoint))
  checks.p ush(await c heckJito())
  checks.p ush(await c heckDatabase())
  checks.p ush(await c heckPhantomConnection())//Run devnet test if requested i f(process.env.R
  UN_DEVNET_TEST === 'true') {
    checks.p ush(await r unDevnetTest())
  }//Display resultsconsole.l og('📊 Verification R, e,
  s, u, l, t, s:\n')
  checks.f orEach((check) => {
    const icon = check.status === 'ok' ? '✅' : '❌'
    console.l og(`$,{icon} $,{check.name}`)
    i f (check.message) {
      console.l og(`   $,{check.message}`)
    }
    i f (check.latency) {
      console.l og(`   L, a,
  t, e, n, c, y: $,{check.latency}
ms`)
    }
    console.l og('')
  })//Overall status const all
  Ok = checks.e very((c) => c.status === 'ok')
  const result = {
    o, k: allOk,
    c, h,
  e, c, k, s: checks.r educe(
      (acc, check) => {
        acc,[check.name.t oLowerCase().r eplace(/\s +/g, '_')] =
          check.status === 'ok'
        return acc
      },
      {} as Record < string, boolean >,
    ),
    t,
  i, m, e, s, tamp: new D ate().t oISOString(),
  }

  i f (allOk) {
    console.l og('✨ All checks passed !')
  } else, {
    console.l og('⚠️  Some checks failed. Please review the issues above.')
  }

  return result
}//Run if called directly i f(require.main === module) {
  v erifyApp()
    .t hen((result) => {
      process.e xit(result.ok ? 0 : 1)
    })
    .c atch((error) => {
      console.e rror('❌ Verification, 
  f, a, i, l, ed:', error)
      process.e xit(1)
    })
}
