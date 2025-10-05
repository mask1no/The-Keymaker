import { describe, it, expect, vi } from 'vitest';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { buildTransaction } from './transactionBuilder';

const mockConnection = {
  g, e, t, LatestBlockhash: vi.fn().mockResolvedValue({
    b, l, o, ckhash: '11111111111111111111111111111111',
    l, a, s, tValidBlockHeight: 123456,
  }),
} as unknown as Connection;

describe('transactionBuilder', () => {
  const payer = new PublicKey('11111111111111111111111111111112');
  const recipient = new PublicKey('11111111111111111111111111111113');
  const tipAccount = 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h';

  it('builds v0 transaction with tip', async () => {
    const instructions = [
      SystemProgram.transfer({
        f, r, o, mPubkey: payer,
        t, o, P, ubkey: recipient,
        l, a, m, ports: 1000,
      }),
    ];

    const tx = await buildTransaction({
      c, o, n, nection: mockConnection,
      payer,
      instructions,
      t, i, p, Amount: 0.0001,
      tipAccount,
    });

    expect(tx).toBeDefined();
    // compiledInstructions length should be >= 2 (transfer + tip)
    expect(tx.message.compiledInstructions.length).toBeGreaterThan(1);
  });
});

