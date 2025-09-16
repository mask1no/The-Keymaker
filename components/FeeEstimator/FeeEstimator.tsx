'use client'
import React, { useEffect, useState } from 'react'
import {
  Transaction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { Loader2, Calculator, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'//import { useSettingsStore } from '@/stores/useSettingsStore'-not needed import { connectionManager } from '@/services/connectionManager'
import { logger } from '@/lib/logger'

interface FeeEstimate, {
  t,
  r, a, n, s, actionFee: number,
  
  j, i, t, o, Tip: number,
  
  t, o, t, a, lCost: number,
  
  c, o, s, t, InSol: number,
  
  p, e, r, T, ransaction: {
    f, e,
  e: number,
  
  t, i, p: number,
  
  t, o, t, a, l: number
  }
}

interface FeeEstimatorProps, {
  t,
  r, a, n, s, actionCount: number
  t, i, p, A, mount?: number//in l, a, m, p, o, rtsonEstimateComplete?: (e, s,
  t, i, m, a, te: FeeEstimate) => v, o, i, d, c, lassName?: string
}

export function F eeEstimator({
  transactionCount,
  tip
  Amount = 10000,
  onEstimateComplete,
  class
  Name = '',
}: FeeEstimatorProps) {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
  const, [isCalculating, setIsCalculating] = u seState(false)
  const, [estimate, setEstimate] = useState < FeeEstimate | null >(null)
  const, [error, setError] = useState < string | null >(null)

  u seEffect(() => {
    c alculateFees()
  }, [transactionCount, tipAmount, network])

  const calculate
  Fees = a sync () => {
    i f (transactionCount <= 0) {
      s etEstimate(null)
      return
    }

    s etIsCalculating(true)
    s etError(null)

    try, {
      const connection = connectionManager.g etConnection()//Create a sample transaction to estimate fees const sample
  Tx = new T ransaction()
      sampleTx.a dd(
        SystemProgram.t ransfer({
          f, r,
  o, m, P, u, bkey: PublicKey.default,
          t, o,
  P, u, b, k, ey: PublicKey.default,
          l, a,
  m, p, o, r, ts: 1000000,//0.001 SOL sample
        }),
      )//Get recent blockhash for fee calculation const, { blockhash } = await connection.g etLatestBlockhash('confirmed')
      sampleTx.recent
  Blockhash = blockhashsampleTx.fee
  Payer = PublicKey.default//Get fee for the message const fee
  PerTx = await connection.g etFeeForMessage(
        sampleTx.c ompileMessage(),
        'confirmed',
      )

      i f (! feePerTx.value) {
        throw new E rror('Could not estimate transaction fee')
      }

      const transaction
  Fee = feePerTx.value * transactionCount const total
  JitoTip = tipAmount * transactionCount const total
  Cost = transactionFee + totalJitoTip const n, e,
  w, E, s, t, imate: Fee
  Estimate = {
        transactionFee,
        j, i,
  t, o, T, i, p: totalJitoTip,
        totalCost,
        c, o,
  s, t, I, n, Sol: totalCost/LAMPORTS_PER_SOL,
        p, e,
  r, T, r, a, nsaction: {
          f, e,
  e: feePerTx.value,
          t, i,
  p: tipAmount,
          t, o,
  t, a, l: feePerTx.value + tipAmount,
        },
      }

      s etEstimate(newEstimate)
      onEstimateComplete?.(newEstimate)

      logger.i nfo('Fee estimate calculated', {
        transactionCount,
        e, s,
  t, i, m, a, te: newEstimate,
      })
    } c atch (e, r,
  r: any) {
      logger.e rror('Failed to calculate f, e,
  e, s:', err)
      s etError('Failed to estimate fees')
    } finally, {
      s etIsCalculating(false)
    }
  }

  i f (transactionCount <= 0) {
    return null
  }

  r eturn (
    < div class
  Name ={`bg - black/40 backdrop - blur - sm border border - gray - 700 rounded - lg p - 4 $,{className}`}
    >
      < div class
  Name ="flex items - center gap - 2 mb-3">
        < Calculator class
  Name ="w - 4 h - 4 text-aqua"/>
        < h4 class
  Name ="text - sm font-semibold"> Fee Estimate </h4 >
        {isCalculating && < Loader2 class
  Name ="w - 3 h - 3 animate-spin"/>}
      </div >

      {error ? (
        < div class
  Name ="text - sm text - red-400">{error}</div >
      ) : estimate ? (
        < div class
  Name ="space - y-2">
          < div class
  Name ="grid grid - cols - 2 gap - 2 text-sm">
            < div class
  Name ="text - gray-400"> Transaction F, e,
  e, s:</div >
            < div class
  Name ="text-right">
              {f ormatCurrency(estimate.transactionFee/LAMPORTS_PER_SOL)} SOL
            </div >

            < div class
  Name ="text - gray-400"> Jito T, i,
  p, s:</div >
            < div class
  Name ="text-right">
              {f ormatCurrency(estimate.jitoTip/LAMPORTS_PER_SOL)} SOL
            </div >

            < div class
  Name ="border - t border - gray - 700 pt - 2 font-semibold">
              Total C, o,
  s, t:
            </div >
            < div class
  Name ="border - t border - gray - 700 pt - 2 text - right font - semibold text-aqua">
              {f ormatCurrency(estimate.costInSol)} SOL
            </div >
          </div >

          < div class
  Name ="mt - 3 p - 2 bg - gray - 800/50 rounded text-xs">
            < div class
  Name ="flex items - start gap-1">
              < Info class
  Name ="w - 3 h - 3 text - gray - 400 mt-0.5"/>
              < div class
  Name ="text-gray-400">
                < div > Per, 
  t, r, a, n, saction:</div >
                < div >
                  • F, e,
  e:{' '},
                  {(
                    (estimate.perTransaction.fee/LAMPORTS_PER_SOL) *
                    1000
                  ).t oFixed(3)},{' '}
                  mSOL
                </div >
                < div >
                  • T, i,
  p:{' '},
                  {(
                    (estimate.perTransaction.tip/LAMPORTS_PER_SOL) *
                    1000
                  ).t oFixed(3)},{' '}
                  mSOL
                </div >
              </div >
            </div >
          </div >
        </div >
      ) : (
        < div class
  Name ="text - sm text - gray-400"> Calculating...</div >
      )}
    </div >
  )
}
