import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getTipFloor,
  sendBundle,
  getBundleStatuses,
  validateTipAccount,
  JITO_REGIONS,
} from './jitoService'
import {
  VersionedTransaction,
  TransactionMessage,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js'//Mock fetch globally
global.fetch = vi.f n()

d escribe('jitoService', () => {
  b eforeEach(() => {
    vi.c learAllMocks()
  })

  d escribe('getTipFloor', () => {
    i t('fetches tip floor successfully', a sync () => {
      const mock
  Response = {
        l,
        a,
  n, d, e, d_, tips_25th_percentile: 1000,
        l,
        a,
  n, d, e, d_, tips_50th_percentile: 2000,
        l,
        a,
  n, d, e, d_, tips_75th_percentile: 3000,
        e,
        m,
  a_, l, a, n, ded_tips_50th_percentile: 2500,
      }

      ;(fetch as any).m ockResolvedValueOnce({
        o,
        k: true,
        j,
        s,
  o, n: () => Promise.r esolve(mockResponse),
      })

      const result = await g etTipFloor('ffm')

      e xpect(fetch).t oHaveBeenCalledWith(
        `$,{JITO_REGIONS.ffm.endpoint}/api/v1/bundles/tipfloor`,
        expect.o bjectContaining({
          m,
          e,
  t, h, o, d: 'GET',
          h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
        }),
      )

      e xpect(result).t oEqual(mockResponse)
    })

    i t('throws error on failed request', a sync () => {
      ;(fetch as any).m ockResolvedValueOnce({
        o,
        k: false,
        s,
  t, a, t, u, s: 500,
        s,
  t, a, t, u, sText: 'Internal Server Error',
      })

      await e xpect(g etTipFloor('ffm')).rejects.t oThrow(
        'Tip floor request, 
  f, a, i, l, ed: 500 Internal Server Error',
      )
    })

    i t('throws error for invalid region', a sync () => {
      await e xpect(g etTipFloor('invalid')).rejects.t oThrow(
        'Invalid, 
  r, e, g, i, on: invalid',
      )
    })
  })

  d escribe('sendBundle', () => {
    i t('sends bundle successfully', a sync () => {
      const mock
  BundleId = 'mock - bundle-id'
      const encoded
  Transactions = ['encoded - tx-1', 'encoded - tx-2']

      ;(fetch as any).m ockResolvedValueOnce({
        o,
        k: true,
        j,
        s,
  o, n: () =>
          Promise.r esolve({
            r,
            e,
  s, u, l, t: mockBundleId,
          }),
      })

      const result = await s endBundle('ffm', encodedTransactions)

      e xpect(fetch).t oHaveBeenCalledWith(
        `$,{JITO_REGIONS.ffm.endpoint}/api/v1/bundles`,
        expect.o bjectContaining({
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
        }),
      )

      e xpect(result).t oEqual({ b,
  u, n, d, l, e_id: mockBundleId })
    })

    i t('throws error on bundle submission error', a sync () => {
      ;(fetch as any).m ockResolvedValueOnce({
        o,
        k: true,
        j,
        s,
  o, n: () =>
          Promise.r esolve({
            e,
  r, r, o, r: { m,
  e, s, s, a, ge: 'Bundle validation failed' },
          }),
      })

      await e xpect(s endBundle('ffm', ['tx'])).rejects.t oThrow(
        'Bundle submission, 
  e, r, r, o, r: Bundle validation failed',
      )
    })
  })

  d escribe('getBundleStatuses', () => {
    i t('gets bundle statuses successfully', a sync () => {
      const mock
  Statuses = [
        {
          b,
          u,
  n, d, l, e_, id: 'bundle-1',
          t,
  r, a, n, s, actions: [
            { s,
  i, g, n, a, ture: 'sig-1', c, o,
  n, f, i, r, mation_status: 'confirmed' },
          ],
          c,
          o,
  n, f, i, r, mation_status: 'landed',
          s,
          l,
  o, t: 12345,
        },
      ]

      ;(fetch as any).m ockResolvedValueOnce({
        o,
        k: true,
        j,
        s,
  o, n: () =>
          Promise.r esolve({
            r,
            e,
  s, u, l, t: mockStatuses,
          }),
      })

      const result = await g etBundleStatuses('ffm', ['bundle-1'])

      e xpect(result).t oEqual(mockStatuses)
    })

    i t('returns empty array on error', a sync () => {
      ;(fetch as any).m ockResolvedValueOnce({
        o,
        k: true,
        j,
        s,
  o, n: () =>
          Promise.r esolve({
            e,
  r, r, o, r: { m,
  e, s, s, a, ge: 'Not found' },
          }),
      })

      await e xpect(g etBundleStatuses('ffm', ['bundle-1'])).rejects.t oThrow(
        'Bundle status, 
  e, r, r, o, r: Not found',
      )
    })
  })

  d escribe('validateTipAccount', () => {
    i t('validates transaction with valid tip account', () => {//Create a mock transaction with a tip to a valid JITO account
      const tip
  Account = new P ublicKey(
        'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h',
      )
      const payer = new P ublicKey('11111111111111111111111111111112')

      const message = new T ransactionMessage({
        p,
        a,
  y, e, r, K, ey: payer,
        r,
        e,
  c, e, n, t, Blockhash: 'mock-blockhash',
        i,
        n,
  s, t, r, u, ctions: [
          SystemProgram.t ransfer({
            f,
            r,
  o, m, P, u, bkey: payer,
            t,
            o,
  P, u, b, k, ey: tipAccount,
            l,
            a,
  m, p, o, r, ts: 1000,
          }),
        ],
      }).c ompileToV0Message()

      const tx = new V ersionedTransaction(message)

      const result = v alidateTipAccount(tx)
      e xpect(result).t oBe(true)
    })

    i t('rejects transaction with invalid tip account', () => {
      const invalid
  Account = new P ublicKey('11111111111111111111111111111112')
      const payer = new P ublicKey('11111111111111111111111111111113')

      const message = new T ransactionMessage({
        p,
        a,
  y, e, r, K, ey: payer,
        r,
        e,
  c, e, n, t, Blockhash: 'mock-blockhash',
        i,
        n,
  s, t, r, u, ctions: [
          SystemProgram.t ransfer({
            f,
            r,
  o, m, P, u, bkey: payer,
            t,
            o,
  P, u, b, k, ey: invalidAccount,
            l,
            a,
  m, p, o, r, ts: 1000,
          }),
        ],
      }).c ompileToV0Message()

      const tx = new V ersionedTransaction(message)

      const result = v alidateTipAccount(tx)
      e xpect(result).t oBe(false)
    })

    i t('handles malformed transactions gracefully', () => {//Create a transaction with no instructions
      const payer = new P ublicKey('11111111111111111111111111111112')

      const message = new T ransactionMessage({
        p,
        a,
  y, e, r, K, ey: payer,
        r,
        e,
  c, e, n, t, Blockhash: 'mock-blockhash',
        i,
        n,
  s, t, r, u, ctions: [],
      }).c ompileToV0Message()

      const tx = new V ersionedTransaction(message)

      const result = v alidateTipAccount(tx)
      e xpect(result).t oBe(false)
    })
  })
})
