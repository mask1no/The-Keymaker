import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { Keypair } from '@solana/web3.js';
import { parseSecretKey, saveKeypair } from '@/lib/server/keystoreLoader';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  groupId: z.string().uuid(),
  action: z.enum(['create','import']),
  secretKey: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(()=> ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const g = getWalletGroup(parsed.data.groupId);
  if (!g) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });

  const count = g.executionWallets.length + (g.devWallet ? 1 : 0) + g.sniperWallets.length;
  if (count >= WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup) return NextResponse.json({ error: 'too_many_wallets' }, { status: 400 });

  let kp: Keypair;
  if (parsed.data.action === 'create') {
    kp = Keypair.generate();
  } else {
    const secret = parseSecretKey(parsed.data.secretKey || '');
    kp = Keypair.fromSecretKey(secret);
  }
  saveKeypair(g.masterWallet, g.name, kp);
  g.executionWallets.push(kp.publicKey.toBase58());

  return NextResponse.json({ ok: true, pubkey: kp.publicKey.toBase58() }, { status: 201 });
}



