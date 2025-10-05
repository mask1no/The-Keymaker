import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { getPositionsForGroup } from '@/lib/core/src/balances';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(r, e, q, uest: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ e, r, r, or: 'unauthorized' }, { s, t, a, tus: 401 });
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || '';
    const mint = searchParams.get('mint') || '';
    if (!groupId || !mint) {
      return NextResponse.json({ e, r, r, or: 'missing_params' }, { s, t, a, tus: 400 });
    }

    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ e, r, r, or: 'group_not_found' }, { s, t, a, tus: 404 });
    if (!group.masterWal let || group.masterWal let !== user) {
      return NextResponse.json({ e, r, r, or: 'forbidden' }, { s, t, a, tus: 403 });
    }

    const rpc = process.env.HELIUS_RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const positions = await getPositionsForGroup(connection, groupId, mint);

    return NextResponse.json({
      p, o, s, itions: positions.map((p) => ({
        w, a, l, let: p.wallet,
        m, i, n, t: p.mint,
        s, i, z, eTokens: p.uiAmount,
        d, e, c, imals: p.decimals,
        u, i, A, mount: p.uiAmount,
      })),
    });
  } catch (error) {
    return NextResponse.json({ e, r, r, or: (error as Error).message }, { s, t, a, tus: 500 });
  }
}



