import { NextResponse } from 'next/server'
import { PublicKey, VersionedTransaction, Connection, ComputeBudgetProgram, Transaction } from '@solana/web3.js'
import { getServerRpc } from '@/lib/server/rpc'
import { bundlesUrl } from '@/lib/server/jito'
import { logEvent } from '@/services/executionLogService'
import { JITO_TIP_ACCOUNTS } from '@/constants'

export const dynamic = 'force-dynamic'

type SubmitBody = {
  region?: string
  txs_b64: string[]
  tip_lamports?: number
  cu_price?: number
  simulateOnly?: boolean
}

function isBase64(s: string): boolean {
  try {
    return btoa(atob(s)) === s
  } catch {
    try {
      // Fallback for server environment without atob/btoa
      Buffer.from(s, 'base64').toString('base64') === s
      return true
    } catch {
      return false
    }
  }
}

function decodeB64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return Uint8Array.from(Buffer.from(b64, 'base64'))
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function hasComputeBudgetFirst(tx: VersionedTransaction): boolean {
  const msg = tx.message
  const ix0 = msg.compiledInstructions[0]
  if (!ix0) return false
  const programId = msg.staticAccountKeys[ix0.programIdIndex]
  return programId.equals(ComputeBudgetProgram.programId)
}

function tipAccountIsStatic(msg: VersionedTransaction['message']): boolean {
  // Ensure at least one known Jito tip account is present in static keys
  const staticKeys: string[] = (msg.staticAccountKeys || []).map((k: PublicKey) => k.toBase58())
  const tipSet = new Set(JITO_TIP_ACCOUNTS)
  for (const k of staticKeys) {
    if (tipSet.has(k)) return true
  }
  return false
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubmitBody
    const { txs_b64, tip_lamports, cu_price, simulateOnly } = body || {}

    // Guardrails: length 1..5
    if (!Array.isArray(txs_b64) || txs_b64.length < 1 || txs_b64.length > 5) {
      return NextResponse.json({ error: 'txs_b64 must have 1..5 items' }, { status: 400 })
    }

    // Validate base64 and CU first, tip account static; allow ALTs in general
    const versionedTxs: (VersionedTransaction|Transaction)[] = []
    for (const b64 of txs_b64) {
      if (!isBase64(b64)) {
        return NextResponse.json({ error: 'Invalid base64 transaction' }, { status: 400 })
      }
      const bytes = decodeB64ToBytes(b64)
      let parsed: VersionedTransaction|Transaction|undefined
      try {
        parsed = VersionedTransaction.deserialize(bytes)
        // ComputeBudget must be first (v0)
        if (!hasComputeBudgetFirst(parsed)) {
          return NextResponse.json({ error: 'ComputeBudget must be first instruction' }, { status: 400 })
        }
        if (!tipAccountIsStatic((parsed as VersionedTransaction).message)) {
          return NextResponse.json({ error: 'Tip account must be in static keys (no ALT for tip)' }, { status: 400 })
        }
      } catch {
        // Try legacy
        try {
          const ltx = Transaction.from(bytes)
          // ComputeBudget must be first
          if (!ltx.instructions[0] || !ltx.instructions[0].programId.equals(ComputeBudgetProgram.programId)) {
            return NextResponse.json({ error: 'ComputeBudget must be first instruction' }, { status: 400 })
          }
          // Tip account present in static keys
          const keys = ltx.compileMessage().accountKeys.map((k)=>k.toBase58())
          const tipSet = new Set(JITO_TIP_ACCOUNTS)
          const hasTip = keys.some((k)=>tipSet.has(k))
          if (!hasTip) {
            return NextResponse.json({ error: 'Tip account must be in static keys (no ALT for tip)' }, { status: 400 })
          }
          parsed = ltx
        } catch (e) {
          return NextResponse.json({ error: 'Failed to parse transaction' }, { status: 400 })
        }
      }
      versionedTxs.push(parsed!)
    }

    // Simulation gate: exact v0 sim for each
    const rpc = getServerRpc()
    const conn = new Connection(rpc, 'processed')
    const { blockhash } = await conn.getLatestBlockhash('processed')
    for (let i = 0; i < versionedTxs.length; i++) {
      const tx = versionedTxs[i]
      const sim = await conn.simulateTransaction(tx as any, {
        replaceRecentBlockhash: false,
        sigVerify: false,
      })
      if (sim.value.err) {
        return NextResponse.json({ error: `Simulation failed for tx ${i}`, details: sim.value.err }, { status: 400 })
      }
    }

    // If simulateOnly, return after simulation gate
    if (simulateOnly) {
      return NextResponse.json({ ok: true, sims: versionedTxs.map((_, idx)=>({idx, err:null})), blockhash, slot: await conn.getSlot('processed') })
    }

    // Submit bundle via Jito JSON-RPC
    const region = (body.region ?? 'ffm') as any
    const endpoint = bundlesUrl(region, 'mainnet')
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'sendBundle',
      params: [txs_b64, { encoding: 'base64' }],
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (process.env.JITO_AUTH_TOKEN) headers['Authorization'] = `Bearer ${process.env.JITO_AUTH_TOKEN}`
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) })
    const j = await res.json()
    const bundleId = j?.result || j?.bundle_id || j?.id
    if (!bundleId) {
      return NextResponse.json({ error: 'Jito sendBundle failed', details: j }, { status: 502 })
    }

    // Poll status
    const statusReq = {
      jsonrpc: '2.0',
      id: Date.now() + 1,
      method: 'getInflightBundleStatuses',
      params: [[bundleId]],
    }
    let landedSlot = 0
    let retries = 0
    let signatures: string[] = []
    const start = Date.now()
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const sres = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(statusReq), signal: AbortSignal.timeout(8000) })
      const sj = await sres.json()
      const status = sj?.result?.[0]
      const st = status?.status
      if (st === 'landed') {
        landedSlot = status?.landed_slot || 0
        // get bundle statuses with signatures
        const getStatuses = {
          jsonrpc: '2.0',
          id: Date.now() + 2,
          method: 'getBundleStatuses',
          params: [[bundleId]],
        }
        const gres = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(getStatuses), signal: AbortSignal.timeout(8000) })
        const gj = await gres.json()
        const txs: string[] = gj?.result?.[0]?.transactions || []
        signatures = Array.isArray(txs) ? txs : []
        break
      }
      if (st === 'invalid' || st === 'failed') break
      retries++
    }
    const latency = Date.now() - start

    // Telemetry log
    await logEvent('bundle_attempt', {
      bundle_id: bundleId,
      region: body.region || 'ffm',
      tip_lamports: tip_lamports || 0,
      cu_price: cu_price || 0,
      landed_slot: landedSlot,
      latency_ms: latency,
      retries,
      tx_sigs: signatures,
    })

    return NextResponse.json({ bundle_id: bundleId, signatures, slot: landedSlot, latency_ms: latency })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}


