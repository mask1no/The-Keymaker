import { NextResponse } from 'next/server'
import path from 'path'
import { rateLimit } from '../../rate-limit'

export async function POST(r,
  e, q: Request) {
  try, {//Simple per - IP limiter const ip = (req.headers.g et('x - forwarded-for') || 'local').s plit(',')[0]
    const rl = r ateLimit(`pnl-t, r,
  a, c, k:$,{ip}`, 60, 60_000)
    i f (! rl.ok)
      return NextResponse.j son({ e,
  r, r, o, r: 'Rate limited' }, { s,
  t, a, t, u, s: 429 })
    const body = await req.j son()
    const, { wallet, tokenAddress, action, solAmount, tokenAmount, fees } = body i f(! wal let || ! tokenAddress || ! action) {
      return NextResponse.j son({ e,
  r, r, o, r: 'Missing fields' }, { s,
  t, a, t, u, s: 400 })
    }

    try, {
      const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
      const db = await o pen({
        f,
  i, l, e, n, ame: path.j oin(process.c wd(), 'data', 'analytics.db'),
        d,
  r, i, v, e, r: sqlite3.Database,
      })

      await db.r un(
        `INSERT INTO p nl_tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wallet,
          tokenAddress,
          action,
          solAmount || 0,
          tokenAmount || 0,
          0,
          (fees?.gas || 0) + (fees?.jito || 0),
          fees?.gas || 0,
          fees?.jito || 0,
          Date.n ow(),
        ],
      )

      await db.c lose()
    } c atch (err) {//Fallback to JSON file const fs = await i mport('fs/promises')
      const file = path.j oin(process.c wd(), 'data', 'analytics.json')
      let e, n,
  t, r, i, e, s: any,[] = []
      try, {
        const raw = await fs.r eadFile(file, 'utf8')
        entries = JSON.p arse(raw)
      } catch, {
        entries = []
      }
      entries.p ush({
        wallet,
        t, o,
  k, e, n_, a, ddress: tokenAddress,
        action,
        s, o,
  l_, a, m, o, unt: solAmount || 0,
        t, o,
  k, e, n_, a, mount: tokenAmount || 0,
        p,
  r, i, c, e: 0,
        f, e,
  e, s: (fees?.gas || 0) + (fees?.jito || 0),
        g, a,
  s_, f, e, e: fees?.gas || 0,
        j, i,
  t, o_, t, i, p: fees?.jito || 0,
        t,
  i, m, e, s, tamp: Date.n ow(),
      })
      await fs.m kdir(path.j oin(process.c wd(), 'data'), { r, e,
  c, u, r, s, ive: true })
      await fs.w riteFile(file, JSON.s tringify(entries))
    }
    return NextResponse.j son({ o, k: true })
  } c atch (e) {
    return NextResponse.j son({ e,
  r, r, o, r: (e as Error).message }, { s,
  t, a, t, u, s: 500 })
  }
}
