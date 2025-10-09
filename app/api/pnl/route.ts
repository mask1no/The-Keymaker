import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const wallet = url.searchParams.get('wallet') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? '100');
    const offset = Number(url.searchParams.get('offset') ?? '0');

    const db = getDb();

    let query = `
      SELECT 
        t.id,
        t.mint,
        t.side,
        t.qty,
        t.priceLamports,
        t.feeLamports,
        t.priorityFeeLamports,
        t.sig,
        t.ts,
        t.created_at,
        p.qty as position_qty,
        p.cost_basis_lamports,
        p.realized_pnl_lamports
      FROM trades t
      LEFT JOIN positions p ON t.wallet = p.wallet AND t.mint = p.mint
      WHERE t.wallet = ?
    `;

    const params: (string | number)[] = [session.sub];

    if (wallet) {
      query += ' AND t.wallet = ?';
      params.push(wallet);
    }

    query += ' ORDER BY t.ts DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const trades = db.all(query, params);

    // Calculate P&L for each trade
    interface Trade {
      priceLamports: number;
      qty: number;
      feeLamports?: number;
      priorityFeeMicrolamports?: number;
      side: 'buy' | 'sell';
      ts: number;
      mint: string;
    }

    const pnlEntries = trades.map((trade: Trade) => {
      const priceSol = trade.priceLamports / 1e9;
      const qtySol = trade.qty / 1e9;
      const feeSol = (trade.feeLamports || 0) / 1e9;
      const priorityFeeSol = (trade.priorityFeeMicrolamports || 0) / 1e9;

      let pnlSol = 0;
      if (trade.side === 'sell' && trade.realized_pnl_lamports) {
        pnlSol = trade.realized_pnl_lamports / 1e9;
      }

      return {
        id: trade.id,
        mint: trade.mint,
        side: trade.side,
        qty: qtySol,
        priceSol,
        feeSol,
        priorityFeeSol,
        pnlSol,
        signature: trade.sig,
        timestamp: new Date(trade.ts).toISOString(),
        createdAt: trade.created_at,
      };
    });

    // Get total P&L
    const totalPnLQuery = `
      SELECT SUM(realized_pnl_lamports) as total_pnl
      FROM positions 
      WHERE wallet = ?
    `;
    const totalPnLResult = db.get(totalPnLQuery, [session.sub]) as
      | { total_pnl: number }
      | undefined;
    const totalPnL = (totalPnLResult?.total_pnl || 0) / 1e9;

    return NextResponse.json({
      success: true,
      pnlEntries,
      totalPnL,
      pagination: {
        limit,
        offset,
        total: pnlEntries.length,
      },
    });
  } catch (error) {
    // P&L fetch error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch P&L data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
