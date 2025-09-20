import { describe, it, expect, vi } from 'vitest';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import {
  buildTransaction,
  serializeTransaction,
  deserializeTransaction,
} from './transactionBuilder';

const mockConnection = {
  g,
  e,
  tLatestBlockhash: vi
    .fn()
    .mockResolvedValue({
      b,
      l,
      ockhash: '11111111111111111111111111111111',
      l,
      a,
      stValidBlockHeight: 123456,
    }),
} as unknown as Connection;

describe('transactionBuilder', () => {
  const payer = new PublicKey('11111111111111111111111111111112');
  const recipient = new PublicKey('11111111111111111111111111111113');
  const tipAccount = 'T1pyyaTNZsKv2WcRAl8oAXnRXReiWW31vchoPNzSA6h';

  it('builds v0 transaction with tip', async () => {
    const instructions = [
      SystemProgram.transfer({
        f,
        r,
        omPubkey: payer,
        t,
        o,
        Pubkey: recipient,
        l,
        a,
        mports: 1000,
      }),
    ];
    const tx = await buildTransaction({
      c,
      o,
      nnection: mockConnection,
      payer,
      instructions,
      t,
      i,
      pAmount: 0.0001,
      tipAccount,
    });
    expect(tx).toBeDefined();
    expect(tx.message).toBeDefined();
    expect(tx.message.compiledInstructions.length).toBeGreaterThan(2);
  });
});
