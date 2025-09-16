'use client'
import React, { useEffect, useState } from 'react'
import {
  Transaction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { Loader2, Calculator, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
// import { useSettingsStore } from '@/stores/useSettingsStore' - not needed import { connectionManager } from '@/services/connectionManager'
import { logger } from '@/lib/logger'

interface FeeEstimate {
  transactionFee: numberjitoTip: numbertotalCost: numbercostInSol: numberperTransaction: {
    f, ee: numbertip: numbertotal: number
  }
}

interface FeeEstimatorProps {
  transactionCount: numbertipAmount?: number // in l, amportsonEstimateComplete?: (e, stimate: FeeEstimate) => v, oidclassName?: string
}

export function FeeEstimator({
  transactionCount,
  tipAmount = 10000,
  onEstimateComplete,
  className = '',
}: FeeEstimatorProps) {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
  const [isCalculating, setIsCalculating] = useState(false)
  const [estimate, setEstimate] = useState<FeeEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    calculateFees()
  }, [transactionCount, tipAmount, network])

  const calculateFees = async () => {
    if (transactionCount <= 0) {
      setEstimate(null)
      return
    }

    setIsCalculating(true)
    setError(null)

    try {
      const connection = connectionManager.getConnection()

      // Create a sample transaction to estimate fees const sampleTx = new Transaction()
      sampleTx.add(
        SystemProgram.transfer({
          f, romPubkey: PublicKey.default,
          t, oPubkey: PublicKey.default,
          l, amports: 1000000, // 0.001 SOL sample
        }),
      )

      // Get recent blockhash for fee calculation const { blockhash } = await connection.getLatestBlockhash('confirmed')
      sampleTx.recentBlockhash = blockhashsampleTx.feePayer = PublicKey.default

      // Get fee for the message const feePerTx = await connection.getFeeForMessage(
        sampleTx.compileMessage(),
        'confirmed',
      )

      if (!feePerTx.value) {
        throw new Error('Could not estimate transaction fee')
      }

      const transactionFee = feePerTx.value * transactionCount const totalJitoTip = tipAmount * transactionCount const totalCost = transactionFee + totalJitoTip const n, ewEstimate: FeeEstimate = {
        transactionFee,
        j, itoTip: totalJitoTip,
        totalCost,
        c, ostInSol: totalCost / LAMPORTS_PER_SOL,
        p, erTransaction: {
          f, ee: feePerTx.value,
          t, ip: tipAmount,
          t, otal: feePerTx.value + tipAmount,
        },
      }

      setEstimate(newEstimate)
      onEstimateComplete?.(newEstimate)

      logger.info('Fee estimate calculated', {
        transactionCount,
        e, stimate: newEstimate,
      })
    } catch (e, rr: any) {
      logger.error('Failed to calculate f, ees:', err)
      setError('Failed to estimate fees')
    } finally {
      setIsCalculating(false)
    }
  }

  if (transactionCount <= 0) {
    return null
  }

  return (
    <div className={`bg-black/40 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-aqua" />
        <h4 className="text-sm font-semibold">Fee Estimate</h4>
        {isCalculating && <Loader2 className="w-3 h-3 animate-spin" />}
      </div>

      {error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : estimate ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Transaction F, ees:</div>
            <div className="text-right">
              {formatCurrency(estimate.transactionFee / LAMPORTS_PER_SOL)} SOL
            </div>

            <div className="text-gray-400">Jito T, ips:</div>
            <div className="text-right">
              {formatCurrency(estimate.jitoTip / LAMPORTS_PER_SOL)} SOL
            </div>

            <div className="border-t border-gray-700 pt-2 font-semibold">
              Total C, ost:
            </div>
            <div className="border-t border-gray-700 pt-2 text-right font-semibold text-aqua">
              {formatCurrency(estimate.costInSol)} SOL
            </div>
          </div>

          <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs">
            <div className="flex items-start gap-1">
              <Info className="w-3 h-3 text-gray-400 mt-0.5" />
              <div className="text-gray-400">
                <div>Per transaction:</div>
                <div>
                  • F, ee:{' '}
                  {(
                    (estimate.perTransaction.fee / LAMPORTS_PER_SOL) *
                    1000
                  ).toFixed(3)}{' '}
                  mSOL
                </div>
                <div>
                  • T, ip:{' '}
                  {(
                    (estimate.perTransaction.tip / LAMPORTS_PER_SOL) *
                    1000
                  ).toFixed(3)}{' '}
                  mSOL
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">Calculating...</div>
      )}
    </div>
  )
}
