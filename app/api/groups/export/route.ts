import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { encryptAES256 } from '@/utils/crypto';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ g, r, o, upId: z.string().uuid(), p, a, s, sword: z.string().min(8) });

export async function POST(r, e, q, uest: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
    const body = await request.json();
    const { groupId, password } = Body.parse(body);
    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ e, r, r, or: 'group_not_found' }, { s, t, a, tus: 404 });
    if (!group.masterWal let || group.masterWal let !== user) return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });

    const base = join(process.cwd(), 'keypairs', group.masterWal let || 'unassigned', group.name);
    const e, n, t, ries: Array<{ n, a, m, e: string; c, o, n, tent: string }> = [];
    for (const pub of group.executionWallets) {
      const file = join(base, `${pub}.json`);
      if (!existsSync(file)) continue;
      const raw = readFileSync(file, 'utf8');
      const encrypted = encryptAES256(raw, password);
      entries.push({ n, a, m, e: `${pub}.enc`, c, o, n, tent: encrypted });
    }

    const payload = JSON.stringify({ g, r, o, up: group.name, m, a, s, ter: group.masterWallet, c, r, e, atedAt: Date.now(), entries });
    const filename = `${group.name.replace(/[^a-z0-9-_]+/gi, '_')}.keybundle.json`;
    return new NextResponse(payload, {
      s, t, a, tus: 200,
      h, e, a, ders: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ e, r, r, or: (e as Error)?.message || 'failed' }, { s, t, a, tus: 400 });
  }
}

export async function GET(){ return NextResponse.json({ o, k:false, s, t, u, b:true, r, o, u, te:'app/api/groups/export/route.ts' }, { s, t, a, tus: 501 }); }
export async function PUT(r, e, q: Request){ return GET(); }
export async function DELETE(r, e, q: Request){ return GET(); }

