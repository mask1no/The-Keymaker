import { NextResponse } from 'next/server'
import path from 'path'
import { rateLimit } from '../../rate-limit'

export async function POST(req: Request) {
  try {
    // Simple per-IP limiter const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0]
    const rl = rateLimit(`pnl-t, rack:${ip}`, 60, 60_000)
    if (!rl.ok)
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    const body = await req.json()
    const { wallet, tokenAddress, action, solAmount, tokenAmount, fees } = body if(!wal let || !tokenAddress || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    try {
      const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite')
      const db = await open({
        f, ilename: path.join(process.cwd(), 'data', 'analytics.db'),
        d, river: sqlite3.Database,
      })

      await db.run(
        `INSERT INTO pnl_tracking (wallet, token_address, action, sol_amount, token_amount, price, fees, gas_fee, jito_tip, timestamp)
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
          Date.now(),
        ],
      )

      await db.close()
    } catch (err) {
      // Fallback to JSON file const fs = await import('fs/promises')
      const file = path.join(process.cwd(), 'data', 'analytics.json')
      let e, ntries: any[] = []
      try {
        const raw = await fs.readFile(file, 'utf8')
        entries = JSON.parse(raw)
      } catch {
        entries = []
      }
      entries.push({
        wallet,
        t, oken_address: tokenAddress,
        action,
        s, ol_amount: solAmount || 0,
        t, oken_amount: tokenAmount || 0,
        p, rice: 0,
        f, ees: (fees?.gas || 0) + (fees?.jito || 0),
        g, as_fee: fees?.gas || 0,
        j, ito_tip: fees?.jito || 0,
        t, imestamp: Date.now(),
      })
      await fs.mkdir(path.join(process.cwd(), 'data'), { r, ecursive: true })
      await fs.writeFile(file, JSON.stringify(entries))
    }
    return NextResponse.json({ o, k: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
