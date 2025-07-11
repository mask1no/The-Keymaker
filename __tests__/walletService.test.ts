import { createWallet, fundWallets, sendSol } from '../services/walletService';

describe('walletService', () => {
  test('createWallet', async () => {
    const wallet = await createWallet('testpass');
    expect(wallet.publicKey).toBeDefined();
  });

  // Add more tests for fund and send
}); 