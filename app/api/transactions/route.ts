import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

const querySchema = z.object({
  wallet: z.string().optional(),
  token: z.string().optional(),
  action: z.enum(['buy', 'sell', 'transfer', 'create']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET - Fetch transaction history
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      wallet: searchParams.get('wallet'),
      token: searchParams.get('token'),
      action: searchParams.get('action'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    const db = getDb();

    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    const params: (string | number)[] = [session.sub];

    if (query.wallet) {
      sql += ' AND (from_wallet = ? OR to_wallet = ?)';
      params.push(query.wallet, query.wallet);
    }

    if (query.token) {
      sql += ' AND token_mint = ?';
      params.push(query.token);
    }

    if (query.action) {
      sql += ' AND action = ?';
      params.push(query.action);
    }

    if (query.startDate) {
      sql += ' AND created_at >= ?';
      params.push(query.startDate);
    }

    if (query.endDate) {
      sql += ' AND created_at <= ?';
      params.push(query.endDate);
    }

    sql += ' ORDER BY created_at DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(query.limit));

      if (query.offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(query.offset));
      }
    }

    const transactions = db.all(sql, ...params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
    const countParams: (string | number)[] = [session.sub];

    if (query.wallet) {
      countSql += ' AND (from_wallet = ? OR to_wallet = ?)';
      countParams.push(query.wallet, query.wallet);
    }

    if (query.token) {
      countSql += ' AND token_mint = ?';
      countParams.push(query.token);
    }

    if (query.action) {
      countSql += ' AND action = ?';
      countParams.push(query.action);
    }

    if (query.startDate) {
      countSql += ' AND created_at >= ?';
      countParams.push(query.startDate);
    }

    if (query.endDate) {
      countSql += ' AND created_at <= ?';
      countParams.push(query.endDate);
    }

    const countResult = db.get(countSql, ...countParams);
    const total = countResult?.total || 0;

    return NextResponse.json({
      success: true,
      transactions,
      total,
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
    });
  } catch (error) {
    // Error fetching transactions

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
