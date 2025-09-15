import { NextResponse } from 'next/server'
import { VersionedTransaction, Connection } from '@solana/web3.js'
import { getServerRpc } from '@/lib/server/rpc'
import {
  sendBundle,
  getBundleStatuses,
  validateTipAccount,
} from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic'
type SubmitBody = {
  region?: string
  txs_b64: string[]
  simulateOnly?: boolean
  mode?: 'regular' | 'instant' | 'delayed'
  delay_seconds?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmitBody
    const region = (body.region || 'ffm').toLowerCase()
    const simulateOnly = !!body.simulateOnly
    const mode = body.mode || 'regular'
    const delaySec = Math.max(0, Math.min(120, Number(body.delay_seconds || 0)))

    const txs_b64 = Array.isArray(body.txs_b64) ? body.txs_b64 : []
    if (txs_b64.length < 1 || txs_b64.length > 5)
      return NextResponse.json(
        { error: 'txs_b64 must contain 1..5 base64 v0 transactions' },
        { status: 400 },
      )

    const decoded = txs_b64.map((b64) =>
      VersionedTransaction.deserialize(Buffer.from(b64, 'base64')),
    )
    if (!validateTipAccount(decoded[decoded.length - 1]))
      return NextResponse.json(
        { error: 'Tip account must be in static keys of the last tx (no ALT)' },
        { status: 400 },
      )

    const connection = new Connection(getServerRpc(), 'confirmed')

    if (simulateOnly) {
      for (let i = 0; i < decoded.length; i++) {
        const sim = await connection.simulateTransaction(decoded[i], {
          sigVerify: false,
        })
        if (sim.value.err)
          return NextResponse.json(
            {
              error: `Simulation failed @${i}: ${JSON.stringify(sim.value.err)}`,
            },
            { status: 400 },
          )
      }
      const slot = await connection.getSlot('processed')
      return NextResponse.json({ ok: true, slot })
    }

    if (mode === 'delayed' && delaySec > 0)
      await new Promise((r) =>
        setTimeout(r, Math.min(120_000, delaySec * 1000)),
      )

    const bundleId = await sendBundle(region, txs_b64)

    let landedSlot: number | null = null
    for (let i = 0; i < 20; i++) {
      const st = await getBundleStatuses(region, [bundleId])
      const v = st?.[0]
      const s = String(v?.status || 'pending').toLowerCase()
      if (s === 'landed') {
        landedSlot = v?.landed_slot ?? null
        break
      }
      if (s === 'failed' || s === 'invalid') break
      await new Promise((r) => setTimeout(r, 1200))
    }

    const signatures = decoded
      .map((v) => v.signatures?.[0]?.toString() || null)
      .filter(Boolean)
    return NextResponse.json({
      bundle_id: bundleId,
      signatures,
      slot: landedSlot,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Bundle submit failed' },
      { status: 500 },
    )
  }
}
