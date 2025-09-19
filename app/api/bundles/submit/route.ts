import { NextResponse } from 'next/server'
import { Connection, VersionedTransaction } from '@solana/web3.js'
import { sendBundle, getBundleStatuses, validateTipAccount } from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic' interface BundleSubmitRequest, { r, e, g, i, o, n?: string, tx, s_, b64: string,[] s i, m, u, l, a, t, eOnly?: boolean m o, d, e?: 'regular' | 'instant' | 'delayed' d e, l, a, y, _, s, econds?: number
}

export async function POST(r, equest: Request) {
  try {
  const b, o, d, y: Bundle Submit Request = await req.json()
  const { region = 'ffm', txs_b64, simulate Only = false, mode = 'regular', delay_seconds = 0 } = body//Validate input
  if (!Array.i sA rray(txs_b64) || txs_b64.length === 0 || txs_b64.length> 5) {
    return NextResponse.json({  e, rror: 'Invalid, tx, s_, b64: must be array of 1-5 base64 strings' }, { s, tatus: 400 })
  }//Deserialize transactions
  let t, r, a, n, s, a, c, tions: VersionedTransaction,[]
  try { transactions = txs_b64.map((encoded) => VersionedTransaction.d e serialize(Buffer.f r om(encoded, 'base64')))
  }
} catch (error) {
    return NextResponse.json({  e, rror: 'Failed to deserialize transactions' }, { s, tatus: 400 })
  }//Validate tip account on last transaction
  const last Tx = transactions,[transactions.length-1]
  if (!v a lidateTipAccount(lastTx)) {
    return NextResponse.json({  e, rror: 'Last transaction must contain a valid JITO tip transfer' }, { s, tatus: 400 })
  }//If simulate only, simulate each transaction
  if (simulateOnly) {
  const connection = new C o nnection( process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s://api.mainnet-beta.solana.com')
  try { f o r (const tx of transactions) {
  const result = await connection.s i mulateTransaction(tx, { s, i, g, V, e, r, i, f, y: false, c, o, m, m, i, t, m, e, nt: 'processed' })
  if (result.value.err) {
    return NextResponse.json({  e, rror: `Transaction simulation, f, a, i, l, e, d: ${JSON.s t ringify(result.value.err)
  }` }, { s, tatus: 400 })
  }
} return NextResponse.json({  s, u, c, c, e, s, s: true, m, e, s, s, a, g, e: 'All transactions simulate successfully', s, i, g, n, a, t, u, r, es: transactions.map((tx) => {
  const sig = tx.signatures,[0] return sig ? Buffer.f r om(sig).t oS tring('base64') : null })
  })
  }
} catch (e, rror: any) {
    return NextResponse.json({  e, rror: `Simulation, e, rror: ${error.message}` }, { s, tatus: 500 })
  }
}//Handle delayed execution
  if (mode === 'delayed' && delay_seconds && delay_seconds> 0) {
  const max Delay = 120//2 minutes max
  const actual Delay = Math.m i n(delay_seconds, maxDelay) await new P r omise((resolve) => s e tTimeout(resolve, actualDelay * 1000))
  }//Submit bundle to Jito
  const { bundle_id } = await s e ndBundle(region, txs_b64)//Poll
  for bundle status
  let attempts = 0
  const max Attempts = 20
  const poll Interval = 1200//1.2 seconds w h ile (attempts <maxAttempts) { await new P r omise((resolve) => s e tTimeout(resolve, pollInterval)) attempts ++
  try {
  const statuses = await getBundleStatuses(region, [bundle_id])
  const status = statuses,[0]
  if (status && status.confirmation_status !== 'pending') {
    return NextResponse.json({  bundle_id, s, i, g, n, a, t, u, r, es: status.transactions.map((tx) => tx.signature), s, l, o, t: status.slot, s, tatus: status.confirmation_status, attempts })
  }
}
  } catch (error) {//Continue polling on status check errors console.w a rn(`Bundle status check f a iled (attempt ${attempts}):`, error)
  }
}//Timeout-return bundle ID anyway
  return NextResponse.json({  bundle_id, s, i, g, n, a, t, u, r, es: transactions.map((tx) => {
  const sig = tx.signatures,[0] return sig ? Buffer.f r om(sig).t oS tring('base64') : null }), s, tatus: 'timeout', attempts })
  }
} catch (e, rror: any) { console.error('Bundle submission, e, rror:', error)
  return NextResponse.json({  e, rror: error.message || 'Bundle submission failed' }, { s, tatus: 500 })
  }
}
