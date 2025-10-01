import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { createDailyJournal, logJsonLine } from '@/lib/core/src/journal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FundSchema = z.object({
  groupId: z.string().uuid(),
  totalLamports: z.number().min(1),
  strategy: z.enum(['equal', 'random']).default('random'),
});

/**
 * POST /api/groups/random-fund
 * Builds unsigned SOL funding transactions from master to sub-wallets.
 * Note: Never exports the master private key; signing is done in extension.
 */
export async function POST(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey;
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await request.json();
    const params = FundSchema.parse(body);
    const group = getWalletGroup(params.groupId);
    if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
    if (group.masterWallet !== user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const recipients = [
      ...(group.devWallet ? [group.devWallet] : []),
      ...group.sniperWallets,
      ...group.executionWallets,
    ];
    if (recipients.length === 0) return NextResponse.json({ error: 'no_recipients' }, { status: 400 });

    // Strategy: equal or random weighted
    const weights = params.strategy === 'equal' ? recipients.map(() => 1) : recipients.map(() => 0.5 + Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    const amounts = weights.map((w) => Math.floor((w / sum) * params.totalLamports));
    // Ensure total matches by adding remainder to first
    const allocated = amounts.reduce((a, b) => a + b, 0);
    if (allocated < params.totalLamports) amounts[0] += params.totalLamports - allocated;

    const rpc = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    const payer = new PublicKey(group.masterWallet);

    const txs: { to: string; lamports: number; tx: string }[] = [];
    for (let i = 0; i < recipients.length; i++) {
      const to = new PublicKey(recipients[i]);
      const lamports = amounts[i];
      if (lamports <= 0) continue;
      const ix = SystemProgram.transfer({ fromPubkey: payer, toPubkey: to, lamports });
      const msg = new TransactionMessage({ payerKey: payer, recentBlockhash: blockhash, instructions: [ix] }).compileToV0Message();
      const vtx = new VersionedTransaction(msg);
      const b64 = Buffer.from(vtx.serialize()).toString('base64');
      txs.push({ to: to.toBase58(), lamports, tx: b64 });
    }

    const journal = createDailyJournal('data');
    logJsonLine(journal, { ev: 'random_fund_plan', group: group.name, recipients: txs.length, totalLamports: params.totalLamports });

    return NextResponse.json({ ok: true, unsigned: txs, payer: group.masterWallet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


