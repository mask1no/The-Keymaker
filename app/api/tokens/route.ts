import { NextRequest, NextResponse } from 'next/server'
import 'server-only'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      address,
      name,
      symbol,
      supply,
      decimals,
      launch_platform,
      metadata,
    } = body

    if (
      !address ||
      !name ||
      !symbol ||
      !supply ||
      !decimals ||
      !launch_platform
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    await db.run(
      `INSERT INTO tokens (address, name, symbol, supply, decimals, launch_platform, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        address,
        name,
        symbol,
        supply,
        decimals,
        launch_platform,
        metadata ? JSON.stringify(metadata) : null,
      ],
    )

    await db.close()

    return NextResponse.json({ success: true, tokenAddress: address })
  } catch (error) {
    console.error('Failed to save token:', error)
    return NextResponse.json(
      { error: 'Failed to save token to database' },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    const tokens = await db.all('SELECT * FROM tokens ORDER BY id DESC')
    await db.close()

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Failed to fetch tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens from database' },
      { status: 500 },
    )
  }
}
