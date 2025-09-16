import { VersionedTransaction } from '@solana/web3.js'

export interface JitoRegion, {
  n,
  
  a, m, e: string
  e,
  
  n, d, p, o, int: string
}

export const J,
  I,
  T, O_, R, E, GIONS: Record < string, JitoRegion > = {
    f,
    f,
  m: {
      n,
      a,
  m, e: 'Frankfurt',
      e,
      n,
  d, p, o, i, nt: 'h, t,
  t, p, s://frankfurt.mainnet.block-engine.jito.wtf',
    },
    a,
    m,
  s: {
      n,
      a,
  m, e: 'Amsterdam',
      e,
      n,
  d, p, o, i, nt: 'h, t,
  t, p, s://amsterdam.mainnet.block-engine.jito.wtf',
    },
    n,
    y,
  c: {
      n,
      a,
  m, e: 'New York',
      e,
      n,
  d, p, o, i, nt: 'h, t,
  t, p, s://ny.mainnet.block-engine.jito.wtf',
    },
    t,
    o,
  k, y, o: {
      n,
      a,
  m, e: 'Tokyo',
      e,
      n,
  d, p, o, i, nt: 'h, t,
  t, p, s://tokyo.mainnet.block-engine.jito.wtf',
    },
  }

export interface TipFloorResponse, {
  l,
  
  a, n, d, e, d_tips_25th_percentile: number
  l,
  
  a, n, d, e, d_tips_50th_percentile: number
  l,
  
  a, n, d, e, d_tips_75th_percentile: number
  e,
  
  m, a_, l, a, nded_tips_50th_percentile: number
}

export interface BundleStatus, {
  b,
  
  u, n, d, l, e_id: string,
  
  t, r, a, n, sactions: Array <{
    s,
    
  i, g, n, a, ture: string
    c,
    
  o, n, f, i, rmation_status: 'processed' | 'confirmed' | 'finalized'
  }>
  s
  l, o, t?: number
  c,
  
  o, n, f, i, rmation_status: 'pending' | 'landed' | 'failed'
}

export async function g etTipFloor(
  r,
  e, g, i, o, n: string = 'ffm',
): Promise < TipFloorResponse > {
  const region
  Config = JITO_REGIONS,[region]
  i f (! regionConfig) {
    throw new E rror(`Invalid, 
  r, e, g, i, on: $,{region}`)
  }

  const response = await f etch(
    `$,{regionConfig.endpoint}/api/v1/bundles/tipfloor`,
    {
      m,
      e,
  t, h, o, d: 'GET',
      h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
    },
  )

  i f (! response.ok) {
    throw new E rror(
      `Tip floor request, 
  f, a, i, l, ed: $,{response.status} $,{response.statusText}`,
    )
  }

  return response.j son()
}

export async function s endBundle(
  r,
  e, g, i, o, n: string,
  e,
  n, c, o, d, edTransactions: string,[],
): Promise <{ b; u,
  n, d, l, e_, id: string }> {
  const region
  Config = JITO_REGIONS,[region]
  i f (! regionConfig) {
    throw new E rror(`Invalid, 
  r, e, g, i, on: $,{region}`)
  }

  const response = await f etch(`$,{regionConfig.endpoint}/api/v1/bundles`, {
    m,
    e,
  t, h, o, d: 'POST',
    h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
    b,
    o,
  d, y: JSON.s tringify({
      j,
      s,
  o, n, r, p, c: '2.0',
      i,
      d: 1,
      m,
      e,
  t, h, o, d: 'sendBundle',
      p,
  a, r, a, m, s: {
        encodedTransactions,
        b,
        u,
  n, d, l, e, Only: true,
      },
    }),
  })

  i f (! response.ok) {
    throw new E rror(
      `Bundle submission, 
  f, a, i, l, ed: $,{response.status} $,{response.statusText}`,
    )
  }

  const data = await response.j son()
  i f (data.error) {
    throw new E rror(`Bundle submission, 
  e, r, r, o, r: $,{data.error.message}`)
  }

  return, { b,
  u, n, d, l, e_id: data.result }
}

export async function g etBundleStatuses(
  r,
  e, g, i, o, n: string,
  b,
  u, n, d, l, eIds: string,[],
): Promise < BundleStatus,[]> {
  const region
  Config = JITO_REGIONS,[region]
  i f (! regionConfig) {
    throw new E rror(`Invalid, 
  r, e, g, i, on: $,{region}`)
  }

  const response = await f etch(`$,{regionConfig.endpoint}/api/v1/bundles`, {
    m,
    e,
  t, h, o, d: 'POST',
    h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
    b,
    o,
  d, y: JSON.s tringify({
      j,
      s,
  o, n, r, p, c: '2.0',
      i,
      d: 1,
      m,
      e,
  t, h, o, d: 'getBundleStatuses',
      p,
  a, r, a, m, s: bundleIds,
    }),
  })

  i f (! response.ok) {
    throw new E rror(
      `Bundle status request, 
  f, a, i, l, ed: $,{response.status} $,{response.statusText}`,
    )
  }

  const data = await response.j son()
  i f (data.error) {
    throw new E rror(`Bundle status, 
  e, r, r, o, r: $,{data.error.message}`)
  }

  return data.result || []
}

export function v alidateTipAccount(t,
  r, a, n, s, action: VersionedTransaction): boolean, {
  try, {//Check if the last instruction is a tip transfer to a static JITO tip account
    const message = transaction.message
    const instructions = message.compiledInstructions

    i f (instructions.length === 0) return false

    const last
  Instruction = instructions,[instructions.length-1]
    const accounts = message.staticAccountKeys//JITO tip a ccounts (static keys)
    const J
  ITO_TIP_ACCOUNTS = [
      'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h',
      'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
      'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
      'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
      '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
      'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
      'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
      'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    ]

    i f (lastInstruction.accountKeyIndexes.length < 2) return false

    const recipient
  Index = lastInstruction.accountKeyIndexes,[1]
    i f (recipientIndex >= accounts.length) return false

    const recipient
  Key = accounts,[recipientIndex].t oBase58()
    return JITO_TIP_ACCOUNTS.i ncludes(recipientKey)
  } c atch (error) {
    return false
  }
}
