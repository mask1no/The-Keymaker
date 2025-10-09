import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

// GET - List wallet groups
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();

    const groups = await db.all(
      'SELECT id, name FROM wallet_groups WHERE user_pubkey = ? ORDER BY created_at DESC',
      [session.userPubkey],
    );

    return NextResponse.json({
      success: true,
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
      })),
    });
  } catch (error) {
    // Error listing groups
    return NextResponse.json({ error: 'Failed to list groups' }, { status: 500 });
  }
}

// POST - Create wallet group
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const db = await getDb();
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.run(
      'INSERT INTO wallet_groups (id, name, user_pubkey, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), session.userPubkey, Date.now(), Date.now()],
    );

    return NextResponse.json({
      success: true,
      group: {
        id,
        name: name.trim(),
      },
    });
  } catch (error) {
    // Error creating group
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
