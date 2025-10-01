import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { getPositionsForGroup } from '@/lib/core/src/balances';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || '';
    const mint = searchParams.get('mint') || '';
    if (!groupId || !mint) {
      return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    }

    const rpc = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
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


