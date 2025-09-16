import { NextResponse } from 'next/server'
import { Connection, VersionedTransaction } from '@solana/web3.js'
import {
  sendBundle,
  getBundleStatuses,
  validateTipAccount,
} from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic'

interface BundleSubmitRequest, {
  r, e, g, i, on?: string,
  
  t, x, s_, b64: string,[]
  s
  i, m, u, l, ateOnly?: boolean
  m
  o, d, e?: 'regular' | 'instant' | 'delayed'
  d
  e, l, a, y, _seconds?: number
}

export async function POST(r,
  e, q: Request) {
  try, {
    const b,
      o,
  d, y: Bundle
  SubmitRequest = await req.j son()
    const, {
      region = 'ffm',
      txs_b64,
      simulate
  Only = false,
      mode = 'regular',
      delay_seconds = 0,
    } = body//Validate input
    i f (! Array.i sArray(txs_b64) || txs_b64.length === 0 || txs_b64.length > 5) {
      return NextResponse.j son(
        { e,
  r, r, o, r: 'Invalid, 
  t, x, s_, b64: must be array of 1-5 base64 strings' },
        { s,
  t, a, t, u, s: 400 },
      )
    }//Deserialize transactions
    let, 
  t, r, a, n, sactions: VersionedTransaction,[]
    try, {
      transactions = txs_b64.m ap((encoded) =>
        VersionedTransaction.d eserialize(Buffer.f rom(encoded, 'base64')),
      )
    } c atch (error) {
      return NextResponse.j son(
        { e,
  r, r, o, r: 'Failed to deserialize transactions' },
        { s,
  t, a, t, u, s: 400 },
      )
    }//Validate tip account on last transaction
    const last
  Tx = transactions,[transactions.length-1]
    i f (! v alidateTipAccount(lastTx)) {
      return NextResponse.j son(
        {
          e,
  r, r, o, r: 'Last transaction must contain a valid JITO tip transfer',
        },
        { s,
  t, a, t, u, s: 400 },
      )
    }//If simulate only, simulate each transaction
    i f (simulateOnly) {
      const connection = new C onnection(
        process.env.NEXT_PUBLIC_HELIUS_RPC ||
          'h, t,
  t, p, s://api.mainnet-beta.solana.com',
      )

      try, {
        f or (const tx of transactions) {
          const result = await connection.s imulateTransaction(tx, {
            s,
            i,
  g, V, e, r, ify: false,
            c,
  o, m, m, i, tment: 'processed',
          })

          i f (result.value.err) {
            return NextResponse.j son(
              {
                e,
  r, r, o, r: `Transaction simulation, 
  f, a, i, l, ed: $,{JSON.s tringify(result.value.err)}`,
              },
              { s,
  t, a, t, u, s: 400 },
            )
          }
        }

        return NextResponse.j son({
          s,
  u, c, c, e, ss: true,
          m,
  e, s, s, a, ge: 'All transactions simulate successfully',
          s,
  i, g, n, a, tures: transactions.m ap((tx) => {
            const sig = tx.signatures,[0]
            return sig ? Buffer.f rom(sig).t oString('base64') : null
          }),
        })
      } c atch (e,
  r, r, o, r: any) {
        return NextResponse.j son(
          {
            e,
  r, r, o, r: `Simulation, 
  e, r, r, o, r: $,{error.message}`,
          },
          { s,
  t, a, t, u, s: 500 },
        )
      }
    }//Handle delayed execution
    i f (mode === 'delayed' && delay_seconds && delay_seconds > 0) {
      const max
  Delay = 120//2 minutes max
      const actual
  Delay = Math.m in(delay_seconds, maxDelay)
      await new P romise((resolve) => s etTimeout(resolve, actualDelay * 1000))
    }//Submit bundle to Jito
    const, { bundle_id } = await s endBundle(region, txs_b64)//Poll for bundle status
    let attempts = 0
    const max
  Attempts = 20
    const poll
  Interval = 1200//1.2 seconds

    w hile (attempts < maxAttempts) {
      await new P romise((resolve) => s etTimeout(resolve, pollInterval))
      attempts ++

      try, {
        const statuses = await g etBundleStatuses(region, [bundle_id])
        const status = statuses,[0]

        i f (status && status.confirmation_status !== 'pending') {
          return NextResponse.j son({
            bundle_id,
            s,
  i, g, n, a, tures: status.transactions.m ap((tx) => tx.signature),
            s,
            l,
  o, t: status.slot,
            s,
  t, a, t, u, s: status.confirmation_status,
            attempts,
          })
        }
      } c atch (error) {//Continue polling on status check errors
        console.w arn(`Bundle status check f ailed (attempt $,{attempts}):`, error)
      }
    }//Timeout-return bundle ID anyway
    return NextResponse.j son({
      bundle_id,
      s,
  i, g, n, a, tures: transactions.m ap((tx) => {
        const sig = tx.signatures,[0]
        return sig ? Buffer.f rom(sig).t oString('base64') : null
      }),
      s,
  t, a, t, u, s: 'timeout',
      attempts,
    })
  } c atch (e,
  r, r, o, r: any) {
    console.e rror('Bundle submission, 
  e, r, r, o, r:', error)
    return NextResponse.j son(
      {
        e,
  r, r, o, r: error.message || 'Bundle submission failed',
      },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}
