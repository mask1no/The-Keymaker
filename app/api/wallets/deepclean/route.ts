import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';
import { z } from 'zod';
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Keypair,
} from '@solana/web3.js';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { loadKeypairsForGroup } from '@/lib/server/keystoreLoader';
import { createCloseAccountInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const runtime = 'nodejs';

const BodySchema = z.object({
  groupId: z.string().optional(),
  walletPubkeys: z.array(z.string()).optional(),
  closeEmptyAtas: z.boolean().default(true),
  unwrapWsol: z.boolean().default(true),
  minTokenLamports: z.number().int().nonnegative().default(0),
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

  const cleanupPlan: Array<{
    wallet: string;
    emptyAtas: string[];
    wsolAta: string | null;
  }> = [];

  for (const wallet of wallets) {
    try {
      const walletPubkey = new PublicKey(wallet);
      const tokenAccounts = await conn.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const emptyAtas: string[] = [];
      let wsolAta: string | null = null;

      for (const { pubkey, account } of tokenAccounts.value) {
        const parsed = account.data.parsed;
        const mint = parsed.info.mint;
        const amount = parsed.info.tokenAmount.uiAmount;

        if (amount === 0 && data.closeEmptyAtas) {
          emptyAtas.push(pubkey.toBase58());
        }

        if (mint === NATIVE_MINT.toBase58() && amount > 0 && data.unwrapWsol) {
          wsolAta = pubkey.toBase58();
        }
      }

      if (emptyAtas.length > 0 || wsolAta) {
        cleanupPlan.push({ wallet, emptyAtas, wsolAta });
      }
    } catch (error) {
      continue;
    }
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
  const results: Array<{ wallet: string; signature?: string; closed?: number; error?: string }> =
    [];

  for (const { wallet, emptyAtas, wsolAta } of cleanupPlan) {
    try {
      const kp = keypairs.get(wallet);
      if (!kp) {
        results.push({ wallet, error: 'keypair_not_found' });
        continue;
      }

      const instructions = [];

      for (const ata of emptyAtas) {
        instructions.push(
          createCloseAccountInstruction(
            new PublicKey(ata),
            new PublicKey(masterPubkey),
            kp.publicKey,
          ),
        );
      }

      if (wsolAta) {
        instructions.push(
          createCloseAccountInstruction(new PublicKey(wsolAta), kp.publicKey, kp.publicKey),
        );
      }

      if (instructions.length === 0) {
        continue;
      }

      const msg = new TransactionMessage({
        payerKey: kp.publicKey,
        recentBlockhash: blockhash.blockhash,
        instructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(msg);
      tx.sign([kp]);

      const sig = await conn.sendTransaction(tx, { skipPreflight: false });
      results.push({ wallet, signature: sig, closed: instructions.length });

      await sleep(10 + Math.random() * 30);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      results.push({ wallet, error: errorMessage });
    }
  }

  return {
    walletsCount: wallets.length,
    cleanupCount: cleanupPlan.length,
    results,
  };
});
