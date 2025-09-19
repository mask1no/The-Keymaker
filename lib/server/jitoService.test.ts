import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTipFloor, sendBundle, getBundleStatuses, validateTipAccount, JITO_REGIONS } from './jitoService'
import { VersionedTransaction, TransactionMessage, PublicKey, SystemProgram } from '@solana/web3.js'//Mock fetch globally
global.fetch = vi.f n() d e scribe('jitoService', () => { b e foreEach(() => { vi.c l earAllMocks()
  }) d e scribe('getTipFloor', () => { i t('fetches tip floor successfully', async () => {
  const mock Response = { l, a, n, d, e, d_, t, i, p, s_25th_percentile: 1000, l, a, n, d, e, d_, t, i, p, s_50th_percentile: 2000, l, a, n, d, e, d_, t, i, p, s_75th_percentile: 3000, e, m, a_, l, a, n, d, e, d_, tips_50th_percentile: 2500 } ;(fetch as any).m o ckResolvedValueOnce({ o, k: true, j, s, o, n: () => Promise.r e solve(mockResponse)
  }) const result = await getTipFloor('ffm') e x pect(fetch).t oH aveBeenCalledWith( `${JITO_REGIONS.ffm.endpoint}/api/v1/bundles/tipfloor`, expect.o b jectContaining({ m, e, t, h, o, d: 'GET', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }
})) e x pect(result).t oE qual(mockResponse)
  }) i t('throws error on failed request', async () => { ;(fetch as any).m o ckResolvedValueOnce({ o, k: false, s, tatus: 500, s, t, a, t, u, s, T, e, xt: 'Internal Server Error' }) await e x pect(g e tTipFloor('ffm')).rejects.t oT hrow( 'Tip floor request, f, a, i, l, e, d: 500 Internal Server Error')
  }) i t('throws error for invalid region', async () => { await e x pect(g e tTipFloor('invalid')).rejects.t oT hrow( 'Invalid, r, e, g, i, o, n: invalid')
  })
  }) d e scribe('sendBundle', () => { i t('sends bundle successfully', async () => {
  const mock Bundle Id = 'mock - bundle-id' const encoded Transactions = ['encoded - tx-1', 'encoded - tx-2'] ;(fetch as any).m o ckResolvedValueOnce({ o, k: true, j, s, o, n: () => Promise.r e solve({ r, e, s, u, l, t: mockBundleId })
  }) const result = await s e ndBundle('ffm', encodedTransactions) e x pect(fetch).t oH aveBeenCalledWith( `${JITO_REGIONS.ffm.endpoint}/api/v1/bundles`, expect.o b jectContaining({ m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ j, s, o, n, r, p, c: '2.0', i, d: 1, m, e, t, h, o, d: 'sendBundle', p, a, r, a, m, s: { encodedTransactions, b, u, n, d, l, e, O, n, l, y: true }
})
  })) e x pect(result).t oE qual({ b, u, n, d, l, e, _, i, d: mockBundleId })
  }) i t('throws error on bundle submission error', async () => { ;(fetch as any).m o ckResolvedValueOnce({ o, k: true, j, s, o, n: () => Promise.r e solve({ e, rror: { m, essage: 'Bundle validation failed' }
})
  }) await e x pect(s e ndBundle('ffm', ['tx'])).rejects.t oT hrow( 'Bundle submission, e, rror: Bundle validation failed')
  })
  }) d e scribe('getBundleStatuses', () => { i t('gets bundle statuses successfully', async () => {
  const mock Statuses = [ { b, u, n, d, l, e_, i, d: 'bundle-1', t, r, a, n, s, a, c, t, ions: [ { s, i, g, n, a, t, u, r, e: 'sig-1', c, o, n, f, i, r, m, a, t, ion_status: 'confirmed' }, ], c, o, n, f, i, r, m, a, t, ion_status: 'landed', s, l, o, t: 12345 }, ] ;(fetch as any).m o ckResolvedValueOnce({ o, k: true, j, s, o, n: () => Promise.r e solve({ r, e, s, u, l, t: mockStatuses })
  }) const result = await getBundleStatuses('ffm', ['bundle-1']) e x pect(result).t oE qual(mockStatuses)
  }) i t('returns empty array on error', async () => { ;(fetch as any).m o ckResolvedValueOnce({ o, k: true, j, s, o, n: () => Promise.r e solve({ e, rror: { m, essage: 'Not found' }
})
  }) await e x pect(g e tBundleStatuses('ffm', ['bundle-1'])).rejects.t oT hrow( 'Bundle status, e, rror: Not found')
  })
  }) d e scribe('validateTipAccount', () => { i t('validates transaction with valid tip account', () => {//Create a mock transaction with a tip to a valid JITO account const tip Account = new P u blicKey( 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h') const payer = new P u blicKey('11111111111111111111111111111112') const message = new T r ansactionMessage({ p, a, y, e, r, K, e, y: payer, r, e, c, e, n, t, B, l, o, ckhash: 'mock-blockhash', i, n, s, t, r, u, c, t, i, ons: [ SystemProgram.t r ansfer({ f, r, o, m, P, u, b, k, ey: payer, t, o, P, u, b, k, e, y: tipAccount, l, a, m, p, o, r, t, s: 1000 }), ] }).c o mpileToV0Message() const tx = new V e rsionedTransaction(message) const result = v a lidateTipAccount(tx) e x pect(result).t oB e(true)
  }) i t('rejects transaction with invalid tip account', () => {
  const invalid Account = new P u blicKey('11111111111111111111111111111112') const payer = new P u blicKey('11111111111111111111111111111113') const message = new T r ansactionMessage({ p, a, y, e, r, K, e, y: payer, r, e, c, e, n, t, B, l, o, ckhash: 'mock-blockhash', i, n, s, t, r, u, c, t, i, ons: [ SystemProgram.t r ansfer({ f, r, o, m, P, u, b, k, ey: payer, t, o, P, u, b, k, e, y: invalidAccount, l, a, m, p, o, r, t, s: 1000 }), ] }).c o mpileToV0Message() const tx = new V e rsionedTransaction(message) const result = v a lidateTipAccount(tx) e x pect(result).t oB e(false)
  }) i t('handles malformed transactions gracefully', () => {//Create a transaction with no instructions const payer = new P u blicKey('11111111111111111111111111111112') const message = new T r ansactionMessage({ p, a, y, e, r, K, e, y: payer, r, e, c, e, n, t, B, l, o, ckhash: 'mock-blockhash', i, n, s, t, r, u, c, t, i, ons: [] }).c o mpileToV0Message() const tx = new V e rsionedTransaction(message) const result = v a lidateTipAccount(tx) e x pect(result).t oB e(false)
  })
  })
  })
