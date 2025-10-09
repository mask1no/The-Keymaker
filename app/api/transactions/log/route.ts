import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

const logTransactionSchema = z.object({
  action: z.enum(['buy', 'sell', 'transfer', 'create']),
  fromWallet: z.string().optional(),
  toWallet: z.string().optional(),
  tokenMint: z.string().optional(),
  tokenSymbol: z.string().optional(),
  amount: z.number().optional(),
  price: z.number().optional(),
  solAmount: z.number().optional(),
  transactionHash: z.string().optional(),
  volumeTaskId: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// POST - Log a new transaction
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = logTransactionSchema.parse(body);

    const db = getDb();
    
    const result = db.run(
      `INSERT INTO transactions (
        user_id, action, from_wallet, to_wallet, token_mint, token_symbol,
        amount, price, sol_amount, transaction_hash, volume_task_id, metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.sub,
        validatedData.action,
        validatedData.fromWallet || null,
        validatedData.toWallet || null,
        validatedData.tokenMint || null,
        validatedData.tokenSymbol || null,
        validatedData.amount || null,
        validatedData.price || null,
        validatedData.solAmount || null,
        validatedData.transactionHash || null,
        validatedData.volumeTaskId || null,
        JSON.stringify(validatedData.metadata || {}),
        new Date().toISOString(),
      ]
    );

    return NextResponse.json({
      success: true,
      transactionId: result.lastInsertRowid,
      message: 'Transaction logged successfully',
    });

  } catch (error) {
    console.error('Error logging transaction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to log transaction',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
