import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

const volumeTaskSchema = z.object({
  name: z.string().min(1).max(50),
  mint: z.string().min(32).max(44), // Solana address
  walletGroup: z.string().min(1),
  buyAmount: z.number().min(0.001).max(100),
  sellAmount: z.number().min(0.001).max(100),
  buySellRatio: z.number().min(1).max(10),
  delayMin: z.number().min(10).max(3600),
  delayMax: z.number().min(10).max(3600),
  isActive: z.boolean().optional(),
});

const updateTaskSchema = volumeTaskSchema.partial();

// GET - Fetch all volume tasks for user
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const tasks = db.all(
      'SELECT * FROM volume_tasks WHERE user_id = ? ORDER BY created_at DESC',
      [session.sub]
    );

    return NextResponse.json({
      success: true,
      tasks,
    });

  } catch (error) {
    console.error('Error fetching volume tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch volume tasks',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

// POST - Create new volume task
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = volumeTaskSchema.parse(body);

    const db = getDb();
    
    // Check if task name already exists for this user
    const existing = db.get(
      'SELECT id FROM volume_tasks WHERE user_id = ? AND name = ?',
      [session.sub, validatedData.name]
    );
    
    if (existing) {
      return NextResponse.json(
        { error: 'Task name already exists' },
        { status: 409 }
      );
    }

    // Insert new volume task
    const result = db.run(
      `INSERT INTO volume_tasks (
        user_id, name, mint, wallet_group, buy_amount, sell_amount, 
        buy_sell_ratio, delay_min, delay_max, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.sub,
        validatedData.name,
        validatedData.mint,
        validatedData.walletGroup,
        validatedData.buyAmount,
        validatedData.sellAmount,
        validatedData.buySellRatio,
        validatedData.delayMin,
        validatedData.delayMax,
        validatedData.isActive || false,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    return NextResponse.json({
      success: true,
      taskId: result.lastInsertRowid,
      message: 'Volume task created successfully',
    });

  } catch (error) {
    console.error('Error creating volume task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create volume task',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
