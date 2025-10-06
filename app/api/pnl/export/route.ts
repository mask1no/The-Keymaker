import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { listTrades } from '@/lib/db/sqlite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const trades = listTrades({ limit: 100000, offset: 0 });
    const lines: string[] = [
      'id,ts,slot,sig,wallet,groupId,mint,side,qtyTokens,priceSolPerToken,feesLamports,priorityFeeLamports,mode',
    ];
    for (const t of trades) {
      const priceSolPerToken = (t.priceLamports || 0) / 1e9;
      const fees = t.feeLamports || 0;
      const priority = (t as any).priorityFeeLamports || 0;
      lines.push(
        [
          t.id ?? '',
          t.ts,
          t.slot ?? '',
          t.signature ?? '',
          t.wallet ?? '',
          t.groupId ?? '',
          t.mint,
          t.side,
          t.qty,
          priceSolPerToken.toFixed(12),
          fees,
          priority,
          t.mode ?? '',
        ].join(','),
      );
    }
    const csv = lines.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="trades.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
