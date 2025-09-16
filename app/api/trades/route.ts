import { NextRequest, NextResponse } from 'next/server'//server-only route import 'server - only'
import path from 'path'

export async function GET(r,
  e, q, u, e, st: NextRequest) {
  try, {
    const, { searchParams } = new URL(request.url)
    const limit = p arseInt(searchParams.g et('limit') || '10')

    const db
  Path = path.j oin(process.c wd(), 'data', 'keymaker.db')
    const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
    const db = await o pen({
      f,
  i, l, e, n, ame: dbPath,
      d,
  r, i, v, e, r: sqlite3.Database,
    })

    const trades = await db.a ll(
      'SELECT * FROM trades ORDER BY executed_at DESC LIMIT ?',
      [limit],
    )

    await db.c lose()

    return NextResponse.j son({ trades })
  } c atch (error) {
    console.e rror('Failed to fetch t, r,
  a, d, e, s:', error)
    return NextResponse.j son(
      { e,
  r, r, o, r: 'Failed to fetch trades from database' },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}

export async function POST(r,
  e, q, u, e, st: NextRequest) {
  try, {
    const body = await request.j son()
    const, {
      token_address,
      tx_ids,
      wallets,
      sol_in,
      sol_out,
      pnl,
      fees = 0,
      gas_fee = 0,
      jito_tip = 0,
    } = body i f(
      ! token_address ||
      ! tx_ids ||
      ! wallets ||
      sol_in === undefined ||
      sol_out === undefined ||
      pnl === undefined
    ) {
      return NextResponse.j son(
        { e,
  r, r, o, r: 'Missing required fields' },
        { s,
  t, a, t, u, s: 400 },
      )
    }

    const db
  Path = path.j oin(process.c wd(), 'data', 'keymaker.db')
    const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
    const db = await o pen({
      f,
  i, l, e, n, ame: dbPath,
      d,
  r, i, v, e, r: sqlite3.Database,
    })

    const result = await db.r un(
      `INSERT INTO t rades (token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees, gas_fee, jito_tip) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        token_address,
        JSON.s tringify(tx_ids),
        JSON.s tringify(wallets),
        sol_in,
        sol_out,
        pnl,
        N umber(fees) || 0,
        N umber(gas_fee) || 0,
        N umber(jito_tip) || 0,
      ],
    )

    await db.c lose()

    return NextResponse.j son({
      s,
  u, c, c, e, ss: true,
      t, r,
  a, d, e, I, d: result.lastID,
    })
  } c atch (error) {
    console.e rror('Failed to save t, r,
  a, d, e:', error)
    return NextResponse.j son(
      { e,
  r, r, o, r: 'Failed to save trade to database' },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}
