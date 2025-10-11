import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

export const dynamic = 'force-dynamic';

interface Trade {
  id: number;
  mint: string;
  side: 'buy' | 'sell';
  qty: number;
  priceLamports: number;
  feeLamports: number;
  priorityFeeLamports: number;
  signature: string | null;
  ts: number;
  wallet: string | null;
}

interface PnLResult {
  realized: number;
  unrealized: number;
  net: number;
  buys: number;
  sells: number;
  fees: number;
  count: number;
}

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

    // Get trades for the user (using user_pubkey from wallets table)
    let query = `
      SELECT 
        t.id,
        t.mint,
        t.side,
        t.qty,
        t.priceLamports,
        t.feeLamports,
        t.priorityFeeLamports,
        t.signature,
        t.ts,
        t.wallet,
        w.name as wallet_name
      FROM trades t
      LEFT JOIN wallets w ON t.wallet = w.address
      WHERE w.user_pubkey = ?
    `;

    const params: (string | number)[] = [session.userPubkey];

    if (wallet) {
      query += ' AND t.wallet = ?';
      params.push(wallet);
    }

    query += ' ORDER BY ts DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const trades = db.prepare(query).all(...params) as Trade[];

    // Calculate P&L from trades only
    const pnlResult: PnLResult = {
      realized: 0,
      unrealized: 0,
      net: 0,
      buys: 0,
      sells: 0,
      fees: 0,
      count: trades.length,
    };

    const mintPositions = new Map<string, { qty: number; costBasis: number }>();

    for (const trade of trades) {
      const qtySol = trade.qty / 1e9;
      const priceSol = trade.priceLamports / 1e9;
      const feeSol = (trade.feeLamports + trade.priorityFeeLamports) / 1e9;

      pnlResult.fees += feeSol;

      if (trade.side === 'buy') {
        pnlResult.buys += qtySol * priceSol;

        const current = mintPositions.get(trade.mint) || { qty: 0, costBasis: 0 };
        const totalCost = current.qty * current.costBasis + qtySol * priceSol;
        const totalQty = current.qty + qtySol;

        mintPositions.set(trade.mint, {
          qty: totalQty,
          costBasis: totalQty > 0 ? totalCost / totalQty : 0,
        });
      } else {
        pnlResult.sells += qtySol * priceSol;

        const current = mintPositions.get(trade.mint);
        if (current) {
          const avgCost = current.costBasis;
          const realizedPnL = qtySol * (priceSol - avgCost);
          pnlResult.realized += realizedPnL;

          mintPositions.set(trade.mint, {
            qty: Math.max(0, current.qty - qtySol),
            costBasis: current.costBasis,
          });
        }
      }
    }

    // Calculate unrealized P&L (would need current market prices)
    // For now, set to 0 - this would be enhanced with market data
    pnlResult.unrealized = 0;

    pnlResult.net = pnlResult.realized + pnlResult.unrealized - pnlResult.fees;

    return NextResponse.json({
      success: true,
      ...pnlResult,
      trades: trades.map((trade) => ({
        id: trade.id,
        mint: trade.mint,
        side: trade.side,
        qty: trade.qty / 1e9,
        priceSol: trade.priceLamports / 1e9,
        feeSol: (trade.feeLamports + trade.priorityFeeLamports) / 1e9,
        signature: trade.signature,
        timestamp: new Date(trade.ts).toISOString(),
      })),
      pagination: {
        limit,
        offset,
        total: trades.length,
      },
    });
  } catch (error) {
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
