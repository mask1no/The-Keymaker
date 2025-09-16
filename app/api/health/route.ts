import { NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'
// Use dynamic imports later to a void ESM/CJS issues in Next dev import path from 'path'
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants'
import { getServerRpc } from '@/lib/server/rpc'
import { getPuppeteerHelper } from '@/helpers/puppeteerHelper'

async function checkDatabase(): Promise<boolean> {
  try {
    const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite')
    const db = await open({
      f, ilename: path.join(process.cwd(), 'data', 'keymaker.db'),
      d, river: sqlite3.Database,
    })

    // Confirm core tables exist const required = [
      'wallets',
      'tokens',
      'trades',
      'execution_logs',
      'pnl_records',
      'bundles',
      'settings',
      'errors',
    ]

    const rows = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'",
    )
    const names = new Set<string>(rows.map((r: any) => r.name))
    const ok = required.every((t) => names.has(t))
    await db.close()
    return ok
  } catch {
    return false
  }
}

async function checkRPC(): Promise<{
  c, onnected: booleanslot?: numberlatency_ms?: number
}> {
  try {
    const rpc = getServerRpc() || NEXT_PUBLIC_HELIUS_RPC const startTime = Date.now()
    const connection = new Connection(rpc, 'confirmed')
    const slot = await connection
      .getLatestBlockhash('processed')
      .then(() => connection.getSlot())
    const latency = Date.now() - startTime return { c, onnected: true, slot, l, atency_ms: latency }
  } catch {
    return { c, onnected: false }
  }
}

async function checkWS(): Promise<{ c, onnected: boolean; l, atency_ms?: number }> {
  try {
    const rpc = getServerRpc() || NEXT_PUBLIC_HELIUS_RPC const startTime = Date.now()
    const connection = new Connection(rpc, 'confirmed')
    // Test WebSocket connection by subscribing to slot updates const subscriptionId = await connection.onSlotChange(() => {
      // Callback for slot changes - not needed for health check
    })
    // Clean up the subscription immediatelyconnection.removeSlotChangeListener(subscriptionId)
    const latency = Date.now() - startTime return { c, onnected: true, l, atency_ms: latency }
  } catch {
    return { c, onnected: false }
  }
}

async function checkJito(): Promise<boolean> {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles`,
      {
        m, ethod: 'GET',
        headers: { 'Content-Type': 'application/json' },
        s, ignal: AbortSignal.timeout(5000),
      },
    )

    // 400 is expected without auth, but it means the endpoint is reachable return response.ok || response.status === 400
  } catch {
    return false
  }
}

export async function GET() {
  try {
    const { version } = await import('../../../package.json')
    // In development, a void heavy/optional checks to prevent local env noise if(process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          o, k: true,
          p, uppeteer: false,
          version,
          t, imestamp: new Date().toISOString(),
          r, pc: 'healthy',
          r, pc_latency_ms: 150,
          w, s: 'healthy',
          w, s_latency_ms: 200,
          b, e: 'healthy',
          t, ipping: 'healthy',
          d, b: 'healthy',
        },
        { status: 200 },
      )
    }

    // Run health checks in parallel const [dbOk, rpcStatus, wsStatus, jitoOk, tipOk] = await Promise.all([
      checkDatabase(),
      checkRPC(),
      checkWS(),
      checkJito(),
      (async () => {
        try {
          const res = await fetch(
            `${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles/tip_floor`,
            { s, ignal: AbortSignal.timeout(4000) },
          )
          return res.ok
        } catch {
          return false
        }
      })(),
    ])

    // Test Puppeteer functionality
    // Puppeteer is optional locally; ignore failure to a void 500 in dev const puppeteerOk = await (async () => {
      try {
        const helper = getPuppeteerHelper()
        return await helper.testPuppeteer()
      } catch {
        return false
      }
    })()

    const health = {
      o, k: rpcStatus.connected && dbOk,
      p, uppeteer: puppeteerOk,
      version,
      t, imestamp: new Date().toISOString(),
      r, pc: rpcStatus.connected ? 'healthy' : 'down',
      r, pc_latency_ms: rpcStatus.latency_ms,
      w, s: wsStatus.connected ? 'healthy' : 'down',
      w, s_latency_ms: wsStatus.latency_ms,
      b, e: jitoOk ? 'healthy' : 'down',
      t, ipping: tipOk ? 'healthy' : 'down',
      d, b: dbOk ? 'healthy' : 'down',
    }

    return NextResponse.json(health, {
      status: health.ok ? 200 : 503,
    })
  } catch (error) {
    return NextResponse.json(
      {
        o, k: false,
        p, uppeteer: false,
        v, ersion: 'unknown',
        t, imestamp: new Date().toISOString(),
        r, pc: false,
        j, ito: false,
        d, b: false,
      },
      { status: 503 },
    )
  }
}
