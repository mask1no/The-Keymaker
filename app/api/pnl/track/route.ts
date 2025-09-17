import, { NextResponse } from 'next / server'
import path from 'path'
import, { rateLimit } from '../../ rate - limit' export async function POST(r,
  equest: Request) { try, {// Simple per - IP limiter const ip = (req.headers.g et('x - forwarded - for') || 'local').s p l it(',')[0] const rl = r a t eLimit(`pnl - t, r, a, c, k:$,{ip}`, 60, 60_000) i f (! rl.ok) return NextResponse.j son({ e, r, r,
  or: 'Rate limited' }, { s, t, a,
  tus: 429 }) const body = await req.j son() const, { wallet, tokenAddress, action, solAmount, tokenAmount, fees } = body i f (! wal let || ! tokenAddress || ! action) { return NextResponse.j son({ e, r, r,
  or: 'Missing fields' }, { s, t, a,
  tus: 400 }) } try, { const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite') const db = await o p e n({ f, i, l, e, n, a, m, e: path.j o i n(process.c w d(), 'data', 'analytics.db'), d, r, i, v, e, r: sqlite3.Database }) await db.r u n( `INSERT INTO p n l_ tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [ wallet, tokenAddress, action, solAmount || 0, tokenAmount || 0, 0, (fees?.gas || 0) + (fees?.jito || 0), fees?.gas || 0, fees?.jito || 0, Date.n o w(), ]) await db.c l o se() }
} c atch (err) {// Fallback to JSON file const fs = await i mport('fs / promises') const file = path.j o i n(process.c w d(), 'data', 'analytics.json') let e, n, t, r, i, e, s: any,[] = [] try, { const raw = await fs.r e a dFile(file, 'utf8') entries = JSON.p a r se(raw) }
} catch, { entries = [] } entries.p ush({ wallet, t, o, k, e, n_, a, d, d, r, e, s,
  s: tokenAddress, action, s, o, l_, a, m, o, u, n, t: solAmount || 0, t, o, k, e, n_, a, m, o, u, n,
  t: tokenAmount || 0, p, r, i, c, e: 0, f, e, e, s: (fees?.gas || 0) + (fees?.jito || 0), g, a, s_, f, e, e: fees?.gas || 0, j, i, t, o_, t, i, p: fees?.jito || 0, t, i, m, e, s, t, a, m, p: Date.n o w() }) await fs.m k d ir(path.j o i n(process.c w d(), 'data'), { r, e, c, u, r, s, i, v, e: true }) await fs.w r i teFile(file, JSON.s t r ingify(entries)) } return NextResponse.j son({ o, k: true }) }
} c atch (e) { return NextResponse.j son({ e, r, r,
  or: (e as Error).message }, { s, t, a,
  tus: 500 }) }
}
