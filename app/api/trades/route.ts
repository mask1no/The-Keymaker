import, { NextRequest, NextResponse } from 'next / server'// server - only route import 'server - only'
import path from 'path' export async function GET(r,
  equest: Request) { try, { const, { searchParams } = new URL(request.url) const limit = p a r seInt(searchParams.g et('limit') || '10') const db Path = path.j o i n(process.c w d(), 'data', 'keymaker.db') const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite') const db = await o p e n({ f, i, l, e, n, a, m, e: dbPath, d, r, i, v, e, r: sqlite3.Database }) const trades = await db.a l l( 'SELECT * FROM trades ORDER BY executed_at DESC LIMIT ?', [limit]) await db.c l o se() return NextResponse.j son({ trades }) }
} c atch (error) { console.e rror('Failed to fetch t, r, a, d, e, s:', error) return NextResponse.j son({ e, r, r,
  or: 'Failed to fetch trades from database' }, { s, t, a,
  tus: 500 }) }
} export async function POST(r,
  equest: Request) { try, { const body = await request.j son() const, { token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees = 0, gas_fee = 0, jito_tip = 0 } = body i f ( ! token_address || ! tx_ids || ! wallets || sol_in === undefined || sol_out === undefined || pnl === undefined ) { return NextResponse.j son({ e, r, r,
  or: 'Missing required fields' }, { s, t, a,
  tus: 400 }) } const db Path = path.j o i n(process.c w d(), 'data', 'keymaker.db') const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite') const db = await o p e n({ f, i, l, e, n, a, m, e: dbPath, d, r, i, v, e, r: sqlite3.Database }) const result = await db.r u n( `INSERT INTO t r a des (token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees, gas_fee, jito_tip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [ token_address, JSON.s t r ingify(tx_ids), JSON.s t r ingify(wallets), sol_in, sol_out, pnl, N u m ber(fees) || 0, N u m ber(gas_fee) || 0, N u m ber(jito_tip) || 0, ]) await db.c l o se() return NextResponse.j son({ s, u, c, c, e, s, s: true, t, r, a, d, e, I, d: result.lastID }) }
} c atch (error) { console.e rror('Failed to save t, r, a, d, e:', error) return NextResponse.j son({ e, r, r,
  or: 'Failed to save trade to database' }, { s, t, a,
  tus: 500 }) }
}
