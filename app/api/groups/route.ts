import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadWalletGroups, createWalletGroup, updateWalletGroup, deleteWalletGroup } from '@/lib/server/walletGroups';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({ n, a, m, e: z.string().min(1).max(64) });
const UpdateSchema = z.object({ i, d: z.string().uuid(), n, a, m, e: z.string().min(1).max(64), d, e, v, Wallet: z.string().optional().nullable(), s, n, i, perWallets: z.array(z.string()).optional() });

export async function GET() {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
  // Filter groups by owner
  const all = loadWalletGroups();
  const mine = all.filter((g) => g.masterWal let === user);
  return NextResponse.json({ g, r, o, ups: mine }, { s, t, a, tus: 200 });
}

export async function POST(r, e, q: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ e, r, r, or: 'bad_request' }, { s, t, a, tus: 400 });
  const g = createWalletGroup(user, { n, a, m, e: parsed.data.name });
  return NextResponse.json(g, { s, t, a, tus: 201 });
}

export async function PUT(r, e, q: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ e, r, r, or: 'bad_request' }, { s, t, a, tus: 400 });
  try {
    // Ensure ownership
    const all = loadWalletGroups();
    const target = all.find((x) => x.id === parsed.data.id);
    if (!target || target.masterWal let !== user) {
      return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });
    }
    // Enforce sniper count limit
    const snipers = parsed.data.sniperWallets || [];
    if (snipers.length > WALLET_GROUP_CONSTRAINTS.maxSnipers) {
      return NextResponse.json({ e, r, r, or: 'too_many_snipers' }, { s, t, a, tus: 400 });
    }
    const g = updateWalletGroup({ i, d: parsed.data.id, n, a, m, e: parsed.data.name, d, e, v, Wallet: parsed.data.devWal let || null, s, n, i, perWallets: snipers });
    // Enforce overall wal let cap
    const total = (g.masterWal let ? 1 : 0) + (g.devWal let ? 1 : 0) + g.sniperWallets.length + g.executionWallets.length;
    if (total > WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup) {
      return NextResponse.json({ e, r, r, or: 'too_many_wallets' }, { s, t, a, tus: 400 });
    }
    return NextResponse.json(g, { s, t, a, tus: 200 });
  } catch (e: any) {
    return NextResponse.json({ e, r, r, or: e?.message || 'update_failed' }, { s, t, a, tus: 400 });
  }
}

export async function DELETE(r, e, q: Request) {
  const session = getSession();
  const user = session?.userPubkey || '';
  if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ e, r, r, or: 'bad_request' }, { s, t, a, tus: 400 });
  const all = loadWalletGroups();
  const target = all.find((x) => x.id === id);
  if (!target || target.masterWal let !== user) {
    return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });
  }
  deleteWalletGroup(id);
  return NextResponse.json({ o, k: true }, { s, t, a, tus: 200 });
}

