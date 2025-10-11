import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

// GET - List volume profiles
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();

    const profiles = await db.all(
      'SELECT id, name, json FROM volume_profiles ORDER BY createdAt DESC',
    );

    return NextResponse.json({
      success: true,
      profiles: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        ...JSON.parse(p.json || '{}'),
      })),
    });
  } catch (error) {
    // Error listing volume profiles
    return NextResponse.json({ error: 'Failed to list volume profiles' }, { status: 500 });
  }
}

// POST - Create volume profile
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, ...config } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
    }

    const db = await getDb();
    const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.run(
      'INSERT INTO volume_profiles (id, name, json, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), JSON.stringify(config), Date.now(), Date.now()],
    );

    return NextResponse.json({
      success: true,
      profile: {
        id,
        name: name.trim(),
        ...config,
      },
    });
  } catch (error) {
    // Error creating volume profile
    return NextResponse.json({ error: 'Failed to create volume profile' }, { status: 500 });
  }
}
