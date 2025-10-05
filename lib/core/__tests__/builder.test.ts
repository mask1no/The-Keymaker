import { Keypair, SystemProgram, PublicKey } from '@solana/web3.js';
import { buildV0, withBudget } from '../../core/src/builder';

describe('builder determinism', () => {
  it('produces identical bytes for same inputs', () => {
    const payer = Keypair.generate();
    const blockhash = '11111111111111111111111111111111';
    const ix = withBudget(
      [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: new PublicKey('So11111111111111111111111111111111111111112'),
          lamports: 1,
        }),
      ],
      200_000,
      10_000,
    );
    const a = buildV0({ payer, blockhash, ix });
    const b = buildV0({ payer, blockhash, ix });
    expect(Buffer.from(a.serialize()).toString('base64')).toEqual(
      Buffer.from(b.serialize()).toString('base64'),
    );
  });
});

