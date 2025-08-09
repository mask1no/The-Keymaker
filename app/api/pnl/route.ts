import { NextResponse } from 'next/server'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    let entries: any[] = []
    try {
      // Primary path: sqlite
      const sqlite3 = (await import('sqlite3')).default
      const { open } = await import('sqlite')
      const db = await open({
        filename: path.join(process.cwd(), 'data', 'analytics.db'),
        driver: sqlite3.Database,
      })

      await db.exec(`
        CREATE TABLE IF NOT EXISTS pnl_tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet TEXT NOT NULL,
          token_address TEXT NOT NULL,
          action TEXT NOT NULL,
          sol_amount REAL NOT NULL,
          token_amount REAL NOT NULL,
          price REAL NOT NULL,
          fees REAL DEFAULT 0,
          gas_fee REAL DEFAULT 0,
          jito_tip REAL DEFAULT 0,
          timestamp INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      entries = await db.all<any[]>(`SELECT * FROM pnl_tracking`)
      await db.close()
    } catch (err) {
      // Fallback: JSON file storage for dev environments without sqlite bindings
      const fs = await import('fs/promises')
      const file = path.join(process.cwd(), 'data', 'analytics.json')
      try {
        const raw = await fs.readFile(file, 'utf8')
        entries = JSON.parse(raw)
      } catch {
        entries = []
      }
    }

    const walletsSet = new Set(entries.map((e) => e.wallet))
    const wallets = Array.from(walletsSet)

    const walletSummaries = wallets.map((wallet) => {
      const we = entries.filter((e) => e.wallet === wallet)
      let totalInvested = 0
      let totalReturned = 0
      let totalGasFees = 0
      let totalJitoTips = 0
      for (const e of we) {
        if (e.action === 'buy') totalInvested += e.sol_amount
        else totalReturned += e.sol_amount
        totalGasFees += e.gas_fee || (e.fees || 0) * 0.5
        totalJitoTips += e.jito_tip || (e.fees || 0) * 0.5
      }
      const totalFees = totalGasFees + totalJitoTips
      const totalCost = totalInvested + totalFees
      const netPnL = totalReturned - totalCost
      const pnlPercentage = totalCost > 0 ? (netPnL / totalCost) * 100 : 0
      return {
        wallet,
        totalInvested: totalCost,
        totalReturned,
        netPnL,
        pnlPercentage,
        trades: we.length,
        totalGasFees,
        totalJitoTips,
      }
    })

    const entries24h = entries.filter((e) => e.timestamp > dayAgo)
    const map = new Map<string, { invested: number; returned: number }>()
    for (const e of entries24h) {
      const cur = map.get(e.wallet) || { invested: 0, returned: 0 }
      if (e.action === 'buy') cur.invested += e.sol_amount
      else cur.returned += e.sol_amount
      map.set(e.wallet, cur)
    }
    let totalPnL = 0
    let totalInvested = 0
    let totalVolume = 0
    let profitableWallets = 0
    for (const v of map.values()) {
      const pnl = v.returned - v.invested
      totalPnL += pnl
      totalInvested += v.invested
      totalVolume += v.invested + v.returned
      if (pnl > 0) profitableWallets++
    }
    const pnlPercentage =
      totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

    return NextResponse.json({
      wallets: walletSummaries,
      session: {
        totalPnL,
        pnlPercentage,
        totalVolume,
        profitableWallets,
        totalWallets: map.size,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
