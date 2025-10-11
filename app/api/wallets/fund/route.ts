import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';
import { z } from 'zod';
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  Keypair,
} from '@solana/web3.js';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';

export const runtime = 'nodejs';

const BodySchema = z.object({
  groupId: z.string().optional(),
  walletPubkeys: z.array(z.string()).optional(),
  strategy: z.enum(['equal', 'per_wallet', 'target', 'volume_stipend']),
  totalSol: z.number().positive().optional(),
  perWallet: z.number().positive().optional(),
  targetSol: z.number().positive().optional(),
  volumeRunId: z.string().optional(),
  jitterPct: z.number().min(0).max(50).default(10),
  masterReserveSol: z.number().nonnegative().default(0.1),
  feePreset: z.enum(['low', 'med', 'high', 'vhigh']).default('med').optional(),
  turbo: z.boolean().default(false).optional(),
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateAmounts(
  strategy: string,
  walletsCount: number,
  totalSol?: number,
  perWallet?: number,
  targetSol?: number,
  jitterPct = 10,
): number[] {
  const amounts: number[] = [];

  if (strategy === 'equal' && totalSol) {
    const basePerWallet = totalSol / walletsCount;
    for (let i = 0; i < walletsCount; i++) {
      const jitter = 1 + (Math.random() * 2 - 1) * (jitterPct / 100);
      amounts.push(basePerWallet * jitter);
    }
    const sum = amounts.reduce((a, b) => a + b, 0);
    const diff = totalSol - sum;
    amounts[0] += diff;
  } else if (strategy === 'per_wallet' && perWallet) {
    for (let i = 0; i < walletsCount; i++) {
      const jitter = 1 + (Math.random() * 2 - 1) * (jitterPct / 100);
      amounts.push(perWallet * jitter);
    }
  } else if (strategy === 'target' && targetSol) {
    for (let i = 0; i < walletsCount; i++) {
      const jitter = 1 + (Math.random() * 2 - 1) * (jitterPct / 100);
      amounts.push(targetSol * jitter);
    }
  } else {
    throw new Error('invalid_strategy_params');
  }

  return amounts.map((a) => Math.floor(a * 1e9));
}

export const POST = withSessionAndLimit(async (req: NextRequest, sid: string) => {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return { error: 'bad_request', details: parsed.error.flatten() };
  }

  const data = parsed.data;
  let wallets: string[] = [];
  let masterPubkey: string | null = null;

  if (data.groupId) {
    const group = getWalletGroup(data.groupId);
    if (!group) return { error: 'group_not_found' };
    if (!group.masterWallet) return { error: 'no_master_wallet' };
    if (group.masterWallet !== sid) return { error: 'forbidden' };
    wallets = group.executionWallets;
    masterPubkey = group.masterWallet;
  } else if (data.walletPubkeys) {
    wallets = data.walletPubkeys;
  }

  if (wallets.length === 0) {
    return { error: 'no_wallets' };
  }

  const amounts = calculateAmounts(
    data.strategy,
    wallets.length,
    data.totalSol,
    data.perWallet,
    data.targetSol,
    data.jitterPct,
  );

  const totalNeeded = amounts.reduce((a, b) => a + b, 0);
  const batches: Array<{ wallet: string; lamports: number }[]> = [];
  const batchSize = 10;

  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize).map((w, idx) => ({
      wallet: w,
      lamports: amounts[i + idx],
    }));
    batches.push(batch);
  }

  if (!masterPubkey) {
    return { error: 'master_wallet_required_for_live' };
  }

  const conn = new Connection(process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com', {
    commitment: 'processed',
  });

  let masterKeypair: Keypair | null = null;
  try {
    if (data.groupId) {
      const group = getWalletGroup(data.groupId);
      if (group) {
        const kps = await loadKeypairsForGroup(group.name, [masterPubkey], masterPubkey);
        masterKeypair = kps[0] || null;
      }
    }
  } catch (error) {
    return { error: 'failed_to_load_master_keypair' };
  }

  if (!masterKeypair) {
    return { error: 'master_keypair_not_found' };
  }

  const blockhash = await conn.getLatestBlockhash('finalized');
  const results: Array<{ wallet: string; signature?: string; error?: string }> = [];

  for (const batch of batches) {
    for (const { wallet, lamports } of batch) {
      try {
        const ix = SystemProgram.transfer({
          fromPubkey: masterKeypair.publicKey,
          toPubkey: new PublicKey(wallet),
          lamports,
        });

        const msg = new TransactionMessage({
          payerKey: masterKeypair.publicKey,
          recentBlockhash: blockhash.blockhash,
          instructions: [ix],
        }).compileToV0Message();

        const tx = new VersionedTransaction(msg);
        tx.sign([masterKeypair]);

        const sig = await conn.sendTransaction(tx, { skipPreflight: false });
        results.push({ wallet, signature: sig });

        await sleep(10 + Math.random() * 30);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'unknown';
        results.push({ wallet, error: errorMessage });
      }
    }
  }

  return {
    walletsCount: wallets.length,
    totalNeeded: totalNeeded / 1e9,
    results,
  };
});
