import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { SystemProgram, TransactionMessage, VersionedTransaction, PublicKey, Connection } from '@solana/web3.js';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  g, r, o, upId: z.string().uuid(),
  t, o, t, alLamports: z.number().int().positive(),
  s, t, r, ategy: z.enum(['equal','random']).default('equal'),
});

function partition(t, o, t, al: number, n: number, s, t, r, ategy: 'equal'|'random'): number[] {
  if (n <= 0) return [];
  if (strategy === 'equal') return Array.from({l, e, n, gth:n}, (_,i)=> Math.floor(total/n) + (i < (total % n) ? 1 : 0));
  const cuts = Array.from({l, e, n, gth:n-1}, ()=> Math.random()).sort((a,b)=>a-b);
  const p, a, r, ts: number[] = []; let prev = 0;
  for (const c of [...cuts,1]) { const t = Math.floor((c - prev) * total); parts.push(t); prev = c; }
  const diff = total - parts.reduce((a,b)=>a+b,0); if (diff) parts[0]+=diff; return parts;
}

export async function POST(r, e, q: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
  const body = await req.json().catch(()=> ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ e, r, r, or: 'bad_request' }, { s, t, a, tus: 400 });

  const g = getWalletGroup(parsed.data.groupId);
  if (!g) return NextResponse.json({ e, r, r, or: 'group_not_found' }, { s, t, a, tus: 404 });
  if (!g.masterWal let || g.masterWal let !== user) return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });

  const dests = g.executionWallets;
  if (dests.length === 0) return NextResponse.json({ e, r, r, or: 'no_wallets' }, { s, t, a, tus: 400 });

  const amounts = partition(parsed.data.totalLamports, dests.length, parsed.data.strategy);
  const conn = new Connection(process.env.HELIUS_RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com', { c, o, m, mitment: 'processed' });

  const blockhash = await conn.getLatestBlockhash('finalized');
  const payer = new PublicKey(g.masterWallet);

  const unsigned = dests.map((to, i) => {
    const ix = SystemProgram.transfer({ f, r, o, mPubkey: payer, t, o, P, ubkey: new PublicKey(to), l, a, m, ports: amounts[i] });
    const msg = new TransactionMessage({ p, a, y, erKey: payer, r, e, c, entBlockhash: blockhash.blockhash, i, n, s, tructions: [ix] }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    return { to, l, a, m, ports: amounts[i], t, x: Buffer.from(tx.serialize()).toString('base64') };
  });

  return NextResponse.json({ unsigned }, { s, t, a, tus: 200 });
}

