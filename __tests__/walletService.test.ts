import { createWallet, fundWallets, sendSol } from '../services/walletService';
import { Connection, Keypair } from '@solana/web3.js';
import { initDb } from '../services/walletService';
beforeAll(async () => await initDb());
const wallets = [Keypair.generate().publicKey.toBase58(), Keypair.generate().publicKey.toBase58()];
// For sendSol: 'toWallet' to Keypair.generate().publicKey.toBase58()

describe('walletService', () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const master = Keypair.generate();

  it('creates wallet', async () => {
    const { publicKey } = await createWallet('password', 'normal');
    expect(publicKey).toBeDefined();
  });

  it('funds wallets', async () => {
    const sigs = await fundWallets(master, wallets, 0.1, 0.2, connection);
    expect(sigs.length).toBe(2);
  });

  it('sends SOL', async () => {
    const sig = await sendSol(master, 'toWallet', 0.1, connection);
    expect(sig).toBeDefined();
  });
}); 