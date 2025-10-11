import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/server/session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSessionFromCookies();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const db = await getDb();

    // Get PnL data from database
    const pnlData = await db.all(
      `
      SELECT 
        mint,
        wallet_address,
        buy_price,
        sell_price,
        amount,
        profit_loss,
        timestamp,
        transaction_signature
      FROM trades 
      WHERE user_pubkey = ? 
      ORDER BY timestamp DESC
    `,
      [user],
    );

    // Convert to CSV format
    const csvHeader =
      'Mint,Wallet Address,Buy Price,Sell Price,Amount,Profit/Loss,Timestamp,Transaction Signature\n';
    const csvRows = pnlData
      .map(
        (row) =>
          `${row.mint},${row.wallet_address},${row.buy_price},${row.sell_price},${row.amount},${row.profit_loss},${row.timestamp},${row.transaction_signature}`,
      )
      .join('\n');

    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="pnl-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // PnL export failed
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }
}
