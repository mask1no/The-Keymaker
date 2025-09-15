import { NextRequest, NextResponse } from 'next/server'
// server-only routeimport 'server-only'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
    const sqlite3 = (await import('sqlite3')).defaultconst { open } = await import('sqlite')
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    const trades = await db.all(
      'SELECT * FROM trades ORDER BY executed_at DESC LIMIT ?',
      [limit],
    )

    await db.close()

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Failed to fetch trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades from database' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      token_address,
      tx_ids,
      wallets,
      sol_in,
      sol_out,
      pnl,
      fees = 0,
      gas_fee = 0,
      jito_tip = 0,
    } = bodyif (
      !token_address ||
      !tx_ids ||
      !wallets ||
      sol_in === undefined ||
      sol_out === undefined ||
      pnl === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
    const sqlite3 = (await import('sqlite3')).defaultconst { open } = await import('sqlite')
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    const result = await db.run(
      `INSERT INTO trades (token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees, gas_fee, jito_tip) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        token_address,
        JSON.stringify(tx_ids),
        JSON.stringify(wallets),
        sol_in,
        sol_out,
        pnl,
        Number(fees) || 0,
        Number(gas_fee) || 0,
        Number(jito_tip) || 0,
      ],
    )

    await db.close()

    return NextResponse.json({
      success: true,
      tradeId: result.lastID,
    })
  } catch (error) {
    console.error('Failed to save trade:', error)
    return NextResponse.json(
      { error: 'Failed to save trade to database' },
      { status: 500 },
    )
  }
}
