import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import {
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  Connection,
} from '@solana/web3.js';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  groupId: z.string().uuid(),
  totalLamports: z.number().int().positive(),
  strategy: z.enum(['equal', 'random']).default('equal'),
});

function partition(total: number, n: number, strategy: 'equal' | 'random'): number[] {
  if (n <= 0) return [];
  if (strategy === 'equal')
    return Array.from({ length: n }, (_, i) => Math.floor(total / n) + (i < total % n ? 1 : 0));
  const cuts = Array.from({ length: n - 1 }, () => Math.random()).sort((a, b) => a - b);
  const parts: number[] = [];
  let prev = 0;
  for (const c of [...cuts, 1]) {
    const t = Math.floor((c - prev) * total);
    parts.push(t);
    prev = c;
  }
  const diff = total - parts.reduce((a, b) => a + b, 0);
  if (diff) parts[0] += diff;
  return parts;
}

export async function POST(req: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const g = getWalletGroup(parsed.data.groupId);
  if (!g) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
  if (!g.masterWallet || g.masterWallet !== user)
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const dests = g.executionWallets;
  if (dests.length === 0) return NextResponse.json({ error: 'no_wallets' }, { status: 400 });

  const amounts = partition(parsed.data.totalLamports, dests.length, parsed.data.strategy);
  const conn = new Connection(process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com', {
    commitment: 'processed',
  });

  const blockhash = await conn.getLatestBlockhash('finalized');
  const payer = new PublicKey(g.masterWallet);

  const unsigned = dests.map((to, i) => {
    const ix = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(to),
      lamports: amounts[i],
    });
    const msg = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash.blockhash,
      instructions: [ix],
    }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    return { to, lamports: amounts[i], tx: Buffer.from(tx.serialize()).toString('base64') };
  });

  return NextResponse.json({ unsigned }, { status: 200 });
}
