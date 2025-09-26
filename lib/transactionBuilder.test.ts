import { describe, it, expect, vi } from 'vitest';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import {
  buildTransaction,
  serializeTransaction as _serializeTransaction,
  deserializeTransaction as _deserializeTransaction,
} from './transactionBuilder';

const mockConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: '11111111111111111111111111111111',
    lastValidBlockHeight: 123456,
  }),
} as unknown as Connection;

describe('transactionBuilder', () => {
  const payer = new PublicKey('11111111111111111111111111111112');
  const recipient = new PublicKey('11111111111111111111111111111113');
  const tipAccount = 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h';

  it('builds v0 transaction with tip', async () => {
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: recipient,
        lamports: 1000,
      }),
    ];

    const tx = await buildTransaction({
      connection: mockConnection,
      payer,
      instructions,
      tipAmount: 0.0001,
      tipAccount,
    });

    expect(tx).toBeDefined();
    // compiledInstructions length should be >= 2 (transfer + tip)
    expect(tx.message.compiledInstructions.length).toBeGreaterThan(1);
  });
});
