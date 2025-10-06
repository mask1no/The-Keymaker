import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  loadWalletGroups,
  createWalletGroup,
  updateWalletGroup,
  deleteWalletGroup,
} from '@/lib/server/walletGroups';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({ name: z.string().min(1).max(64) });
const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  devWallet: z.string().optional().nullable(),
  sniperWallets: z.array(z.string()).optional(),
});

export async function GET() {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // Filter groups by owner
  const all = loadWalletGroups();
  const mine = all.filter((g) => g.masterWallet === user);
  return NextResponse.json({ groups: mine }, { status: 200 });
}

export async function POST(req: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const g = createWalletGroup(user, { name: parsed.data.name });
  return NextResponse.json(g, { status: 201 });
}

export async function PUT(req: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  try {
    // Ensure ownership
    const all = loadWalletGroups();
    const target = all.find((x) => x.id === parsed.data.id);
    if (!target || target.masterWallet !== user) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    // Enforce sniper count limit
    const snipers = parsed.data.sniperWallets || [];
    if (snipers.length > WALLET_GROUP_CONSTRAINTS.maxSnipers) {
      return NextResponse.json({ error: 'too_many_snipers' }, { status: 400 });
    }
    const g = updateWalletGroup({
      id: parsed.data.id,
      name: parsed.data.name,
      devWallet: parsed.data.devWallet || null,
      sniperWallets: snipers,
    });
    // Enforce overall wallet cap
    const total =
      (g.masterWallet ? 1 : 0) +
      (g.devWallet ? 1 : 0) +
      g.sniperWallets.length +
      g.executionWallets.length;
    if (total > WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup) {
      return NextResponse.json({ error: 'too_many_wallets' }, { status: 400 });
    }
    return NextResponse.json(g, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'update_failed' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const all = loadWalletGroups();
  const target = all.find((x) => x.id === id);
  if (!target || target.masterWallet !== user) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  deleteWalletGroup(id);
  return NextResponse.json({ ok: true }, { status: 200 });
}
