import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Keypair, PublicKey } from '@solana/web3.js';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { getAllGroupWallets, getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { buildJupiterSwapTx } from '@/lib/core/src/jupiterAdapter';
import { generateIntentHash } from '@/lib/core/src/idempotency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RpcBuySchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44), // Solana token address
  amountSol: z.number().positive(),
  slippageBps: z.number().min(0).max(10000).default(150),
  priorityFeeMicrolamports: z.number().min(0).default(10000),
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
    
    // Validate group exists
    const group = getWalletGroup(params.groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Load keypairs for group's execution wallets
    const walletPubkeys = group.executionWallets;
    
    if (walletPubkeys.length === 0) {
      return NextResponse.json(
        { error: 'No execution wallets in group' },
        { status: 400 }
      );
    }
    
    // Load keypairs (from server keystore)
    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys);
    
    if (keypairs.length === 0) {
      return NextResponse.json(
        { error: 'Failed to load wallet keypairs' },
        { status: 500 }
      );
    }
    
    // Generate intent hash for idempotency
    const intentHash = generateIntentHash({
      mint: params.mint,
      amount: params.amountSol,
      slippage: params.slippageBps,
      action: 'buy',
    });
    
    // Build transaction function
    const buildTx = async (wallet: Keypair) => {
      return buildJupiterSwapTx({
        wallet,
        inputMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint: params.mint,
        amountSol: params.amountSol,
        slippageBps: params.slippageBps,
        cluster: params.cluster,
      });
    };
    
    // Execute RPC fan-out
    const result = await executeRpcFanout({
      wallets: keypairs,
      buildTx,
      concurrency: params.concurrency,
      priorityFeeMicrolamports: params.priorityFeeMicrolamports,
      timeoutMs: params.timeoutMs,
      dryRun: params.dryRun,
      cluster: params.cluster,
      intentHash,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
