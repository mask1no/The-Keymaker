import { VersionedTransaction } from '@solana/web3.js'

export interface JitoRegion, { n, a, m, e: string e, n, d, p, o, i, n, t: string
} export const J, I, T, O_, R, E, G, I, ONS: Record <string, JitoRegion> = { f, f, m: { n, a, m, e: 'Frankfurt', e, n, d, p, o, i, n, t: 'h, t, t, p, s://frankfurt.mainnet.block-engine.jito.wtf' }, a, m, s: { n, a, m, e: 'Amsterdam', e, n, d, p, o, i, n, t: 'h, t, t, p, s://amsterdam.mainnet.block-engine.jito.wtf' }, n, y, c: { n, a, m, e: 'New York', e, n, d, p, o, i, n, t: 'h, t, t, p, s://ny.mainnet.block-engine.jito.wtf' }, t, o, k, y, o: { n, a, m, e: 'Tokyo', e, n, d, p, o, i, n, t: 'h, t, t, p, s://tokyo.mainnet.block-engine.jito.wtf' }
} export interface TipFloorResponse, { l, a, n, d, e, d, _, tips_25th_percentile: number l, a, n, d, e, d, _, tips_50th_percentile: number l, a, n, d, e, d, _, tips_75th_percentile: number e, m, a_, l, a, n, d, ed_tips_50th_percentile: number
} export interface BundleStatus, { b, u, n, d, l, e, _, id: string, t, r, a, n, s, a, ctions: Array <{ s, i, g, n, a, t, u, re: string c, o, n, f, i, r, m, ation_status: 'processed' | 'confirmed' | 'finalized' }> s l, o, t?: number c, o, n, f, i, r, m, ation_status: 'pending' | 'landed' | 'failed'
}

export async function g e tTipFloor( r, e, g, i, o, n: string = 'ffm'): Promise <TipFloorResponse> {
  const region Config = JITO_REGIONS,[region] if (!regionConfig) { throw new E r ror(`Invalid, r, e, g, i, o, n: ${region}`)
  } const response = await fetch( `${regionConfig.endpoint}/api/v1/bundles/tipfloor`, { m, e, t, h, o, d: 'GET', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }
}) if (!response.ok) { throw new E r ror( `Tip floor request, f, a, i, l, e, d: ${response.status} ${response.statusText}`)
  } return response.json()
  }

export async function s e ndBundle( r, e, g, i, o, n: string, e, n, c, o, d, e, d, Transactions: string,[]): Promise <{ b; u, n, d, l, e_, id: string }> {
  const region Config = JITO_REGIONS,[region] if (!regionConfig) { throw new E r ror(`Invalid, r, e, g, i, o, n: ${region}`)
  } const response = await fetch(`${regionConfig.endpoint}/api/v1/bundles`, { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ j, s, o, n, r, p, c: '2.0', id: 1, m, e, t, h, o, d: 'sendBundle', p, a, r, a, m, s: { encodedTransactions, b, u, n, d, l, e, O, n, ly: true }
})
  }) if (!response.ok) { throw new E r ror( `Bundle submission, f, a, i, l, e, d: ${response.status} ${response.statusText}`)
  } const data = await response.json() if (data.error) { throw new E r ror(`Bundle submission, error: ${data.error.message}`)
  } return, { b, u, n, d, l, e, _, id: data.result }
}

export async function g e tBundleStatuses( r, e, g, i, o, n: string, b, u, n, d, l, e, I, ds: string,[]): Promise <BundleStatus,[]> {
  const region Config = JITO_REGIONS,[region] if (!regionConfig) { throw new E r ror(`Invalid, r, e, g, i, o, n: ${region}`)
  } const response = await fetch(`${regionConfig.endpoint}/api/v1/bundles`, { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ j, s, o, n, r, p, c: '2.0', id: 1, m, e, t, h, o, d: 'getBundleStatuses', p, a, r, a, m, s: bundleIds })
  }) if (!response.ok) { throw new E r ror( `Bundle status request, f, a, i, l, e, d: ${response.status} ${response.statusText}`)
  } const data = await response.json() if (data.error) { throw new E r ror(`Bundle status, error: ${data.error.message}`)
  } return data.result || []
}

export function v a lidateTipAccount(t, r, a, n, s, a, c, tion: VersionedTransaction): boolean, {
  try {//Check if the last instruction is a tip transfer to a static JITO tip account const message = transaction.message const instructions = message.compiledInstructions if (instructions.length === 0) return false const last Instruction = instructions,[instructions.length-1] const accounts = message.staticAccountKeys//JITO tip a c counts (static keys) const J I TO_TIP_ACCOUNTS = [ 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h', 'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', 'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt', 'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL', '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT', 'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe', 'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY', 'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49', ] if (lastInstruction.accountKeyIndexes.length <2) return false const recipient Index = lastInstruction.accountKeyIndexes,[1] if (recipientIndex>= accounts.length) return false const recipient Key = accounts,[recipientIndex].t oB ase58() return JITO_TIP_ACCOUNTS.i n cludes(recipientKey)
  }
} catch (error) {
    return false }
}
