import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getTipFloor, sendBundle, getBundleStatuses, validateTipAccount } from './jitoService';
import {
  VersionedTransaction,
  TransactionMessage,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';

// Mock fetch globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = global as any;

beforeEach(() => {
  globalAny.fetch = jest.fn();
  jest.useFakeTimers();
});

describe('jitoService', () => {
  describe('getTipFloor', () => {
    it('fetches tip floor successfully', async () => {
      const mockResponse = {
        landed_tips_25th_percentile: 1000,
        landed_tips_50th_percentile: 2000,
        landed_tips_75th_percentile: 3000,
        ema_landed_tips_50th_percentile: 2500,
      };
      (globalAny.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      const result = await getTipFloor('ffm');
      expect(globalAny.fetch).toHaveBeenCalled();
      const firstUrl = (globalAny.fetch as jest.Mock).mock.calls[0][0];
      expect(String(firstUrl)).toContain('tipfloor');
      expect(result).toEqual(mockResponse);
    });

    it('uses cache within TTL', async () => {
      const mockResponse = {
        landed_tips_25th_percentile: 1,
        landed_tips_50th_percentile: 2,
        landed_tips_75th_percentile: 3,
        ema_landed_tips_50th_percentile: 2,
      };
      (globalAny.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      const a = await getTipFloor('ffm');
      const b = await getTipFloor('ffm');
      expect(a).toEqual(b);
      expect((globalAny.fetch as jest.Mock).mock.calls.length).toBeLessThanOrEqual(1);
    });
  });

  describe('sendBundle', () => {
    it('sends bundle successfully', async () => {
      const mockBundleId = 'mock-bundle-id';
      (globalAny.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: mockBundleId }),
      });
      const result = await sendBundle('ffm', ['encoded-tx-1', 'encoded-tx-2']);
      expect(result).toEqual({ bundle_id: mockBundleId });
    });
  });

  describe('getBundleStatuses', () => {
    it('gets bundle statuses successfully (object params)', async () => {
      const mockStatuses = [
        {
          bundle_id: 'bundle-1',
          transactions: [{ signature: 'sig-1', confirmation_status: 'confirmed' }],
          confirmation_status: 'landed',
          slot: 12345,
        },
      ];
      (globalAny.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: mockStatuses }),
      });
      const result = await getBundleStatuses('ffm', ['bundle-1']);
      expect(result).toEqual(mockStatuses);
    });
  });

  describe('validateTipAccount', () => {
    it('validates transaction with valid tip account', () => {
      const tipAccount = new PublicKey('HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe');
      const payer = new PublicKey('11111111111111111111111111111112');
      const message = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: '11111111111111111111111111111111',
        instructions: [
          SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: tipAccount,
            lamports: 1000,
          }),
        ],
      }).compileToV0Message();
      const tx = new VersionedTransaction(message);
      const result = validateTipAccount(tx);
      expect(result).toBe(true);
    });

    it('rejects transaction with invalid tip account', () => {
      const invalidAccount = new PublicKey('11111111111111111111111111111112');
      const payer = new PublicKey('11111111111111111111111111111113');
      const message = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: '11111111111111111111111111111111',
        instructions: [
          SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: invalidAccount,
            lamports: 1000,
          }),
        ],
      }).compileToV0Message();
      const tx = new VersionedTransaction(message);
      const result = validateTipAccount(tx);
      expect(result).toBe(false);
    });
  });
});
