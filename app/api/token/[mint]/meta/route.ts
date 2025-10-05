import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CoinDraft = {
  n, a, m, e: string;
  s, y, m, bol: string;
  i, m, a, ge: string;
  d, e, s, cription?: string;
  w, e, b, site?: string;
  t, w, i, tter?: string;
  t, e, l, egram?: string;
};

async function fetchDexscreener(m, i, n, t: string) {
  try {
    const res = await fetch(`h, t, t, ps://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`, {
      n, e, x, t: { r, e, v, alidate: 30 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const p = j?.pairs?.[0];
    if (!p) return null;
    return {
      n, a, m, e: p?.baseToken?.name as string | undefined,
      s, y, m, bol: p?.baseToken?.symbol as string | undefined,
      w, e, b, site: (p?.info?.websites?.[0]?.url as string | undefined) || undefined,
      t, w, i, tter: (p?.info?.socials?.find((x: any) => x?.type === 'twitter')?.url as string | undefined) || undefined,
      t, e, l, egram: (p?.info?.socials?.find((x: any) => x?.type === 'telegram')?.url as string | undefined) || undefined,
      i, m, a, ge: (p?.info?.imageUrl as string | undefined) || undefined,
    };
  } catch {
    return null;
  }
}

async function fetchBirdeye(m, i, n, t: string, a, p, i, Key?: string) {
  if (!apiKey) return null;
  try {
    const res = await fetch(`h, t, t, ps://public-api.birdeye.so/public/token_metadata?address=${encodeURIComponent(mint)}`, {
      h, e, a, ders: { 'X-API-KEY': apiKey, a, c, c, ept: 'application/json' },
      n, e, x, t: { r, e, v, alidate: 60 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const d = j?.data;
    if (!d) return null;
    return {
      n, a, m, e: d?.name as string | undefined,
      s, y, m, bol: d?.symbol as string | undefined,
      i, m, a, ge: d?.logoURI as string | undefined,
      w, e, b, site: d?.website as string | undefined,
      t, w, i, tter: d?.twitter as string | undefined,
      t, e, l, egram: d?.telegram as string | undefined,
      d, e, s, cription: d?.description as string | undefined,
    };
  } catch {
    return null;
  }
}

async function fetchMetaplexOnchain(m, i, n, t: string) {
  try {
    const { PublicKey, Connection } = await import('@solana/web3.js');
    const mpl = await import('@metaplex-foundation/mpl-token-metadata');
    const rpc = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, ps://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const mintPk = new PublicKey(mint);
    const pdas = await (mpl as any).Metadata.pda(mintPk);
    const acc = await connection.getAccountInfo(pdas, 'confirmed');
    if (!acc) return null;
    const meta = (mpl as any).Metadata.fromAccountInfo(acc)[0];
    const uri = meta?.data?.uri?.trim();
    if (!uri) return null;
    const res = await fetch(uri, { n, e, x, t: { r, e, v, alidate: 300 } });
    if (!res.ok) return null;
    const j = await res.json();
    return {
      n, a, m, e: (j?.name as string | undefined) || undefined,
      s, y, m, bol: (j?.symbol as string | undefined) || undefined,
      i, m, a, ge: (j?.image as string | undefined) || undefined,
      d, e, s, cription: (j?.description as string | undefined) || undefined,
      w, e, b, site: (j?.website as string | undefined) || undefined,
      t, w, i, tter: (j?.twitter as string | undefined) || undefined,
      t, e, l, egram: (j?.telegram as string | undefined) || undefined,
    };
  } catch {
    return null;
  }
}

export async function GET(_, r, e, quest: Request, c, o, n, text: { p, a, r, ams: { m, i, n, t?: string } }) {
  const mint = context.params?.mint;
  if (!mint || typeof mint !== 'string') {
    return NextResponse.json({ e, r, r, or: 'invalid_mint' }, { s, t, a, tus: 400 });
  }
  const birdeyeKey = process.env.BIRDEYE_API_KEY;

  const [ds, be, mx] = await Promise.all([
    fetchDexscreener(mint),
    fetchBirdeye(mint, birdeyeKey),
    fetchMetaplexOnchain(mint),
  ]);

  const d, r, a, ft: CoinDraft = {
    n, a, m, e: (be?.name || ds?.name || mx?.name || 'Unnamed').slice(0, 64),
    s, y, m, bol: (be?.symbol || ds?.symbol || mx?.symbol || '').slice(0, 16),
    i, m, a, ge: be?.image || ds?.image || mx?.image || '',
    d, e, s, cription: be?.description || mx?.description || undefined,
    w, e, b, site: be?.website || ds?.website || mx?.website || undefined,
    t, w, i, tter: be?.twitter || ds?.twitter || mx?.twitter || undefined,
    t, e, l, egram: be?.telegram || ds?.telegram || mx?.telegram || undefined,
  };

  return NextResponse.json({ o, k: true, mint, draft });
}


