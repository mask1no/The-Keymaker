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
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';

export const runtime = 'nodejs';

const BodySchema = z.object({
  groupId: z.string().optional(),
  walletPubkeys: z.array(z.string()).optional(),
  bufferSol: z.number().nonnegative().default(0.01),
  minThresholdSol: z.number().nonnegative().default(0.005),
  feePreset: z.enum(['low', 'med', 'high', 'vhigh']).default('med').optional(),
  turbo: z.boolean().default(false).optional(),
  dryRun: z.boolean().default(false),
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  let groupName: string | null = null;

  if (data.groupId) {
    const group = getWalletGroup(data.groupId);
    if (!group) return { error: 'group_not_found' };
    if (!group.masterWallet) return { error: 'no_master_wallet' };
    if (group.masterWallet !== sid) return { error: 'forbidden' };
    wallets = group.executionWallets;
    masterPubkey = group.masterWallet;
    groupName = group.name;
  } else if (data.walletPubkeys) {
    wallets = data.walletPubkeys;
  }

  if (wallets.length === 0) {
    return { error: 'no_wallets' };
  }

  const conn = new Connection(process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com', {
    commitment: 'processed',
  });

  const bufferLamports = Math.floor(data.bufferSol * LAMPORTS_PER_SOL);
  const minThresholdLamports = Math.floor(data.minThresholdSol * LAMPORTS_PER_SOL);

  const sweepPlan: Array<{ wallet: string; balance: number; toSweep: number }> = [];

  for (const wallet of wallets) {
    try {
      const balance = await conn.getBalance(new PublicKey(wallet));
      const toSweep = Math.max(0, balance - bufferLamports - 5000);

      if (toSweep >= minThresholdLamports) {
        sweepPlan.push({ wallet, balance, toSweep });
      }
    } catch (error) {
      continue;
    }
  }

  if (data.dryRun) {
    return {
      dryRun: true,
      walletsCount: wallets.length,
      sweepCount: sweepPlan.length,
      totalToSweep: sweepPlan.reduce((sum, s) => sum + s.toSweep, 0) / LAMPORTS_PER_SOL,
      plan: sweepPlan.map((s) => ({
        wallet: s.wallet,
        balance: s.balance / LAMPORTS_PER_SOL,
        toSweep: s.toSweep / LAMPORTS_PER_SOL,
      })),
    };
  }

  if (!masterPubkey) {
    return { error: 'master_wallet_required_for_live' };
  }

  const keypairs: Map<string, Keypair> = new Map();
  try {
    if (data.groupId && groupName) {
      const kps = await loadKeypairsForGroup(groupName, wallets, masterPubkey);
      kps.forEach((kp) => {
        keypairs.set(kp.publicKey.toBase58(), kp);
      });
    }
  } catch (error) {
    return { error: 'failed_to_load_keypairs' };
  }

  if (keypairs.size === 0) {
    return { error: 'no_keypairs_loaded' };
  }

  const blockhash = await conn.getLatestBlockhash('finalized');
  const results: Array<{ wallet: string; signature?: string; swept?: number; error?: string }> = [];

  for (const { wallet, toSweep } of sweepPlan) {
    try {
      const kp = keypairs.get(wallet);
      if (!kp) {
        results.push({ wallet, error: 'keypair_not_found' });
        continue;
      }

      const ix = SystemProgram.transfer({
        fromPubkey: kp.publicKey,
        toPubkey: new PublicKey(masterPubkey),
        lamports: toSweep,
      });

      const msg = new TransactionMessage({
        payerKey: kp.publicKey,
        recentBlockhash: blockhash.blockhash,
        instructions: [ix],
      }).compileToV0Message();

      const tx = new VersionedTransaction(msg);
      tx.sign([kp]);

      const sig = await conn.sendTransaction(tx, { skipPreflight: false });
      results.push({ wallet, signature: sig, swept: toSweep / LAMPORTS_PER_SOL });

      await sleep(10 + Math.random() * 30);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      results.push({ wallet, error: errorMessage });
    }
  }

  return {
    walletsCount: wallets.length,
    sweepCount: sweepPlan.length,
    results,
  };
});
