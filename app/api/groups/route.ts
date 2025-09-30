import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  loadWalletGroups,
  createWalletGroup,
  updateWalletGroup,
  deleteWalletGroup,
} from '@/lib/server/walletGroups';
import { listGroup } from '@/lib/server/keystore';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(50),
  masterWallet: z.string().optional(),
  numberOfWallets: z.number().min(1).max(WALLET_GROUP_CONSTRAINTS.MAX_WALLETS_PER_GROUP),
});

const UpdateGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  masterWallet: z.string().optional(),
  devWallet: z.string().optional(),
  sniperWallets: z.array(z.string()).max(WALLET_GROUP_CONSTRAINTS.MAX_SNIPER_WALLETS).optional(),
});

const DeleteGroupSchema = z.object({
  id: z.string().uuid(),
});

/**
 * GET /api/groups
 * List all wallet groups
 */
export async function GET() {
  try {
    const groups = loadWalletGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load groups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/groups
 * Create a new wallet group
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateGroupSchema.parse(body);
    
    // Get wallets from keystore group (if exists) or generate new ones
    let executionWallets: string[] = [];
    
    try {
      // Try to load from existing keystore group
      executionWallets = listGroup(validated.name);
    } catch {
      // Group doesn't exist in keystore yet - will be created separately
      executionWallets = [];
    }
    
    const group = createWalletGroup(validated, executionWallets);
    
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/groups
 * Update wallet group
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validated = UpdateGroupSchema.parse(body);
    
    const group = updateWalletGroup(validated);
    
    return NextResponse.json({ group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/groups
 * Delete wallet group
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = DeleteGroupSchema.parse(body);
    
    const deleted = deleteWalletGroup(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
