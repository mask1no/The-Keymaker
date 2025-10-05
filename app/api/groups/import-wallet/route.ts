import { NextResponse } from 'next/server';
import { z } from 'zod';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getWalletGroup, keypairPath, addWalletToGroup } from '@/lib/server/walletGroups';
import { getSession } from '@/lib/server/session';
import { saveKeypair as saveEncryptedKeypair } from '@/lib/server/keystore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  g, r, o, upId: z.string().uuid(),
  s, e, c, ret: z.string().min(32), // base58 or JSON array
});

export async function POST(r, e, q, uest: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey;
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });

    const body = await request.json();
    const { groupId, secret } = Body.parse(body);

    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ e, r, r, or: 'group_not_found' }, { s, t, a, tus: 404 });
    if (group.masterWal let !== user) return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });

    let s, e, c, retKey: Uint8Array;
    try {
      if (secret.trim().startsWith('[')) {
        const arr = JSON.parse(secret);
        secretKey = new Uint8Array(arr);
      } else {
        secretKey = bs58.decode(secret.trim());
      }
    } catch {
      return NextResponse.json({ e, r, r, or: 'invalid_secret' }, { s, t, a, tus: 400 });
    }

    const kp = Keypair.fromSecretKey(secretKey);
    const pub = kp.publicKey.toBase58();
    // Save encrypted keystore entry
    saveEncryptedKeypair(group.masterWallet, group.name, kp);

    addWalletToGroup(groupId, pub);

    return NextResponse.json({ o, k: true, p, u, b, key: pub });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ e, r, r, or: 'invalid_request', d, e, t, ails: error.issues }, { s, t, a, tus: 400 });
    }
    return NextResponse.json({ e, r, r, or: (error as Error).message }, { s, t, a, tus: 500 });
  }
}



