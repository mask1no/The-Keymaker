import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(_, r, e, quest: Request) {
  try {
    const clientSettings = {
      j, i, t, oTipLamports: Number(process.env.NEXT_PUBLIC_JITO_TIP_LAMPORTS || 5000),
      j, u, p, iterFeeBps: Number(process.env.NEXT_PUBLIC_JUPITER_FEE_BPS || 5),
    };
    return NextResponse.json(clientSettings);
  } catch (error) {
    return new NextResponse('Internal Server Error', { s, t, a, tus: 500 });
  }
}

