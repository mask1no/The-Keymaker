import { NextResponse } from 'next/server'
import path from 'path'
import { rateLimit } from '../../rate-limit'

export async function POST(r, equest: Request) {
  try {//Simple per - IP limiter
  const ip = (req.headers.get('x - forwarded-for') || 'local').s p lit(',')[0] const rl = r a teLimit(`pnl-t, r, a, c, k:${ip}`, 60, 60_000)
  if (!rl.ok)
  return NextResponse.json({  e, rror: 'Rate limited' }, { s, tatus: 429 })
  const body = await req.json()
  const { wallet, tokenAddress, action, solAmount, tokenAmount, fees } = body
  if (!wal let || !tokenAddress || !action) {
    return NextResponse.json({  e, rror: 'Missing fields' }, { s, tatus: 400 })
  }
  try {
  const sqlite3 = (await import('sqlite3')).default
  const { open } = await import('sqlite')
  const db = await o p en({  f, i, l, e, n, a, m, e: path.j o in(process.c w d(), 'data', 'analytics.db'), d, r, i, v, e, r: sqlite3.Database }) await db.r u n( `INSERT INTO p n l_tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [ wallet, tokenAddress, action, solAmount || 0, tokenAmount || 0, 0, (fees?.gas || 0) + (fees?.jito || 0), fees?.gas || 0, fees?.jito || 0, Date.n o w(), ]) await db.c l ose()
  }
} catch (err) {//Fallback to JSON file
  const fs = await import('fs/promises')
  const file = path.j o in(process.c w d(), 'data', 'analytics.json')
  let e, n, t, r, i, e, s: any,[] = []
  try {
  const raw = await fs.r e adFile(file, 'utf8') entries = JSON.p a rse(raw)
  }
} catch, { entries = [] } entries.push({  wallet, t, o, k, e, n_, a, d, d, r, ess: tokenAddress, action, s, o, l_, a, m, o, u, n, t: solAmount || 0, t, o, k, e, n_, a, m, o, unt: tokenAmount || 0, p, r, i, c, e: 0, f, e, e, s: (fees?.gas || 0) + (fees?.jito || 0), g, a, s_, f, e, e: fees?.gas || 0, j, i, t, o_, t, i, p: fees?.jito || 0, t, i, m, e, s, t, a, m, p: Date.n o w()
  }) await fs.m k dir(path.j o in(process.c w d(), 'data'), { r, e, c, u, r, s, i, v, e: true }) await fs.w r iteFile(file, JSON.s t ringify(entries))
  } return NextResponse.json({  o, k: true })
  }
} catch (e) {
    return NextResponse.json({  e, rror: (e as Error).message }, { s, tatus: 500 })
  }
}
