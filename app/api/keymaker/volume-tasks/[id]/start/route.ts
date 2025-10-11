import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

// POST - Start volume task
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const db = getDb();

    // Check if task exists and user owns it
    const task = db.get('SELECT * FROM volume_tasks WHERE id = ? AND user_id = ?', [
      taskId,
      session.sub,
    ]);

    if (!task) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    // Update task to active
    const result = db.run('UPDATE volume_tasks SET is_active = 1, updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      taskId,
    ]);

    // TODO: Start the actual volume bot process
    // This would involve:
    // 1. Getting wallets from the specified wallet group
    // 2. Setting up the trading loop
    // 3. Managing buy/sell operations with delays
    // 4. Logging all transactions

    return NextResponse.json({
      success: true,
      message: 'Volume task started successfully',
      changes: result.changes,
    });
  } catch (error) {
    // Error starting volume task
    return NextResponse.json(
      {
        error: 'Failed to start volume task',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
