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
    const simulateOnly = !!body.simulateOnly
    const mode = (body.mode || 'regular') as 'regular' | 'instant' | 'delayed'
    const delaySec = Math.max(0, Math.min(120, Number(body.delay_seconds || 0)))

    const txs_b64 = Array.isArray(body.txs_b64) ? body.txs_b64 : []
    if (txs_b64.length < 1 || txs_b64.length > 5) {
      return NextResponse.json({ error: 'txs_b64 must contain 1..5 base64 v0 transactions' }, { status: 400 })
    }

    const decoded: VersionedTransaction[] = txs_b64.map(b64 => VersionedTransaction.deserialize(Buffer.from(b64, 'base64')))
    if (!hasStaticTipKey(decoded[decoded.length - 1])) {
      return NextResponse.json({ error: 'Tip account must be in static keys of the last tx (no ALT)' }, { status: 400 })
    }

    const endpoint = bundlesUrl(region as any)
    const connection = new Connection(getServerRpc(), 'confirmed')

    if (simulateOnly) {
      const sim = await connection.simulateTransaction(decoded[0], { sigVerify: false })
      if (sim.value.err) return NextResponse.json({ error: `Simulation failed: ${JSON.stringify(sim.value.err)}` }, { status: 400 })
      return NextResponse.json({ ok: true, simulation: sim.value })
    }

    let sendAt = Date.now()
    if (mode === 'delayed' && delaySec > 0) sendAt += delaySec * 1000

    const encodedTransactions = txs_b64
    const send = async () => {
      const start = Date.now()
      const res: any = await jitoRpc(endpoint, 'sendBundle', [{ encodedTransactions, bundleOnly: true }])
      const bundleId: string = typeof res === 'string' ? res : res?.bundleId || res?.id
      if (!bundleId) throw new Error('No bundleId returned')

      let landedSlot: number | null = null
      for (let i = 0; i < 20; i++) {
        const r: any = await jitoRpc(endpoint, 'getBundleStatuses', [[bundleId]])
        const v = r?.value?.[0]
        const st = String(v?.status || 'unknown').toLowerCase()
        if (st === 'landed') { landedSlot = v?.landed_slot ?? null; break }
        if (st === 'failed' || st === 'invalid') break
        await new Promise(r => setTimeout(r, 1200))
      }
      const latency = Date.now() - start
      const signatures = decoded.map(v => v.signatures?.[0]?.toString('base64') || null).filter(Boolean)
      return { bundleId, signatures, landedSlot, latency }
    }

    const now = Date.now()
    if (sendAt > now) await new Promise(r => setTimeout(r, Math.min(sendAt - now, 120_000)))

    const { bundleId, signatures, landedSlot, latency } = await send()
    return NextResponse.json({ bundle_id: bundleId, signatures, slot: landedSlot, latency_ms: latency })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Bundle submit failed' }, { status: 500 })
  }
}