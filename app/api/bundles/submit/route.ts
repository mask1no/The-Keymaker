import { NextResponse } from 'next/server'
import { Connection, VersionedTransaction } from '@solana/web3.js'
import { sendBundle, getBundleStatuses, validateTipAccount } from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic'

interface BundleSubmitRequest {
  region?: string
  txs_b64: string[]
  simulateOnly?: boolean
  mode?: 'regular' | 'instant' | 'delayed'
  delay_seconds?: number
}

export async function POST(request: Request) {
  try {
    const body: BundleSubmitRequest = await request.json()
    const { region = 'ffm', txs_b64, simulateOnly = false, mode = 'regular', delay_seconds = 0 } = body

    if (!Array.isArray(txs_b64) || txs_b64.length === 0 || txs_b64.length > 5) {
      return NextResponse.json(
        { error: 'Invalid txs_b64: must be array of 1-5 base64 strings' },
        { status: 400 },
      )
    }

    let transactions: VersionedTransaction[]
    try {
      transactions = txs_b64.map((encoded) => VersionedTransaction.deserialize(Buffer.from(encoded, 'base64')))
    } catch {
      return NextResponse.json({ error: 'Failed to deserialize transactions' }, { status: 400 })
    }

    if (simulateOnly) {
      const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com')
      try {
        for (const tx of transactions) {
          const result = await connection.simulateTransaction(tx, {
            sigVerify: false,
            commitment: 'processed' as any,
          })
          if (result.value.err) {
            return NextResponse.json(
              { error: `Transaction simulation failed: ${JSON.stringify(result.value.err)}` },
              { status: 400 },
            )
          }
        }
        return NextResponse.json({
          success: true,
          message: 'All transactions simulate successfully',
          signatures: transactions.map((tx) => {
            const sig = tx.signatures[0]
            return sig ? Buffer.from(sig).toString('base64') : null
          }),
        })
      } catch (error: any) {
        return NextResponse.json({ error: `Simulation error: ${error.message}` }, { status: 500 })
      }
    }

    // Require valid Jito tip transfer only for real submission
    const lastTx = transactions[transactions.length - 1]
    if (!validateTipAccount(lastTx)) {
      return NextResponse.json(
        { error: 'Last transaction must contain a valid JITO tip transfer' },
        { status: 400 },
      )
    }

    if (mode === 'delayed' && delay_seconds && delay_seconds > 0) {
      const maxDelay = 120
      const actualDelay = Math.min(delay_seconds, maxDelay)
      await new Promise((resolve) => setTimeout(resolve, actualDelay * 1000))
    }

    const { bundle_id } = await sendBundle(region, txs_b64)

    let attempts = 0
    const maxAttempts = 20
    const pollInterval = 1200

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      attempts++
      try {
        const statuses = await getBundleStatuses(region, [bundle_id])
        const status = (statuses as any)[0]
        if (status && status.confirmation_status && status.confirmation_status !== 'pending') {
          return NextResponse.json({
            bundle_id,
            signatures: status.transactions?.map((tx: any) => tx.signature) || [],
            slot: status.slot,
            status: status.confirmation_status,
            attempts,
          })
        }
      } catch {
        // continue polling
      }
    }

    return NextResponse.json({
      bundle_id,
      signatures: transactions.map((tx) => {
        const sig = tx.signatures[0]
        return sig ? Buffer.from(sig).toString('base64') : null
      }),
      status: 'timeout',
      attempts,
    })
  } catch (error: any) {
    console.error('Bundle submission error:', error)
    return NextResponse.json({ error: error.message || 'Bundle submission failed' }, { status: 500 })
  }
}
