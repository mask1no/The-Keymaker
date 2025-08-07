import { NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants'
import { getPuppeteerHelper } from '@/helpers/puppeteerHelper'

async function checkDatabase(): Promise<boolean> {
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'analytics.db'),
      driver: sqlite3.Database,
    })

    // Check if tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master WHERE type='table'
    `)

    await db.close()
    return tables.length > 0
  } catch {
    return false
  }
}

async function checkRPC(): Promise<{ connected: boolean; slot?: number }> {
  try {
    const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')
    const slot = await connection.getSlot()
    return { connected: true, slot }
  } catch {
    return { connected: false }
  }
}

async function checkJito(): Promise<boolean> {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      },
    )

    // 400 is expected without auth, but it means the endpoint is reachable
    return response.ok || response.status === 400
  } catch {
    return false
  }
}

export async function GET() {

  try {
    // Run health checks in parallel
    const [dbOk, rpcStatus, jitoOk] = await Promise.all([
      checkDatabase(),
      checkRPC(),
      checkJito(),
    ])

    // Timing intentionally omitted from response shape per spec

    // Test Puppeteer functionality
    const puppeteerOk = await (async () => {
      try {
        const helper = getPuppeteerHelper()
        return await helper.testPuppeteer()
      } catch {
        return false
      }
    })()

    const health = {
      ok: true,
      puppeteer: puppeteerOk,
      version: '1.4.0',
      timestamp: new Date().toISOString(),
      rpc: rpcStatus.connected,
      jito: jitoOk,
      db: dbOk,
    }

    return NextResponse.json(health, {
      status: health.ok ? 200 : 503,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        puppeteer: false,
        version: '1.4.0',
        timestamp: new Date().toISOString(),
        rpc: false,
        jito: false,
        db: false,
      },
      { status: 503 },
    )
  }
}
