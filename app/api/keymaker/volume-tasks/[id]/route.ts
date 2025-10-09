import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

const updateTaskSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  mint: z.string().min(32).max(44).optional(),
  walletGroup: z.string().min(1).optional(),
  buyAmount: z.number().min(0.001).max(100).optional(),
  sellAmount: z.number().min(0.001).max(100).optional(),
  buySellRatio: z.number().min(1).max(10).optional(),
  delayMin: z.number().min(10).max(3600).optional(),
  delayMax: z.number().min(10).max(3600).optional(),
  isActive: z.boolean().optional(),
});

// GET - Fetch specific volume task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const db = getDb();
    const task = db.get(
      'SELECT * FROM volume_tasks WHERE id = ? AND user_id = ?',
      [taskId, session.sub]
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });

  } catch (error) {
    console.error('Error fetching volume task:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch volume task',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

// PUT - Update volume task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const db = getDb();
    
    // Check if task exists and user owns it
    const existing = db.get(
      'SELECT id FROM volume_tasks WHERE id = ? AND user_id = ?',
      [taskId, session.sub]
    );
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(taskId);

    const result = db.run(
      `UPDATE volume_tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      ...updateValues
    );

    return NextResponse.json({
      success: true,
      message: 'Volume task updated successfully',
      changes: result.changes,
    });

  } catch (error) {
    console.error('Error updating volume task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update volume task',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete volume task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Check if task exists and user owns it
    const existing = db.get(
      'SELECT id FROM volume_tasks WHERE id = ? AND user_id = ?',
      [taskId, session.sub]
    );
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    const result = db.run(
      'DELETE FROM volume_tasks WHERE id = ?',
      [taskId]
    );

    return NextResponse.json({
      success: true,
      message: 'Volume task deleted successfully',
      changes: result.changes,
    });

  } catch (error) {
    console.error('Error deleting volume task:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete volume task',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
