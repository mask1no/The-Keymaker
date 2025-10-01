import { NextResponse } from 'next/server';
import { z } from 'zod';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getWalletGroup, keypairPath, addWalletToGroup } from '@/lib/server/walletGroups';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  groupId: z.string().uuid(),
  secret: z.string().min(32), // base58 or JSON array
});

export async function POST(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey;
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await request.json();
    const { groupId, secret } = Body.parse(body);

    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
    if (group.masterWallet !== user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    let secretKey: Uint8Array;
    try {
      if (secret.trim().startsWith('[')) {
        const arr = JSON.parse(secret);
        secretKey = new Uint8Array(arr);
      } else {
        secretKey = bs58.decode(secret.trim());
      }
    } catch {
      return NextResponse.json({ error: 'invalid_secret' }, { status: 400 });
    }

    const kp = Keypair.fromSecretKey(secretKey);
    const pub = kp.publicKey.toBase58();
    const file = keypairPath(group.masterWallet, group.name, pub);
    const dir = dirname(file);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(Array.from(kp.secretKey), null, 2), 'utf8');

    addWalletToGroup(groupId, pub);

    return NextResponse.json({ ok: true, pubkey: pub, path: file });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


