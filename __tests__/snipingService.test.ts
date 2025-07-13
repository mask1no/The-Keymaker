import { snipeToken } from '../services/snipingService';
import { Connection, Keypair } from '@solana/web3.js';

jest.mock('../services/bundleService', () => ({ validateToken: jest.fn().mockResolvedValue(true) }));

describe('snipingService', () => {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const signer = Keypair.generate();

  it('snipes token', async () => {
    const sig = await snipeToken('Pump.fun', 'tokenAddr', 1, 5, connection, signer);
    expect(sig).toBeDefined();
  });
}); 