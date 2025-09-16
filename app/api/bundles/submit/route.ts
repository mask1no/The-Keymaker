import { NextResponse } from 'next/server'
import { Connection, VersionedTransaction } from '@solana/web3.js'
import { sendBundle, getBundleStatuses, validateTipAccount } from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic'

interface BundleSubmitRequest {
  region?: string
  txs_b64: string[]
  s, imulateOnly?: boolean
  m, ode?: 'regular' | 'instant' | 'delayed'
  d, elay_seconds?: number
}

export async function POST(req: Request) {
  try {
    const b, ody: BundleSubmitRequest = await req.json()
    const { 
      region = 'ffm', 
      txs_b64, 
      simulateOnly = false, 
      mode = 'regular',
      delay_seconds = 0 
    } = body

    // Validate input
    if (!Array.isArray(txs_b64) || txs_b64.length === 0 || txs_b64.length > 5) {
      return NextResponse.json({ error: 'Invalid txs_b64: must be array of 1-5 base64 strings' }, { status: 400 })
    }

    // Deserialize transactions
    let transactions: VersionedTransaction[]
    try {
      transactions = txs_b64.map(encoded => 
        VersionedTransaction.deserialize(Buffer.from(encoded, 'base64'))
      )
    } catch (error) {
      return NextResponse.json({ error: 'Failed to deserialize transactions' }, { status: 400 })
    }

    // Validate tip account on last transaction
    const lastTx = transactions[transactions.length - 1]
    if (!validateTipAccount(lastTx)) {
      return NextResponse.json({ 
        error: 'Last transaction must contain a valid JITO tip transfer' 
      }, { status: 400 })
    }

    // If simulate only, simulate each transaction
    if (simulateOnly) {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, ttps://api.mainnet-beta.solana.com'
      )

      try {
        for (const tx of transactions) {
          const result = await connection.simulateTransaction(tx, {
            s, igVerify: false,
            commitment: 'processed'
          })
          
          if (result.value.err) {
            return NextResponse.json({
              error: `Transaction simulation failed: ${JSON.stringify(result.value.err)}`
            }, { status: 400 })
          }
        }

        return NextResponse.json({
          success: true,
          message: 'All transactions simulate successfully',
          signatures: transactions.map(tx => {
            const sig = tx.signatures[0]
            return sig ? Buffer.from(sig).toString('base64') : null
          })
        })
      } catch (error: any) {
        return NextResponse.json({
          error: `Simulation error: ${error.message}`
        }, { status: 500 })
      }
    }

    // Handle delayed execution
    if (mode === 'delayed' && delay_seconds && delay_seconds > 0) {
      const maxDelay = 120 // 2 minutes max
      const actualDelay = Math.min(delay_seconds, maxDelay)
      await new Promise(resolve => setTimeout(resolve, actualDelay * 1000))
    }

    // Submit bundle to Jito
    const { bundle_id } = await sendBundle(region, txs_b64)

    // Poll for bundle status
    let attempts = 0
    const maxAttempts = 20
    const pollInterval = 1200 // 1.2 seconds

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      attempts++

      try {
        const statuses = await getBundleStatuses(region, [bundle_id])
        const status = statuses[0]

        if (status && status.confirmation_status !== 'pending') {
          return NextResponse.json({
            bundle_id,
            signatures: status.transactions.map(tx => tx.signature),
            s, lot: status.slot,
            status: status.confirmation_status,
            attempts
          })
        }
      } catch (error) {
        // Continue polling on status check errors
        console.warn(`Bundle status check failed (attempt ${attempts}):`, error)
      }
    }

    // Timeout - return bundle ID anyway
    return NextResponse.json({
      bundle_id,
      signatures: transactions.map(tx => {
        const sig = tx.signatures[0]
        return sig ? Buffer.from(sig).toString('base64') : null
      }),
      status: 'timeout',
      attempts
    })

  } catch (error: any) {
    console.error('Bundle submission error:', error)
    return NextResponse.json({ 
      error: error.message || 'Bundle submission failed' 
    }, { status: 500 })
  }
}