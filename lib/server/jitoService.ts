import { VersionedTransaction } from '@solana/web3.js'
import { JITO_TIP_ACCOUNTS } from '@/constants'

export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo'

export interface JitoRegion {
	name: string
	endpoint: string
}

export const JITO_REGIONS: Record<RegionKey, JitoRegion> = {
	ffm: {
		name: 'Frankfurt',
		endpoint: 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
	},
	ams: {
		name: 'Amsterdam',
		endpoint: 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
	},
	ny: {
		name: 'New York',
		endpoint: 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
	},
	tokyo: {
		name: 'Tokyo',
		endpoint: 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
	},
}

export function getJitoApiUrl(region: RegionKey): string {
	return JITO_REGIONS[region].endpoint
}

export interface TipFloorResponse {
	landed_tips_25th_percentile: number
	landed_tips_50th_percentile: number
	landed_tips_75th_percentile: number
	ema_landed_tips_50th_percentile: number
}

export interface BundleStatus {
	bundle_id: string
	transactions?: Array<{
		signature: string
		confirmation_status: 'processed' | 'confirmed' | 'finalized'
	}>
	slot?: number
	confirmation_status: 'pending' | 'landed' | 'failed' | 'invalid'
}

async function jrpc<T>(
	region: RegionKey,
	method: string,
	params: any,
	timeoutMs = 10000,
): Promise<T> {
	const res = await fetch(getJitoApiUrl(region), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
		signal: AbortSignal.timeout(timeoutMs),
	})
	if (!res.ok) throw new Error(`Jito ${method} HTTP ${res.status}`)
	const json = await res.json()
	if (json?.error) throw new Error(json.error?.message || `Jito ${method} error`)
	return json.result as T
}

export async function getTipFloor(region: RegionKey = 'ffm'): Promise<TipFloorResponse> {
	const url = new URL('tipfloor', getJitoApiUrl(region))
	const res = await fetch(url.toString(), {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	})
	if (!res.ok) throw new Error(`Tip floor request failed: ${res.status} ${res.statusText}`)
	return res.json()
}

export async function sendBundle(
	region: RegionKey,
	encodedTransactions: string[],
): Promise<{ bundle_id: string }> {
	const result = await jrpc<string>(region, 'sendBundle', {
		encodedTransactions,
		bundleOnly: true,
	})
	return { bundle_id: result }
}

export async function getBundleStatuses(
	region: RegionKey,
	bundleIds: string[],
): Promise<BundleStatus[]> {
	return await jrpc<BundleStatus[]>(region, 'getBundleStatuses', bundleIds)
}

export function validateTipAccount(transaction: VersionedTransaction): boolean {
	try {
		const message = transaction.message
		const instructions = message.compiledInstructions
		if (instructions.length === 0) return false

		const lastInstruction = instructions[instructions.length - 1]
		if (lastInstruction.accountKeyIndexes.length < 2) return false

		const accounts = message.staticAccountKeys
		const recipientIndex = lastInstruction.accountKeyIndexes[1]
		if (recipientIndex >= accounts.length) return false

		const recipientKey = accounts[recipientIndex].toBase58()
		return JITO_TIP_ACCOUNTS.includes(recipientKey)
	} catch {
		return false
	}
}