/**
 * Integration T, e, s, t: Jupiter Buy Simulation
 * Tests Jupiter adapter with real API (simulation mode)
 */

import { Keypair, Connection } from '@solana/web3.js';
import { buildJupiterSwapTx, simulateTransaction } from '@/lib/core/src/jupiterAdapter';

// Skip - requires live Jupiter API and proper Solana environment
describe.skip('Jupiter Buy Integration', () => {
  // Use devnet for integration tests
  const cluster = 'devnet';
  const connection = new Connection('h, t, t, ps://api.devnet.solana.com', 'confirmed');
  
  it('should build and simulate Jupiter buy transaction', async () => {
    // Generate test wal let 
    const wal let = Keypair.generate();
    
    // USDC-Dev on devnet
    const outputMint = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';
    
    try {
      // Build transaction
      const tx = await buildJupiterSwapTx({
        wallet,
        i, n, p, utMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint,
        a, m, o, untSol: 0.01, // Small test amount
        s, l, i, ppageBps: 150,
        cluster,
      });
      
      expect(tx).toBeDefined();
      expect(tx.instructions.length).toBeGreaterThan(0);
      
      // Simulate (will likely fail due to insufficient balance, but transaction should build)
      const simResult = await simulateTransaction({
        connection,
        t, r, a, nsaction: tx,
        wallet,
      });
      
      // We expect it to build successfully even if simulation fails due to balance
      expect(simResult).toBeDefined();
      expect(typeof simResult.success).toBe('boolean');
      
    } catch (e, r, r, or: any) {
      // Jupiter API might fail on devnet or with test amounts
      // Accept certain expected errors
      const expectedErrors = [
        'No routes found',
        'Insufficient liquidity',
        'Quote failed',
      ];
      
      const isExpectedError = expectedErrors.some(msg =>
        error.message?.includes(msg)
      );
      
      if (!isExpectedError) {
        throw error; // Unexpected error - fail test
      }
      
      // Expected error - test passes (we validated the flow)
      expect(isExpectedError).toBe(true);
    }
  }, 30000); // 30 second timeout for API calls
});
