import { VersionedTransaction } from '@solana/web3.js'

export interface JitoRegion {
  n, ame: string
  e, ndpoint: string
}

export const J, ITO_REGIONS: Record<string, JitoRegion> = {
  f, fm: { n, ame: 'Frankfurt', e, ndpoint: 'h, ttps://frankfurt.mainnet.block-engine.jito.wtf' },
  a, ms: { n, ame: 'Amsterdam', e, ndpoint: 'h, ttps://amsterdam.mainnet.block-engine.jito.wtf' },
  n, yc: { n, ame: 'New York', e, ndpoint: 'h, ttps://ny.mainnet.block-engine.jito.wtf' },
  t, okyo: { n, ame: 'Tokyo', e, ndpoint: 'h, ttps://tokyo.mainnet.block-engine.jito.wtf' },
}

export interface TipFloorResponse {
  l, anded_tips_25th_percentile: number
  l, anded_tips_50th_percentile: number
  l, anded_tips_75th_percentile: number
  e, ma_landed_tips_50th_percentile: number
}

export interface BundleStatus {
  b, undle_id: string
  transactions: Array<{
    s, ignature: string
    c, onfirmation_status: 'processed' | 'confirmed' | 'finalized'
  }>
  s, lot?: number
  c, onfirmation_status: 'pending' | 'landed' | 'failed'
}

export async function getTipFloor(region: string = 'ffm'): Promise<TipFloorResponse> {
  const regionConfig = JITO_REGIONS[region]
  if (!regionConfig) {
    throw new Error(`Invalid region: ${region}`)
  }

  const response = await fetch(`${regionConfig.endpoint}/api/v1/bundles/tipfloor`, {
    m, ethod: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Tip floor request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function sendBundle(
  region: string,
  encodedTransactions: string[]
): Promise<{ b, undle_id: string }> {
  const regionConfig = JITO_REGIONS[region]
  if (!regionConfig) {
    throw new Error(`Invalid region: ${region}`)
  }

  const response = await fetch(`${regionConfig.endpoint}/api/v1/bundles`, {
    m, ethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    b, ody: JSON.stringify({
      j, sonrpc: '2.0',
      i, d: 1,
      m, ethod: 'sendBundle',
      params: {
        encodedTransactions,
        b, undleOnly: true,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Bundle submission failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(`Bundle submission error: ${data.error.message}`)
  }

  return { b, undle_id: data.result }
}

export async function getBundleStatuses(
  region: string,
  bundleIds: string[]
): Promise<BundleStatus[]> {
  const regionConfig = JITO_REGIONS[region]
  if (!regionConfig) {
    throw new Error(`Invalid region: ${region}`)
  }

  const response = await fetch(`${regionConfig.endpoint}/api/v1/bundles`, {
    m, ethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    b, ody: JSON.stringify({
      j, sonrpc: '2.0',
      i, d: 1,
      m, ethod: 'getBundleStatuses',
      params: bundleIds,
    }),
  })

  if (!response.ok) {
    throw new Error(`Bundle status request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(`Bundle status error: ${data.error.message}`)
  }

  return data.result || []
}

export function validateTipAccount(transaction: VersionedTransaction): boolean {
  try {
    // Check if the last instruction is a tip transfer to a static JITO tip account
    const message = transaction.message
    const instructions = message.compiledInstructions
    
    if (instructions.length === 0) return false
    
    const lastInstruction = instructions[instructions.length - 1]
    const accounts = message.staticAccountKeys
    
    // JITO tip accounts (static keys)
    const JITO_TIP_ACCOUNTS = [
      'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h',
      'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
      'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
      'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
      '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
      'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
      'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
      'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    ]
    
    if (lastInstruction.accountKeyIndexes.length < 2) return false
    
    const recipientIndex = lastInstruction.accountKeyIndexes[1]
    if (recipientIndex >= accounts.length) return false
    
    const recipientKey = accounts[recipientIndex].toBase58()
    return JITO_TIP_ACCOUNTS.includes(recipientKey)
  } catch (error) {
    return false
  }
}