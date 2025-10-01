import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWalletGroup } from '@/lib/server/walletGroups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Query = z.object({
  groupId: z.string().uuid(),
  format: z.enum(['csv', 'ndjson']).optional().default('csv'),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = Query.safeParse({
      groupId: url.searchParams.get('groupId'),
      format: (url.searchParams.get('format') || 'csv').toLowerCase(),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }
    const { groupId, format } = parsed.data;
    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
    const wallets = [
      ...(group.masterWallet ? [group.masterWallet] : []),
      ...(group.devWallet ? [group.devWallet] : []),
      ...group.sniperWallets,
      ...group.executionWallets,
    ];
    const unique = Array.from(new Set(wallets));
    const filename = `group-${group.name.replace(/[^a-z0-9_-]+/gi, '-')}.pubkeys.${format}`;
    if (format === 'csv') {
      const csv = `wallet\n${unique.join('\n')}`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename=${filename}`,
        },
      });
    }
    // ndjson
    const ndjson = unique.map((w) => JSON.stringify({ wallet: w })).join('\n');
    return new NextResponse(ndjson, {
      status: 200,
      headers: {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'content-disposition': `attachment; filename=${filename}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}


