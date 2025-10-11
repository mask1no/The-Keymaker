import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { generateWalletsForGroup } from '@/lib/server/walletGenerator';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  groupId: z.string().uuid(),
  count: z.number().min(1).max(20).default(1),
});

export async function POST(request: Request) {
  try {
    const session = getSession(request);
    const user = session?.userPubkey;
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await request.json();
    const { groupId, count } = Body.parse(body);
    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
    if (group.masterWallet !== user)
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const result = generateWalletsForGroup(groupId, count);
    return NextResponse.json({
      ok: true,
      generated: result.generated,
      available: result.available,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'invalid_request', details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
