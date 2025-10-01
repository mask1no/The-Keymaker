import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CoinDraft = {
  name: string;
  symbol: string;
  image: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
};

async function fetchDexscreener(mint: string) {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const p = j?.pairs?.[0];
    if (!p) return null;
    return {
      name: p?.baseToken?.name as string | undefined,
      symbol: p?.baseToken?.symbol as string | undefined,
      website: (p?.info?.websites?.[0]?.url as string | undefined) || undefined,
      twitter: (p?.info?.socials?.find((x: any) => x?.type === 'twitter')?.url as string | undefined) || undefined,
      telegram: (p?.info?.socials?.find((x: any) => x?.type === 'telegram')?.url as string | undefined) || undefined,
      image: (p?.info?.imageUrl as string | undefined) || undefined,
    };
  } catch {
    return null;
  }
}

async function fetchBirdeye(mint: string, apiKey?: string) {
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://public-api.birdeye.so/public/token_metadata?address=${encodeURIComponent(mint)}`, {
      headers: { 'X-API-KEY': apiKey, accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const d = j?.data;
    if (!d) return null;
    return {
      name: d?.name as string | undefined,
      symbol: d?.symbol as string | undefined,
      image: d?.logoURI as string | undefined,
      website: d?.website as string | undefined,
      twitter: d?.twitter as string | undefined,
      telegram: d?.telegram as string | undefined,
      description: d?.description as string | undefined,
    };
  } catch {
    return null;
  }
}

async function fetchMetaplexOnchain(mint: string) {
  try {
    const { PublicKey, Connection } = await import('@solana/web3.js');
    const { Metadata } = await import('@metaplex-foundation/mpl-token-metadata');
    const rpc = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');
    const mintPk = new PublicKey(mint);
    const pdas = await Metadata.pda(mintPk);
    const acc = await connection.getAccountInfo(pdas, 'confirmed');
    if (!acc) return null;
    const meta = Metadata.fromAccountInfo(acc)[0];
    const uri = meta?.data?.uri?.trim();
    if (!uri) return null;
    const res = await fetch(uri, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const j = await res.json();
    return {
      name: (j?.name as string | undefined) || undefined,
      symbol: (j?.symbol as string | undefined) || undefined,
      image: (j?.image as string | undefined) || undefined,
      description: (j?.description as string | undefined) || undefined,
      website: (j?.website as string | undefined) || undefined,
      twitter: (j?.twitter as string | undefined) || undefined,
      telegram: (j?.telegram as string | undefined) || undefined,
    };
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: { params: { mint?: string } }) {
  const mint = context.params?.mint;
  if (!mint || typeof mint !== 'string') {
    return NextResponse.json({ error: 'invalid_mint' }, { status: 400 });
  }
  const birdeyeKey = process.env.BIRDEYE_API_KEY;

  const [ds, be, mx] = await Promise.all([
    fetchDexscreener(mint),
    fetchBirdeye(mint, birdeyeKey),
    fetchMetaplexOnchain(mint),
  ]);

  const draft: CoinDraft = {
    name: (be?.name || ds?.name || mx?.name || 'Unnamed').slice(0, 64),
    symbol: (be?.symbol || ds?.symbol || mx?.symbol || '').slice(0, 16),
    image: be?.image || ds?.image || mx?.image || '',
    description: be?.description || mx?.description || undefined,
    website: be?.website || ds?.website || mx?.website || undefined,
    twitter: be?.twitter || ds?.twitter || mx?.twitter || undefined,
    telegram: be?.telegram || ds?.telegram || mx?.telegram || undefined,
  };

  return NextResponse.json({ ok: true, mint, draft });
}


