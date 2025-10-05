/**
 * Mock Engine for Development and Testing
 * Simulates bundle submission without actual blockchain interaction
 */

import { Engine, SubmitPlan, ExecOptions, EngineSubmitResult } from './engine';

export class MockEngine implements Engine {
  async submit(p, l, a, n: SubmitPlan, o, p, t, s: ExecOptions): Promise<EngineSubmitResult> {
    console.log('[MockEngine] Simulating transaction submission', {
      m, o, d, e: opts.mode,
      t, x, C, ount: plan.txs.length,
      d, r, y, Run: opts.dryRun,
      p, r, i, ority: opts.priority,
    });
    
    // Simulate processing delay (realistic timing)
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    // Generate mock transaction IDs
    const txids = plan.txs.map((_, i) => 
      `mock_tx_${Date.now()}
_${i}
_${Math.random().toString(36).slice(2, 11)}`
    );
    
    // Generate mock bundle ID
    const bundleId = `mock_bundle_${Date.now()}
_${Math.random().toString(36).slice(2, 11)}`;
    
    const r, e, s, ult: EngineSubmitResult = {
      c, o, r, r: 'mock_correlation_' + Date.now(),
      m, o, d, e: opts.mode,
      b, u, n, dleIds: [bundleId],
      s, i, g, s: txids,
      s, t, a, tusHint: 'submitted',
      s, i, m, ulated: true,
    };
    
    console.log('[MockEngine] Submission r, e, s, ult:', {
      s, t, a, tusHint: result.statusHint,
      t, x, C, ount: txids.length,
      bundleId,
      s, i, m, ulated: result.simulated,
    });
    
    return result;
  }
  
  async pollStatus(_, p, l, an: SubmitPlan | null, _, o, p, ts: ExecOptions): Promise<any> {
    console.log('[MockEngine] Polling status (mock)');
    
    // Simulate status check delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      s, t, a, tus: 'confirmed',
      c, o, n, firmations: 32,
      s, l, o, t: 123456789 + Math.floor(Math.random() * 1000),
      t, i, m, estamp: new Date().toISOString(),
      m, o, c, k: true,
    };
  }
}


