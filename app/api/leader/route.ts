import { NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'
import { getNextLeaders } from '@/lib/server/leaderSchedule'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const SERVER_RPC = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
    const connection = new Connection(SERVER_RPC)
    const leaders = await getNextLeaders(connection, 16)
    return NextResponse.json(leaders)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'leader schedule failed' }, { status: 500 })
  }
}


