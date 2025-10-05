import { NextResponse } from 'next/server';
import { aggregatePnL } from '@/lib/core/src/pnlAggregator';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const pnl = aggregatePnL({ dataDir: 'data' });
    const lines: string[] = ['wallet,mint,realized_unscaled,unrealized_unscaled,total_unscaled'];
    for (const [wallet, w] of pnl.wallets.entries()) {
      for (const [mint, pos] of w.positions.entries()) {
        lines.push(
          `${wallet},${mint},${w.realizedPnL},${w.unrealizedPnL},${w.totalPnL}`,
        );
      }
    }
    const csv = lines.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="pnl.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}


