import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  wallet: z.string().optional(),
  token: z.string().optional(),
  action: z.enum(['buy', 'sell', 'transfer', 'create']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET - Export transaction history
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = exportSchema.parse({
      format: searchParams.get('format') || 'csv',
      wallet: searchParams.get('wallet'),
      token: searchParams.get('token'),
      action: searchParams.get('action'),
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

    const transactions = db.all(sql, ...params);

    if (query.format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Action',
        'From Wallet',
        'To Wallet',
        'Token Symbol',
        'Token Mint',
        'Amount',
        'Price',
        'SOL Amount',
        'Transaction Hash',
        'Volume Task ID',
      ];

      const csvRows = [
        headers.join(','),
        ...transactions.map((tx) =>
          [
            tx.created_at,
            tx.action,
            tx.from_wallet || '',
            tx.to_wallet || '',
            tx.token_symbol || '',
            tx.token_mint || '',
            tx.amount || '',
            tx.price || '',
            tx.sol_amount || '',
            tx.transaction_hash || '',
            tx.volume_task_id || '',
          ]
            .map((field) => `"${field}"`)
            .join(','),
        ),
      ];

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Return JSON
      return NextResponse.json({
        success: true,
        transactions,
        exportedAt: new Date().toISOString(),
        total: transactions.length,
      });
    }
  } catch (error) {
    // Error exporting transactions

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to export transactions',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
