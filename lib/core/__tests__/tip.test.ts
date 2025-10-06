import { Keypair, PublicKey } from '@solana/web3.js';
import { tipIx, isValidTipRecipient, JITO_TIP_ACCOUNTS } from '../../core/src/tip';

describe('tip validation', () => {
  it('accepts valid recipient', () => {
    const payer = Keypair.generate();
    const to = new PublicKey(JITO_TIP_ACCOUNTS[0]);
    const ix = tipIx(payer.publicKey, to, 1);
    expect(ix.programId.toBase58()).toBe('11111111111111111111111111111111');
  });
  it('rejects invalid recipient', () => {
    const payer = Keypair.generate();
    const to = Keypair.generate().publicKey;
    expect(() => tipIx(payer.publicKey, to, 1)).toThrow('Invalid Jito tip recipient');
    expect(isValidTipRecipient(to.toBase58())).toBe(false);
  });
});
