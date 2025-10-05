/**
 * Mock Engine for Development and Testing
 * Simulates bundle submission without actual blockchain interaction
 */

import { Engine, SubmitPlan, ExecOptions, EngineSubmitResult } from './engine';

export class MockEngine implements Engine {
  async submit(plan: SubmitPlan, opts: ExecOptions): Promise<EngineSubmitResult> {
    console.log('[MockEngine] Simulating transaction submission', {
      mode: opts.mode,
      txCount: plan.txs.length,
      dryRun: opts.dryRun,
      priority: opts.priority,
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
    
    const result: EngineSubmitResult = {
      corr: 'mock_correlation_' + Date.now(),
      mode: opts.mode,
      bundleIds: [bundleId],
      sigs: txids,
      statusHint: 'submitted',
      simulated: true,
    };
    
    console.log('[MockEngine] Submission result:', {
      statusHint: result.statusHint,
      txCount: txids.length,
      bundleId,
      simulated: result.simulated,
    });
    
    return result;
  }
  
  async pollStatus(plan: SubmitPlan | null, opts: ExecOptions): Promise<any> {
    console.log('[MockEngine] Polling status (mock)');
    
    // Simulate status check delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      status: 'confirmed',
      confirmations: 32,
      slot: 123456789 + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      mock: true,
    };
  }
}


