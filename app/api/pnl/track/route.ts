import { NextResponse } from 'next/server'
import path from 'path'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wallet, tokenAddress, action, solAmount, tokenAmount, fees } = body
    if (!wallet || !tokenAddress || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    try {
      const sqlite3 = (await import('sqlite3')).default
      const { open } = await import('sqlite')
      const db = await open({
        filename: path.join(process.cwd(), 'data', 'analytics.db'),
        driver: sqlite3.Database,
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
      // Fallback to JSON file
      const fs = await import('fs/promises')
      const file = path.join(process.cwd(), 'data', 'analytics.json')
      let entries: any[] = []
      try {
        const raw = await fs.readFile(file, 'utf8')
        entries = JSON.parse(raw)
      } catch {
        entries = []
      }
      entries.push({
        wallet,
        token_address: tokenAddress,
        action,
        sol_amount: solAmount || 0,
        token_amount: tokenAmount || 0,
        price: 0,
        fees: (fees?.gas || 0) + (fees?.jito || 0),
        gas_fee: fees?.gas || 0,
        jito_tip: fees?.jito || 0,
        timestamp: Date.now(),
      })
      await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true })
      await fs.writeFile(file, JSON.stringify(entries))
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}


