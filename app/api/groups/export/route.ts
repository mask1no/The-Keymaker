import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { encryptAES256 } from '@/utils/crypto';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ groupId: z.string().uuid(), password: z.string().min(8) });

export async function POST(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json();
    const { groupId, password } = Body.parse(body);
    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
    if (!group.masterWallet || group.masterWallet !== user)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const base = join(process.cwd(), 'keypairs', group.masterWallet || 'unassigned', group.name);
    const entries: Array<{ name: string; content: string }> = [];
    for (const pub of group.executionWallets) {
      const file = join(base, `${pub}.json`);
      if (!existsSync(file)) continue;
      const raw = readFileSync(file, 'utf8');
      const encrypted = encryptAES256(raw, password);
      entries.push({ name: `${pub}.enc`, content: encrypted });
    }

    const payload = JSON.stringify({
      group: group.name,
      master: group.masterWallet,
      createdAt: Date.now(),
      entries,
    });
    const filename = `${group.name.replace(/[^a-z0-9-_]+/gi, '_')}.keybundle.json`;
    return new NextResponse(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, stub: true, route: 'app/api/groups/export/route.ts' },
    { status: 501 },
  );
}
export async function PUT(req: Request) {
  return GET();
}
export async function DELETE(req: Request) {
  return GET();
}
