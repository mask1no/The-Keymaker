import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadWalletGroups, createWalletGroup, updateWalletGroup, deleteWalletGroup } from '@/lib/server/walletGroups';

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
    const g = updateWalletGroup(parsed.data);
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
