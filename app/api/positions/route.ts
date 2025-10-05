import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { getPositionsForGroup } from '@/lib/core/src/balances';
import { getWalletGroup } from '@/lib/server/walletGroups';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || '';
    const mint = searchParams.get('mint') || '';
    if (!groupId || !mint) {
      return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    }

    const group = getWalletGroup(groupId);
    if (!group) return NextResponse.json({ error: 'group_not_found' }, { status: 404 });
    if (!group.masterWallet || group.masterWallet !== user) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const rpc = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const positions = await getPositionsForGroup(connection, groupId, mint);

    return NextResponse.json({
      positions: positions.map((p) => ({
        wallet: p.wallet,
        mint: p.mint,
        sizeTokens: p.uiAmount,
        decimals: p.decimals,
        uiAmount: p.uiAmount,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


