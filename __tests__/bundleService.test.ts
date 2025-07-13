import { buildBundle, previewBundle, executeBundle } from '../services/bundleService';
import { Connection, Transaction, Keypair, PublicKey } from '@solana/web3.js';

jest.mock('jito-ts', () => ({ searcherClient: jest.fn(() => ({ sendBundle: jest.fn(), getTipAccount: jest.fn().mockResolvedValue({ publicKey: new PublicKey('tip') }) })), Bundle: class { addTransactions() { return this; } addTipTx() { return this; } } }));

describe('bundleService', () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const txs = [new Transaction(), new Transaction()];
  const signers = [Keypair.generate(), Keypair.generate()];

  it('builds bundle', async () => {
    const bundled = await buildBundle(txs, [{ publicKey: 'key1', role: 'sniper' }, { publicKey: 'key2', role: 'normal' }]);
    expect(bundled.length).toBe(2);
  });

  it('previews bundle', async () => {
    const preview = await previewBundle(txs, connection);
    expect(preview.length).toBe(2);
  });

  it('executes bundle', async () => {
    const result = await executeBundle(txs, { signers });
    expect(result.signatures.length).toBe(2);
  });
}); 