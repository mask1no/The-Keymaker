import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadWalletGroups, createWalletGroup, updateWalletGroup, deleteWalletGroup } from '@/lib/server/walletGroups';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({ name: z.string().min(1).max(64) });
const UpdateSchema = z.object({ id: z.string().uuid(), name: z.string().min(1).max(64), devWallet: z.string().optional().nullable(), sniperWallets: z.array(z.string()).optional() });

export async function GET() {
  return NextResponse.json({ groups: loadWalletGroups() }, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const masterWallet = (req.headers.get('x-master-wallet') || '').trim();
  if (!masterWallet) return NextResponse.json({ error: 'no_master' }, { status: 400 });
  const g = createWalletGroup(masterWallet, { name: parsed.data.name });
  return NextResponse.json(g, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  try {
    // Enforce sniper count limit
    const snipers = parsed.data.sniperWallets || [];
    if (snipers.length > WALLET_GROUP_CONSTRAINTS.maxSnipers) {
      return NextResponse.json({ error: 'too_many_snipers' }, { status: 400 });
    }
    const g = updateWalletGroup({ id: parsed.data.id, name: parsed.data.name, devWallet: parsed.data.devWallet || null, sniperWallets: snipers });
    // Enforce overall wallet cap
    const total = (g.masterWallet ? 1 : 0) + (g.devWallet ? 1 : 0) + g.sniperWallets.length + g.executionWallets.length;
    if (total > WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup) {
      return NextResponse.json({ error: 'too_many_wallets' }, { status: 400 });
    }
    return NextResponse.json(g, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'update_failed' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  deleteWalletGroup(id);
  return NextResponse.json({ ok: true }, { status: 200 });
}
