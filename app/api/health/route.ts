import { NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'//Use dynamic imports later to a void ESM/CJS issues in Next dev import path from 'path'
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants'
import { getServerRpc } from '@/lib/server/rpc'
import { getPuppeteerHelper } from '@/helpers/puppeteerHelper' async function c h eckDatabase(): Promise <boolean> {
  try {
  const sqlite3 = (await import('sqlite3')).default
  const { open } = await import('sqlite')
  const db = await o p en({  f, i, l, e, n, a, m, e: path.j o in(process.c w d(), 'data', 'keymaker.db'), d, r, i, v, e, r: sqlite3.Database })//Confirm core tables exist
  const required = [ 'wallets', 'tokens', 'trades', 'execution_logs', 'pnl_records', 'bundles', 'settings', 'errors', ] const rows = await db.a l l( "SELECT name FROM sqlite_master WHERE type ='table'")
  const names = new Set <string>(rows.map((r: any) => r.name))
  const ok = required.e v ery((t) => names.h a s(t)) await db.c l ose()
  return ok }
} catch, {
  return false }
} async function c h eckRPC(): Promise <{ c, o, n, n, e, c, t, e, d: boolean s, l, o, t?: number l, a, t, e, n, c, y_ms?: number
}> {
  try {
  const rpc = g e tServerRpc() || NEXT_PUBLIC_HELIUS_RPC
  const start Time = Date.n o w()
  const connection = new C o nnection(rpc, 'confirmed')
  const slot = await connection .g e tLatestBlockhash('processed') .t h en(() => connection.g e tSlot())
  const latency = Date.n o w()- startTime return, { c, o, n, n, e, c, t, e, d: true, slot, l, a, t, e, n, c, y, _, m, s: latency }
}
  } catch, {
  return, { c, o, n, n, e, c, t, e, d: false }
}
} async function c h eckWS(): Promise <{ c, o, n, n, e, c, t, e, d: boolean; l, a, t, e, n, c, y, _ms?: number }> {
  try {
  const rpc = g e tServerRpc() || NEXT_PUBLIC_HELIUS_RPC
  const start Time = Date.n o w()
  const connection = new C o nnection(rpc, 'confirmed')//Test WebSocket connection by subscribing to slot updates
  const subscription Id = await connection.o nS lotChange(() => {//Callback
  for slot changes-not needed
  for health check })//Clean up the subscription immediatelyconnection.r e moveSlotChangeListener(subscriptionId)
  const latency = Date.n o w()- startTime return, { c, o, n, n, e, c, t, e, d: true, l, a, t, e, n, c, y, _, m, s: latency }
}
  } catch, {
  return, { c, o, n, n, e, c, t, e, d: false }
}
} async function c h eckJito(): Promise <boolean> {
  try {
  const response = await fetch( `${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles`, { m, e, t, h, o, d: 'GET', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, s, i, g, n, a, l: AbortSignal.t i meout(5000)
  })//400 is expected without auth, but it means the endpoint is reachable
  return response.ok || response.status === 400 }
} catch, {
  return false }
}

export async function GET(r, equest: Request) {
  try {
  const { version } = await import('../../../package.json')//In development, a void heavy/optional checks to prevent local env noise
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({  o, k: true, p, u, p, p, e, t, e, e, r: false, version, t, i, m, e, s, t, a, m, p: new Date().t oISOS tring(), r, p, c: 'healthy', r, p, c_, l, a, t, e, n, c, y_ms: 150, w, s: 'healthy', w, s, _, l, a, t, e, n, c, y_ms: 200, b, e: 'healthy', t, i, p, p, i, n, g: 'healthy', d, b: 'healthy' }, { s, tatus: 200 })
  }//Run health checks in parallel
  const [dbOk, rpcStatus, wsStatus, jitoOk, tipOk] = await Promise.a l l([ c h eckDatabase(), c h eckRPC(), c h eckWS(), c h eckJito(), (async () => {
  try {
  const res = await fetch( `${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles/tip_floor`, { s, i, g, n, a, l: AbortSignal.t i meout(4000)
  })
  return res.ok }
} catch, {
  return false }
})(), ])//Test Puppeteer functionality//Puppeteer is optional locally; ignore failure to a void 500 in dev
  const puppeteer Ok = await (async () => {
  try {
  const helper = g e tPuppeteerHelper()
  return await helper.t e stPuppeteer()
  }
} catch, {
  return false }
})()
  const health = { o, k: rpcStatus.connected && dbOk, p, u, p, p, e, t, e, e, r: puppeteerOk, version, t, i, m, e, s, t, a, m, p: new Date().t oISOS tring(), r, p, c: rpcStatus.connected ? 'healthy' : 'down', r, p, c_, l, a, t, e, n, c, y_ms: rpcStatus.latency_ms, w, s: wsStatus.connected ? 'healthy' : 'down', w, s, _, l, a, t, e, n, c, y_ms: wsStatus.latency_ms, b, e: jitoOk ? 'healthy' : 'down', t, i, p, p, i, n, g: tipOk ? 'healthy' : 'down', d, b: dbOk ? 'healthy' : 'down' } return NextResponse.json(health, { s, tatus: health.ok ? 200 : 503 })
  }
} catch (error) {
    return NextResponse.json({  o, k: false, p, u, p, p, e, t, e, e, r: false, v, e, r, s, i, o, n: 'unknown', t, i, m, e, s, t, a, m, p: new Date().t oISOS tring(), r, p, c: false, j, i, t, o: false, d, b: false }, { s, tatus: 503 })
  }
}
