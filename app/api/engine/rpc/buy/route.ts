import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { generateIntentHash } from '@/lib/core/src/idempotency';
import { getUiSettings } from '@/lib/server/settings';
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RpcBuySchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44), // Solana token address
  amountSol: z.number().positive().default(0.001),
  priorityFeeMicrolamports: z.number().min(0).default(0),
  concurrency: z.number().min(1).max(16).default(5),
  timeoutMs: z.number().min(1000).max(120000).default(20000),
  dryRun: z.boolean().default(true), // SAFE DEFAULT
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

/**
 * POST /api/engine/rpc/buy
 * Execute RPC fan-out buy across multiple wallets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = RpcBuySchema.parse(body);
    const ui = getUiSettings();
    
    // Validate group exists
    const group = getWalletGroup(params.groupId);
    if (!group) return apiError(404, 'group_not_found');
    
    // Load keypairs for group's execution wallets
    const walletPubkeys = group.executionWallets;
    
    if (walletPubkeys.length === 0) return apiError(400, 'no_execution_wallets');
    
    // Load keypairs (from server keystore)
    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys);
    
    if (keypairs.length === 0) return apiError(500, 'failed_to_load_keypairs');
    
    // Generate intent hash for idempotency
    const intentHash = generateIntentHash({
      mint: params.mint,
      amount: params.amountSol,
      slippage: params.slippageBps,
      action: 'buy',
    });
    
    // Build a harmless no-op transaction per wallet for simulation
    const buildTx = async (wallet: Keypair) => {
      const tx = new Transaction();
      // Self-transfer of 0 lamports is a no-op but serializable
      tx.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: wallet.publicKey,
          lamports: 0,
        }),
      );
      return tx;
    };
    
    // If live is not allowed, force dryRun
    const allowLive = ui.liveMode === true && (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES' && process.env.KEYMAKER_DISABLE_LIVE !== 'YES';
    const dryRun = params.dryRun || !allowLive;
    if (!dryRun && process.env.KEYMAKER_REQUIRE_ARMING === 'YES') {
      const { isArmed } = await import('@/lib/server/arming');
      if (!isArmed()) return apiError(403, 'not_armed');
    }

    // Execute RPC fan-out
    const result = await executeRpcFanout({
      wallets: keypairs,
      buildTx,
      concurrency: params.concurrency,
      priorityFeeMicrolamports: params.priorityFeeMicrolamports,
      timeoutMs: params.timeoutMs,
      dryRun,
      cluster: params.cluster,
      intentHash,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    try {
      Sentry.captureException(error instanceof Error ? error : new Error('rpc_buy_failed'), { extra: { route: '/api/engine/rpc/buy' } });
    } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
