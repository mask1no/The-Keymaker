import { NextResponse } from 'next/server';
import { apiError } from '@/lib/server/apiError';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import {
  loadWalletGroups,
  createWalletGroup,
  updateWalletGroup,
  deleteWalletGroup,
} from '@/lib/server/walletGroups';
// Optional: attempt to list existing pubkeys from keystore if present
let listGroup: ((name: string) => string[]) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  listGroup = require('@/lib/server/keystore').listGroup as (name: string) => string[];
} catch {
  listGroup = null;
}
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
  sniperWallets: z
    .array(z.string())
    .max(WALLET_GROUP_CONSTRAINTS.MAX_SNIPER_WALLETS)
    .optional(),
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
    try { Sentry.captureException(error instanceof Error ? error : new Error('groups_get_failed'), { extra: { route: '/api/groups' } }); } catch {}
    return apiError(500, 'failed');
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
    
    if (listGroup) {
      try {
        executionWallets = listGroup(validated.name);
      } catch {
        executionWallets = [];
      }
    } else {
      executionWallets = [];
    }
    
    const group = createWalletGroup(validated, executionWallets);
    
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(400, 'invalid_request');
    }
    try { Sentry.captureException(error instanceof Error ? error : new Error('groups_post_failed'), { extra: { route: '/api/groups' } }); } catch {}
    return apiError(400, (error as Error).message || 'failed');
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
      return apiError(400, 'invalid_request');
    }
    try { Sentry.captureException(error instanceof Error ? error : new Error('groups_put_failed'), { extra: { route: '/api/groups' } }); } catch {}
    return apiError(400, (error as Error).message || 'failed');
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
      return apiError(400, 'invalid_request');
    }
    try { Sentry.captureException(error instanceof Error ? error : new Error('groups_delete_failed'), { extra: { route: '/api/groups' } }); } catch {}
    return apiError(400, (error as Error).message || 'failed');
  }
}
