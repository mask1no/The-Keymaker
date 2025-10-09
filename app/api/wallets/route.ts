import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';
import { z } from 'zod';

const createWalletSchema = z.object({
  name: z.string().min(1).max(50),
  encryptedKeypair: z.string().min(1),
});

const listWalletsSchema = z.object({
  groupId: z.string().uuid().optional(),
});

// GET - List wallets
export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    const db = await getDb();

    if (groupId) {
      // Get wallets for specific group
      const wallets = await db.all(
        'SELECT address, name FROM wallets WHERE group_id = ? ORDER BY created_at DESC',
        [groupId],
      );

      return NextResponse.json({
        success: true,
        wallets: wallets.map((w) => ({
          address: w.address,
          name: w.name,
        })),
      });
    } else {
      // Get all wallets for user
      const wallets = await db.all(
        'SELECT address, name, group_id FROM wallets WHERE user_pubkey = ? ORDER BY created_at DESC',
        [session.userPubkey],
      );

      return NextResponse.json({
        success: true,
        wallets: wallets.map((w) => ({
          address: w.address,
          name: w.name,
          groupId: w.group_id,
        })),
      });
    }
  } catch (error) {
    // Error listing wallets
    return NextResponse.json({ error: 'Failed to list wallets' }, { status: 500 });
  }
}

// POST - Create wallet
export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createWalletSchema.parse(body);

    const db = await getDb();

    // Generate a unique address (in real implementation, derive from keypair)
    const address = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.run(
      'INSERT INTO wallets (address, name, keypair, user_pubkey, created_at) VALUES (?, ?, ?, ?, ?)',
      [address, validated.name, validated.encryptedKeypair, session.userPubkey, Date.now()],
    );

    return NextResponse.json({
      success: true,
      wallet: {
        address,
        name: validated.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    // Error creating wallet
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}
