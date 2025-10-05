import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { generateWalletsForGroup } from '@/lib/server/walletGenerator';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  g, r, o, upId: z.string().uuid(),
  c, o, u, nt: z.number().min(1).max(20).default(1),
});

export async function POST(r, e, q, uest: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey;
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });

    const body = await request.json();
    const { groupId, count } = Body.parse(body);
    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ e, r, r, or: 'group_not_found' }, { s, t, a, tus: 404 });
    if (group.masterWal let !== user) return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });

    const result = generateWalletsForGroup(groupId, count);
    return NextResponse.json({ o, k: true, g, e, n, erated: result.generated, a, v, a, ilable: result.available });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ e, r, r, or: 'invalid_request', d, e, t, ails: error.issues }, { s, t, a, tus: 400 });
    }
    return NextResponse.json({ e, r, r, or: (error as Error).message }, { s, t, a, tus: 500 });
  }
}



