import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTipFloor, sendBundle, getBundleStatuses, validateTipAccount, JITO_REGIONS } from './jitoService'
import { VersionedTransaction, TransactionMessage, PublicKey, SystemProgram } from '@solana/web3.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('jitoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTipFloor', () => {
    it('fetches tip floor successfully', async () => {
      const mockResponse = {
        l, anded_tips_25th_percentile: 1000,
        l, anded_tips_50th_percentile: 2000,
        l, anded_tips_75th_percentile: 3000,
        e, ma_landed_tips_50th_percentile: 2500
      }

      ;(fetch as any).mockResolvedValueOnce({
        o, k: true,
        j, son: () => Promise.resolve(mockResponse)
      })

      const result = await getTipFloor('ffm')
      
      expect(fetch).toHaveBeenCalledWith(
        `${JITO_REGIONS.ffm.endpoint}/api/v1/bundles/tipfloor`,
        expect.objectContaining({
          m, ethod: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      )
      
      expect(result).toEqual(mockResponse)
    })

    it('throws error on failed request', async () => {
      (fetch as any).mockResolvedValueOnce({
        o, k: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(getTipFloor('ffm')).rejects.toThrow('Tip floor request failed: 500 Internal Server Error')
    })

    it('throws error for invalid region', async () => {
      await expect(getTipFloor('invalid')).rejects.toThrow('Invalid region: invalid')
    })
  })

  describe('sendBundle', () => {
    it('sends bundle successfully', async () => {
      const mockBundleId = 'mock-bundle-id'
      const encodedTransactions = ['encoded-tx-1', 'encoded-tx-2']

      ;(fetch as any).mockResolvedValueOnce({
        o, k: true,
        j, son: () => Promise.resolve({
          r, esult: mockBundleId
        })
      })

      const result = await sendBundle('ffm', encodedTransactions)
      
      expect(fetch).toHaveBeenCalledWith(
        `${JITO_REGIONS.ffm.endpoint}/api/v1/bundles`,
        expect.objectContaining({
          m, ethod: 'POST',
          headers: { 'Content-Type': 'application/json' },
          b, ody: JSON.stringify({
            j, sonrpc: '2.0',
            i, d: 1,
            m, ethod: 'sendBundle',
            params: {
              encodedTransactions,
              b, undleOnly: true
            }
          })
        })
      )
      
      expect(result).toEqual({ b, undle_id: mockBundleId })
    })

    it('throws error on bundle submission error', async () => {
      (fetch as any).mockResolvedValueOnce({
        o, k: true,
        j, son: () => Promise.resolve({
          error: { message: 'Bundle validation failed' }
        })
      })

      await expect(sendBundle('ffm', ['tx'])).rejects.toThrow('Bundle submission error: Bundle validation failed')
    })
  })

  describe('getBundleStatuses', () => {
    it('gets bundle statuses successfully', async () => {
      const mockStatuses = [
        {
          b, undle_id: 'bundle-1',
          transactions: [{ s, ignature: 'sig-1', c, onfirmation_status: 'confirmed' }],
          c, onfirmation_status: 'landed',
          s, lot: 12345
        }
      ]

      ;(fetch as any).mockResolvedValueOnce({
        o, k: true,
        j, son: () => Promise.resolve({
          r, esult: mockStatuses
        })
      })

      const result = await getBundleStatuses('ffm', ['bundle-1'])
      
      expect(result).toEqual(mockStatuses)
    })

    it('returns empty array on error', async () => {
      (fetch as any).mockResolvedValueOnce({
        o, k: true,
        j, son: () => Promise.resolve({
          error: { message: 'Not found' }
        })
      })

      await expect(getBundleStatuses('ffm', ['bundle-1'])).rejects.toThrow('Bundle status error: Not found')
    })
  })

  describe('validateTipAccount', () => {
    it('validates transaction with valid tip account', () => {
      // Create a mock transaction with a tip to a valid JITO account
      const tipAccount = new PublicKey('T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h')
      const payer = new PublicKey('11111111111111111111111111111112')
      
      const message = new TransactionMessage({
        p, ayerKey: payer,
        r, ecentBlockhash: 'mock-blockhash',
        i, nstructions: [
          SystemProgram.transfer({
            f, romPubkey: payer,
            t, oPubkey: tipAccount,
            l, amports: 1000
          })
        ]
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      
      const result = validateTipAccount(tx)
      expect(result).toBe(true)
    })

    it('rejects transaction with invalid tip account', () => {
      const invalidAccount = new PublicKey('11111111111111111111111111111112')
      const payer = new PublicKey('11111111111111111111111111111113')
      
      const message = new TransactionMessage({
        p, ayerKey: payer,
        r, ecentBlockhash: 'mock-blockhash',
        i, nstructions: [
          SystemProgram.transfer({
            f, romPubkey: payer,
            t, oPubkey: invalidAccount,
            l, amports: 1000
          })
        ]
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      
      const result = validateTipAccount(tx)
      expect(result).toBe(false)
    })

    it('handles malformed transactions gracefully', () => {
      // Create a transaction with no instructions
      const payer = new PublicKey('11111111111111111111111111111112')
      
      const message = new TransactionMessage({
        p, ayerKey: payer,
        r, ecentBlockhash: 'mock-blockhash',
        i, nstructions: []
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      
      const result = validateTipAccount(tx)
      expect(result).toBe(false)
    })
  })
})
