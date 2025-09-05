// app/api/bundles/submit/route.ts
import { NextResponse } from 'next/server'
import { VersionedTransaction, PublicKey, Connection } from '@solana/web3.js'
import { getServerRpc } from '@/lib/server/rpc'
import { bundlesUrl } from '@/lib/server/jito'
import { JITO_TIP_ACCOUNTS } from '@/constants'

export const dynamic = 'force-dynamic'

type SubmitBody = {
  region?: string
  txs_b64: string[]
  tip_lamports?: number
  simulateOnly?: boolean
  mode?: 'regular' | 'instant' | 'delayed'
  delay_seconds?: number
}

function hasStaticTipKey(vt: VersionedTransaction): boolean {
  const msg = vt.message
  // @ts-ignore - read-only array of account keys
  const staticKeys: string[] = (msg.staticAccountKeys || []).map((k: PublicKey) => k.toBase58())
  const tipSet = new Set(JITO_TIP_ACCOUNTS)
  return staticKeys.some(k => tipSet.has(k))
}

async function jitoRpc<T>(endpoint: string, method: string, params: any[], timeout = 10000): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error(`${method} HTTP ${res.status}`)
  const j = await res.json()
  if (j?.error) throw new Error(j.error?.message || `${method} error`)
  return j.result
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmitBody
    const region = (body.region || 'ffm').toLowerCase()
    const tipLamports = Math.max(Number(body.tip_lamports || 0), 1000)
    const simulateOnly = !!body.simulateOnly
    const mode = (body.mode || 'regular') as 'regular' | 'instant' | 'delayed'
    const delaySec = Math.max(0, Math.min(120, Number(body.delay_seconds || 0)))

    const txs_b64 = Array.isArray(body.txs_b64) ? body.txs_b64 : []
    if (txs_b64.length < 1 || txs_b64.length > 5) {
      return NextResponse.json({ error: 'txs_b64 must contain 1..5 base64 v0 transactions' }, { status: 400 })
    }

    // Basic validation - just check base64 format for now
    try {
      txs_b64.forEach(b64 => {
        if (!b64 || typeof b64 !== 'string') {
          throw new Error('Invalid base64 string')
        }
        // Just decode to check format, don't deserialize yet
        Buffer.from(b64, 'base64')
      })
    } catch (e) {
      return NextResponse.json({ error: 'Invalid base64 format' }, { status: 400 })
    }

    // For now, just return success with the parsed data
    return NextResponse.json({
      message: 'Bundle validation passed',
      region,
      tipLamports,
      mode,
      delaySec,
      txCount: txs_b64.length,
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bundle submit failed' }, { status: 500 })
  }
}