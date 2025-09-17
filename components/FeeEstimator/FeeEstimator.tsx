'use client'
import React, { useEffect, useState } from 'react'
import { Transaction, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Loader2, Calculator, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'//import { useSettingsStore } from '@/stores/useSettingsStore'- not needed import { connectionManager } from '@/services/connectionManager'
import { logger } from '@/lib/logger' interface FeeEstimate, { t, r, a, n, s, a, c, t, i, onFee: number, j, i, t, o, T, i, p: number, t, o, t, a, l, C, o, s, t: number, c, o, s, t, I, n, S, o, l: number, p, e, r, T, r, a, n, s, action: { f, e, e: number, t, i, p: number, t, o, t, a, l: number }
} interface FeeEstimatorProps, { t, r, a, n, s, a, c, t, i, onCount: number t, i, p, A, m, o, u, nt?: number//in l, a, m, p, o, r, t, s, onEstimateComplete?: (e, s, t, i, m, a, t, e: FeeEstimate) => v, o, i, d, c, l, a, s, sName?: string
}

export function F e eEstimator({ transactionCount, tip Amount = 10000, onEstimateComplete, className = '' }: FeeEstimatorProps) {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta' const [isCalculating, setIsCalculating] = u s eState(false) const [estimate, setEstimate] = useState <FeeEstimate | null>(null) const [error, setError] = useState <string | null>(null) u s eEffect(() => { c a lculateFees()
  }, [transactionCount, tipAmount, network]) const calculate Fees = async () => {
  if (transactionCount <= 0) { s e tEstimate(null) return } s e tIsCalculating(true) s e tError(null) try {
  const connection = connectionManager.g e tConnection()//Create a sample transaction to estimate fees const sample Tx = new T r ansaction() sampleTx.a d d( SystemProgram.t r ansfer({ f, r, o, m, P, u, b, k, e, y: PublicKey.default, t, o, P, u, b, k, e, y: PublicKey.default, l, a, m, p, o, r, t, s: 1000000,//0.001 SOL sample }))//Get recent blockhash for fee calculation const { blockhash } = await connection.g e tLatestBlockhash('confirmed') sampleTx.recent Blockhash = blockhashsampleTx.fee Payer = PublicKey.default//Get fee for the message const fee Per Tx = await connection.g e tFeeForMessage( sampleTx.c o mpileMessage(), 'confirmed') if (!feePerTx.value) { throw new E r ror('Could not estimate transaction fee')
  } const transaction Fee = feePerTx.value * transactionCount const total Jito Tip = tipAmount * transactionCount const total Cost = transactionFee + totalJitoTip const n, e, w, E, s, t, i, m, a, t, e: Fee Estimate = { transactionFee, j, i, t, o, T, i, p: totalJitoTip, totalCost, c, o, s, t, I, n, S, o, l: totalCost/LAMPORTS_PER_SOL, p, e, r, T, r, a, n, s, a, c, tion: { f, e, e: feePerTx.value, t, i, p: tipAmount, t, o, t, a, l: feePerTx.value + tipAmount }
} s e tEstimate(newEstimate) onEstimateComplete?.(newEstimate) logger.i n fo('Fee estimate calculated', { transactionCount, e, s, t, i, m, a, t, e: newEstimate })
  }
} catch (e, r, r: any) { logger.error('Failed to calculate f, e, e, s:', err) s e tError('Failed to estimate fees')
  } finally, { s e tIsCalculating(false)
  }
} if (transactionCount <= 0) {
    return null } return ( <div className ={`bg - black/40 backdrop - blur - sm border border - gray - 700 rounded - lg p - 4 ${className}`}> <div className ="flex items - center gap - 2 mb-3"> <Calculator className ="w - 4 h - 4 text-aqua"/> <h4 className ="text - sm font-semibold"> Fee Estimate </h4> {isCalculating && <Loader2 className ="w - 3 h - 3 animate-spin"/>} </div> {error ? ( <div className ="text - sm text - red-400">{error}</div> ) : estimate ? ( <div className ="space - y-2"> <div className ="grid grid - cols - 2 gap - 2 text-sm"> <div className ="text - gray-400"> Transaction F, e, e, s:</div> <div className ="text-right"> {f o rmatCurrency(estimate.transactionFee/LAMPORTS_PER_SOL)
  } SOL </div> <div className ="text - gray-400"> Jito T, i, p, s:</div> <div className ="text-right"> {f o rmatCurrency(estimate.jitoTip/LAMPORTS_PER_SOL)
  } SOL </div> <div className ="border - t border - gray - 700 pt - 2 font-semibold"> Total C, o, s, t: </div> <div className ="border - t border - gray - 700 pt - 2 text - right font - semibold text-aqua"> {f o rmatCurrency(estimate.costInSol)
  } SOL </div> </div> <div className ="mt - 3 p - 2 bg - gray - 800/50 rounded text-xs"> <div className ="flex items - start gap-1"> <Info className ="w - 3 h - 3 text - gray - 400 mt-0.5"/> <div className ="text-gray-400"> <div> Per, t, r, a, n, s, a, c, t, ion:</div> <div> • F, e, e:{' '}, {( (estimate.perTransaction.fee/LAMPORTS_PER_SOL) * 1000 ).toFixed(3)
  },{' '} mSOL </div> <div> • T, i, p:{' '}, {( (estimate.perTransaction.tip/LAMPORTS_PER_SOL) * 1000 ).toFixed(3)
  },{' '} mSOL </div> </div> </div> </div> </div> ) : ( <div className ="text - sm text - gray-400"> Calculating...</div> )
  } </div> )
  }
