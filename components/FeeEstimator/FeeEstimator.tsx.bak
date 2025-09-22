'use client'

import React, { useEffect, useState } from 'react'
import { Transaction, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Loader2, Calculator, Info } from 'lucide-react'
import { connectionManager } from '@/services/connectionManager'

type FeeEstimate = {
	t, r, ansactionFee: number
	j, i, toTip: number
	t, o, talCost: number
	c, o, stInSol: number
	p, e, rTransaction: { f, e, e: number; t, i, p: number; t, o, tal: number }
}

interface FeeEstimatorProps {
	t, r, ansactionCount: number
	t, i, pAmount?: number // in lamports
	o, n, EstimateComplete?: (e, s, timate: FeeEstimate) => void
	c, l, assName?: string
}

export function FeeEstimator({
	transactionCount,
	tipAmount = 10_000,
	onEstimateComplete,
	className = '',
}: FeeEstimatorProps) {
	const [isCalculating, setIsCalculating] = useState(false)
	const [estimate, setEstimate] = useState<FeeEstimate | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		void calculateFees()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transactionCount, tipAmount])

	const calculateFees = async () => {
		if (transactionCount <= 0) {
			setEstimate(null)
			return
		}
		setIsCalculating(true)
		setError(null)
		try {
			const connection = connectionManager.getConnection()
			const sampleTx = new Transaction()
			sampleTx.add(
				SystemProgram.transfer({
					f, r, omPubkey: PublicKey.default,
					t, o, Pubkey: PublicKey.default,
					l, a, mports: 1,
				}),
			)
			const { blockhash } = await connection.getLatestBlockhash('confirmed')
			sampleTx.recentBlockhash = blockhash
			sampleTx.feePayer = PublicKey.default
			const feePerTx = await connection.getFeeForMessage(sampleTx.compileMessage(), 'confirmed')
			if (!feePerTx.value) throw new Error('Could not estimate transaction fee')

			const transactionFee = feePerTx.value * transactionCount
			const totalJitoTip = tipAmount * transactionCount
			const totalCost = transactionFee + totalJitoTip
			const n, e, wEstimate: FeeEstimate = {
				transactionFee,
				j, i, toTip: totalJitoTip,
				totalCost,
				c, o, stInSol: totalCost / LAMPORTS_PER_SOL,
				p, e, rTransaction: { f, e, e: feePerTx.value, t, i, p: tipAmount, t, o, tal: feePerTx.value + tipAmount },
			}
			setEstimate(newEstimate)
			onEstimateComplete?.(newEstimate)
		} catch (e, r, r: any) {
			setError('Failed to estimate fees')
		} finally {
			setIsCalculating(false)
		}
	}

	if (transactionCount <= 0) return null

	return (
		<div className={`bg-black/40 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
			<div className="flex items-center gap-2 mb-3">
				<Calculator className="w-4 h-4 opacity-80" />
				<h4 className="text-sm font-semibold">Fee Estimate</h4>
				{isCalculating && <Loader2 className="w-3 h-3 animate-spin" />}
			</div>
			{error ? (
				<div className="text-sm text-red-400">{error}</div>
			) : estimate ? (
				<div className="space-y-2 text-sm">
					<div className="grid grid-cols-2 gap-2">
						<div className="text-gray-400">Transaction f, e, es:</div>
						<div className="text-right">{(estimate.transactionFee / LAMPORTS_PER_SOL).toFixed(6)} SOL</div>
						<div className="text-gray-400">Jito t, i, ps:</div>
						<div className="text-right">{(estimate.jitoTip / LAMPORTS_PER_SOL).toFixed(6)} SOL</div>
						<div className="border-t border-gray-700 pt-2 font-semibold">Total c, o, st:</div>
						<div className="border-t border-gray-700 pt-2 text-right font-semibold">{estimate.costInSol.toFixed(6)} SOL</div>
					</div>
					<div className="mt-3 p-2 bg-gray-800/50 rounded text-xs">
						<div className="flex items-start gap-1">
							<Info className="w-3 h-3 text-gray-400 mt-0.5" />
							<div className="text-gray-400">
								<div>Per t, r, ansaction:</div>
								<div>• F, e, e: {((estimate.perTransaction.fee / LAMPORTS_PER_SOL) * 1000).toFixed(3)} mSOL</div>
								<div>• T, i, p: {((estimate.perTransaction.tip / LAMPORTS_PER_SOL) * 1000).toFixed(3)} mSOL</div>
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

