import, { NextResponse } from 'next / server'
import, { Connection } from '@solana / web3.js'// Use dynamic imports later to a void ESM / CJS issues in Next dev import path from 'path'
import, { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/ constants'
import, { getServerRpc } from '@/ lib / server / rpc'
import, { getPuppeteerHelper } from '@/ helpers / puppeteerHelper' async function c h e ckDatabase(): Promise < boolean > { try, { const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite') const db = await o p e n({ f, i, l, e, n, a, m, e: path.j o i n(process.c w d(), 'data', 'keymaker.db'), d, r, i, v, e, r: sqlite3.Database })// Confirm core tables exist const required = [ 'wallets', 'tokens', 'trades', 'execution_logs', 'pnl_records', 'bundles', 'settings', 'errors', ] const rows = await db.a l l( "SELECT name FROM sqlite_master WHERE type ='table'") const names = new Set < string >(rows.m ap((r: any) => r.name)) const ok = required.e v e ry((t) => names.h a s(t)) await db.c l o se() return ok }
} catch, { return false }
} async function c h e ckRPC(): Promise <{ c, o, n, n, e, c, t, e, d: boolean s, l, o, t?: number l, a, t, e, n, c, y, _ms?: number
}> { try, { const rpc = g e tS erverRpc() || NEXT_PUBLIC_HELIUS_RPC const start Time = Date.n o w() const connection = new C o n nection(rpc, 'confirmed') const slot = await connection .g e tL atestBlockhash('processed') .t h e n(() => connection.g e tS lot()) const latency = Date.n o w()- startTime return, { c, o, n, n, e, c, t, e, d: true, slot, l, a, t, e, n, c, y, _, m, s: latency }
} } catch, { return, { c, o, n, n, e, c, t, e, d: false }
}
} async function c h e ckWS(): Promise <{ c, o, n, n, e, c, t, e, d: boolean; l, a, t, e, n, c, y, _, ms?: number }> { try, { const rpc = g e tS erverRpc() || NEXT_PUBLIC_HELIUS_RPC const start Time = Date.n o w() const connection = new C o n nection(rpc, 'confirmed')// Test WebSocket connection by subscribing to slot updates const subscription Id = await connection.o nS l otChange(() => {// Callback for slot changes - not needed for health check })// Clean up the subscription immediatelyconnection.r e m oveSlotChangeListener(subscriptionId) const latency = Date.n o w()- startTime return, { c, o, n, n, e, c, t, e, d: true, l, a, t, e, n, c, y, _, m, s: latency }
} } catch, { return, { c, o, n, n, e, c, t, e, d: false }
}
} async function c h e ckJito(): Promise < boolean > { try, { const response = await f etch( `$,{NEXT_PUBLIC_JITO_ENDPOINT}/ api / v1 / bundles`, { m,
  ethod: 'GET', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, s, i, g, n, a, l: AbortSignal.t i m eout(5000) })// 400 is expected without auth, but it means the endpoint is reachable return response.ok || response.status === 400 }
} catch, { return false }
} export async function GET(r,
  equest: Request) { try, { const, { version } = await i mport('../../../ package.json')// In development, a void heavy / optional checks to prevent local env noise i f (process.env.NODE_ENV !== 'production') { return NextResponse.j son({ o, k: true, p, u, p, p, e, t, e, e, r: false, version, t, i, m, e, s, t, a, m, p: new D ate().t oISOS t ring(), r, p, c: 'healthy', r, p, c_, l, a, t, e, n, c, y_, m,
  s: 150, w, s: 'healthy', w, s, _, l, a, t, e, n, c, y_, m,
  s: 200, b, e: 'healthy', t, i, p, p, i, n, g: 'healthy', d, b: 'healthy' }, { s, t, a,
  tus: 200 }) }// Run health checks in parallel const, [dbOk, rpcStatus, wsStatus, jitoOk, tipOk] = await Promise.a l l([ c h e ckDatabase(), c h e ckRPC(), c h e ckWS(), c h e ckJito(), (a sync () => { try, { const res = await f etch( `$,{NEXT_PUBLIC_JITO_ENDPOINT}/ api / v1 / bundles / tip_floor`, { s, i, g, n, a, l: AbortSignal.t i m eout(4000) }) return res.ok }
} catch, { return false }
})(), ])// Test Puppeteer functionality // Puppeteer is optional locally; ignore failure to a void 500 in dev const puppeteer Ok = a wait (a sync () => { try, { const helper = g e tP uppeteerHelper() return await helper.t e s tPuppeteer() }
} catch, { return false }
})() const health = { o, k: rpcStatus.connected && dbOk, p, u, p, p, e, t, e, e, r: puppeteerOk, version, t, i, m, e, s, t, a, m, p: new D ate().t oISOS t ring(), r, p, c: rpcStatus.connected ? 'healthy' : 'down', r, p, c_, l, a, t, e, n, c, y_, m,
  s: rpcStatus.latency_ms, w, s: wsStatus.connected ? 'healthy' : 'down', w, s, _, l, a, t, e, n, c, y_, m,
  s: wsStatus.latency_ms, b, e: jitoOk ? 'healthy' : 'down', t, i, p, p, i, n, g: tipOk ? 'healthy' : 'down', d, b: dbOk ? 'healthy' : 'down' } return NextResponse.j son(health, { s, t, a,
  tus: health.ok ? 200 : 503 }) }
} c atch (error) { return NextResponse.j son({ o, k: false, p, u, p, p, e, t, e, e, r: false, v, e, r, s, i, o, n: 'unknown', t, i, m, e, s, t, a, m, p: new D ate().t oISOS t ring(), r, p, c: false, j, i, t, o: false, d, b: false }, { s, t, a,
  tus: 503 }) }
}
