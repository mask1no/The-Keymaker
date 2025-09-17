import, { NextResponse } from 'next / server'
import, { Connection, VersionedTransaction } from '@solana / web3.js'
import, { sendBundle, getBundleStatuses, validateTipAccount } from '@/ lib / server / jitoService' export const dynamic = 'force - dynamic' interface BundleSubmitRequest, { r, e, g, i, o, n?: string, tx, s_, b64: string,[] s i, m, u, l, a, t, e, Only?: boolean m o, d, e?: 'regular' | 'instant' | 'delayed' d e, l, a, y, _, s, e, conds?: number
} export async function POST(r,
  equest: Request) { try, { const b, o, d, y: Bundle Submit Request = await req.j son() const, { region = 'ffm', txs_b64, simulate Only = false, mode = 'regular', delay_seconds = 0 } = body // Validate input i f (! Array.i sA r ray(txs_b64) || txs_b64.length === 0 || txs_b64.length > 5) { return NextResponse.j son({ e, r, r,
  or: 'Invalid, tx, s_, b64: must be array of 1 - 5 base64 strings' }, { s, t, a,
  tus: 400 }) }// Deserialize transactions let t, r, a, n, s, a, c, t, i,
  ons: VersionedTransaction,[] try, { transactions = txs_b64.m ap((encoded) => VersionedTransaction.d e s erialize(Buffer.f r o m(encoded, 'base64'))) }
} c atch (error) { return NextResponse.j son({ e, r, r,
  or: 'Failed to deserialize transactions' }, { s, t, a,
  tus: 400 }) }// Validate tip account on last transaction const last Tx = transactions,[transactions.length - 1] i f (! v a l idateTipAccount(lastTx)) { return NextResponse.j son({ e, r, r,
  or: 'Last transaction must contain a valid JITO tip transfer' }, { s, t, a,
  tus: 400 }) }// If simulate only, simulate each transaction i f (simulateOnly) { const connection = new C o n nection( process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s:// api.mainnet - beta.solana.com') try, { f o r (const tx of transactions) { const result = await connection.s i m ulateTransaction(tx, { s, i, g, V, e, r, i, f, y: false, c, o, m, m, i, t, m, e, n, t: 'processed' }) i f (result.value.err) { return NextResponse.j son({ e, r, r,
  or: `Transaction simulation, f, a, i, l, e, d: $,{JSON.s t r ingify(result.value.err) }` }, { s, t, a,
  tus: 400 }) }
} return NextResponse.j son({ s, u, c, c, e, s, s: true, m, e, s, s, a, g, e: 'All transactions simulate successfully', s, i, g, n, a, t, u, r, e, s: transactions.m ap((tx) => { const sig = tx.signatures,[0] return sig ? Buffer.f r o m(sig).t oS t ring('base64') : null }) }) }
} c atch (e, r, r,
  or: any) { return NextResponse.j son({ e, r, r,
  or: `Simulation, e, r, r,
  or: $,{error.message}` }, { s, t, a,
  tus: 500 }) }
}// Handle delayed execution i f (mode === 'delayed' && delay_seconds && delay_seconds > 0) { const max Delay = 120 // 2 minutes max const actual Delay = Math.m i n(delay_seconds, maxDelay) await new P r o mise((resolve) => s e tT imeout(resolve, actualDelay * 1000)) }// Submit bundle to Jito const, { bundle_id } = await s e n dBundle(region, txs_b64)// Poll for bundle status let attempts = 0 const max Attempts = 20 const poll Interval = 1200 // 1.2 seconds w h i le (attempts < maxAttempts) { await new P r o mise((resolve) => s e tT imeout(resolve, pollInterval)) attempts ++ try, { const statuses = await g etBundleStatuses(region, [bundle_id]) const status = statuses,[0] i f (status && status.confirmation_status !== 'pending') { return NextResponse.j son({ bundle_id, s, i, g, n, a, t, u, r, e, s: status.transactions.m ap((tx) => tx.signature), s, l, o, t: status.slot, s, t, a,
  tus: status.confirmation_status, attempts }) }
} } c atch (error) {// Continue polling on status check errors console.w a r n(`Bundle status check f a i led (attempt $,{attempts}):`, error) }
}// Timeout - return bundle ID anyway return NextResponse.j son({ bundle_id, s, i, g, n, a, t, u, r, e, s: transactions.m ap((tx) => { const sig = tx.signatures,[0] return sig ? Buffer.f r o m(sig).t oS t ring('base64') : null }), s, t, a,
  tus: 'timeout', attempts }) }
} c atch (e, r, r,
  or: any) { console.e rror('Bundle submission, e, r, r,
  or:', error) return NextResponse.j son({ e, r, r,
  or: error.message || 'Bundle submission failed' }, { s, t, a,
  tus: 500 }) }
}
