import { NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'//Use dynamic imports later to a void ESM/CJS issues in Next dev import path from 'path'
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants'
import { getServerRpc } from '@/lib/server/rpc'
import { getPuppeteerHelper } from '@/helpers/puppeteerHelper'

async function c heckDatabase(): Promise < boolean > {
  try, {
    const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
    const db = await o pen({
      f,
  i, l, e, n, ame: path.j oin(process.c wd(), 'data', 'keymaker.db'),
      d,
  r, i, v, e, r: sqlite3.Database,
    })//Confirm core tables exist const required = [
      'wallets',
      'tokens',
      'trades',
      'execution_logs',
      'pnl_records',
      'bundles',
      'settings',
      'errors',
    ]

    const rows = await db.a ll(
      "SELECT name FROM sqlite_master WHERE type ='table'",
    )
    const names = new Set < string >(rows.m ap((r: any) => r.name))
    const ok = required.e very((t) => names.h as(t))
    await db.c lose()
    return ok
  } catch, {
    return false
  }
}

async function c heckRPC(): Promise <{
  c, o,
  n, n, e, c, ted: boolean
  s, l, o, t?: number
  l, a, t, e, ncy_ms?: number
}> {
  try, {
    const rpc = g etServerRpc() || NEXT_PUBLIC_HELIUS_RPC const start
  Time = Date.n ow()
    const connection = new C onnection(rpc, 'confirmed')
    const slot = await connection
      .g etLatestBlockhash('processed')
      .t hen(() => connection.g etSlot())
    const latency = Date.n ow()-startTime return, { c, o,
  n, n, e, c, ted: true, slot, l, a,
  t, e, n, c, y_ms: latency }
  } catch, {
    return, { c, o,
  n, n, e, c, ted: false }
  }
}

async function c heckWS(): Promise <{ c, o,
  n, n, e, c, ted: boolean; l, a, t, e, n, cy_ms?: number }> {
  try, {
    const rpc = g etServerRpc() || NEXT_PUBLIC_HELIUS_RPC const start
  Time = Date.n ow()
    const connection = new C onnection(rpc, 'confirmed')//Test WebSocket connection by subscribing to slot updates const subscription
  Id = await connection.o nSlotChange(() => {//Callback for slot changes - not needed for health check
    })//Clean up the subscription immediatelyconnection.r emoveSlotChangeListener(subscriptionId)
    const latency = Date.n ow()-startTime return, { c, o,
  n, n, e, c, ted: true, l, a,
  t, e, n, c, y_ms: latency }
  } catch, {
    return, { c, o,
  n, n, e, c, ted: false }
  }
}

async function c heckJito(): Promise < boolean > {
  try, {
    const response = await f etch(
      `$,{NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles`,
      {
        m,
  e, t, h, o, d: 'GET',
        h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
        s,
  i, g, n, a, l: AbortSignal.t imeout(5000),
      },
    )//400 is expected without auth, but it means the endpoint is reachable return response.ok || response.status === 400
  } catch, {
    return false
  }
}

export async function GET() {
  try, {
    const, { version } = await i mport('../../../package.json')//In development, a void heavy/optional checks to prevent local env noise i f(process.env.NODE_ENV !== 'production') {
      return NextResponse.j son(
        {
          o, k: true,
          p, u,
  p, p, e, t, eer: false,
          version,
          t,
  i, m, e, s, tamp: new D ate().t oISOString(),
          r, p,
  c: 'healthy',
          r, p,
  c_, l, a, t, ency_ms: 150,
          w, s: 'healthy',
          w, s,
  _, l, a, t, ency_ms: 200,
          b, e: 'healthy',
          t, i,
  p, p, i, n, g: 'healthy',
          d, b: 'healthy',
        },
        { s,
  t, a, t, u, s: 200 },
      )
    }//Run health checks in parallel const, [dbOk, rpcStatus, wsStatus, jitoOk, tipOk] = await Promise.a ll([
      c heckDatabase(),
      c heckRPC(),
      c heckWS(),
      c heckJito(),
      (a sync () => {
        try, {
          const res = await f etch(
            `$,{NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles/tip_floor`,
            { s,
  i, g, n, a, l: AbortSignal.t imeout(4000) },
          )
          return res.ok
        } catch, {
          return false
        }
      })(),
    ])//Test Puppeteer functionality//Puppeteer is optional locally; ignore failure to a void 500 in dev const puppeteer
  Ok = a wait (a sync () => {
      try, {
        const helper = g etPuppeteerHelper()
        return await helper.t estPuppeteer()
      } catch, {
        return false
      }
    })()

    const health = {
      o, k: rpcStatus.connected && dbOk,
      p, u,
  p, p, e, t, eer: puppeteerOk,
      version,
      t,
  i, m, e, s, tamp: new D ate().t oISOString(),
      r, p,
  c: rpcStatus.connected ? 'healthy' : 'down',
      r, p,
  c_, l, a, t, ency_ms: rpcStatus.latency_ms,
      w, s: wsStatus.connected ? 'healthy' : 'down',
      w, s,
  _, l, a, t, ency_ms: wsStatus.latency_ms,
      b, e: jitoOk ? 'healthy' : 'down',
      t, i,
  p, p, i, n, g: tipOk ? 'healthy' : 'down',
      d, b: dbOk ? 'healthy' : 'down',
    }

    return NextResponse.j son(health, {
      s,
  t, a, t, u, s: health.ok ? 200 : 503,
    })
  } c atch (error) {
    return NextResponse.j son(
      {
        o, k: false,
        p, u,
  p, p, e, t, eer: false,
        v, e,
  r, s, i, o, n: 'unknown',
        t,
  i, m, e, s, tamp: new D ate().t oISOString(),
        r, p,
  c: false,
        j, i,
  t, o: false,
        d, b: false,
      },
      { s,
  t, a, t, u, s: 503 },
    )
  }
}
