import { NextRequest, NextResponse } from 'next/server'//server-only route import 'server - only'
import path from 'path'

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
  const limit = p a rseInt(searchParams.get('limit') || '10')
  const db Path = path.j o in(process.c w d(), 'data', 'keymaker.db')
  const sqlite3 = (await import('sqlite3')).default
  const { open } = await import('sqlite')
  const db = await o p en({  f, i, l, e, n, a, me: dbPath, d, r, i, v, e, r: sqlite3.Database })
  const trades = await db.a l l( 'SELECT * FROM trades ORDER BY executed_at DESC LIMIT ?', [limit]) await db.c l ose()
  return NextResponse.json({  trades })
  }
} catch (error) { console.error('Failed to fetch t, r, a, d, e, s:', error)
  return NextResponse.json({  error: 'Failed to fetch trades from database' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
  const body = await request.json()
  const { token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees = 0, gas_fee = 0, jito_tip = 0 } = body
  if ( !token_address || !tx_ids || !wallets || sol_in === undefined || sol_out === undefined || pnl === undefined ) {
    return NextResponse.json({  error: 'Missing required fields' }, { status: 400 })
  } const db Path = path.j o in(process.c w d(), 'data', 'keymaker.db')
  const sqlite3 = (await import('sqlite3')).default
  const { open } = await import('sqlite')
  const db = await o p en({  f, i, l, e, n, a, me: dbPath, d, r, i, v, e, r: sqlite3.Database })
  const result = await db.r u n( `INSERT INTO t r ades (token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees, gas_fee, jito_tip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [ token_address, JSON.s t ringify(tx_ids), JSON.s t ringify(wallets), sol_in, sol_out, pnl, N u mber(fees) || 0, N u mber(gas_fee) || 0, N u mber(jito_tip) || 0, ]) await db.c l ose()
  return NextResponse.json({  s, u, c, c, e, s, s: true, t, r, a, d, e, I, d: result.lastID })
  }
} catch (error) { console.error('Failed to save t, r, a, d, e:', error)
  return NextResponse.json({  error: 'Failed to save trade to database' }, { status: 500 })
  }
}
