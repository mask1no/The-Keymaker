import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeJitoBundle } from '@/lib/core/src/jitoBundle';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { buildJupiterSwapTx } from '@/lib/core/src/jupiterAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JitoBuySchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  amountSol: z.number().positive(),
  slippageBps: z.number().min(0).max(10000).default(150),
  tipLamports: z.number().min(0).optional(),
  region: z.enum(['ny', 'ams', 'ffm', 'tokyo']).default('ny'),
  chunkSize: z.number().min(1).max(5).default(5),
  dryRun: z.boolean().default(true), // SAFE DEFAULT
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

/**
 * POST /api/engine/jito/buy
 * Execute Jito bundle buy across multiple wallets
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = JitoBuySchema.parse(body);
    
    // Validate group
    const group = getWalletGroup(params.groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    const walletPubkeys = group.executionWallets;
    if (walletPubkeys.length === 0) {
      return NextResponse.json(
        { error: 'No execution wallets in group' },
        { status: 400 }
      );
    }
    
    // Load keypairs
    const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys);
    if (keypairs.length === 0) {
      return NextResponse.json(
        { error: 'Failed to load wallet keypairs' },
        { status: 500 }
      );
    }
    
    // Build all transactions
    const transactions = await Promise.all(
      keypairs.map(async (wallet) => {
        return buildJupiterSwapTx({
          wallet,
          inputMint: 'So11111111111111111111111111111111111111112', // SOL
          outputMint: params.mint,
          amountSol: params.amountSol,
          slippageBps: params.slippageBps,
          cluster: params.cluster,
        });
      })
    );
    
    // Execute bundle
    const result = await executeJitoBundle({
      transactions,
      tipLamports: params.tipLamports,
      region: params.region,
      chunkSize: params.chunkSize,
      dryRun: params.dryRun,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
