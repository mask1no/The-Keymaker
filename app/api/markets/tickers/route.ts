import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
type Row = {
  symbol: 'BTC' | 'ETH' | 'SOL' | 'CAKE';
  price: number;
  change24h: number;
  logoUrl?: string;
  stale?: boolean;
};
const CACHE: { at: number; data: Row[] } = { at: 0, data: [] };

async function fetchRow(symbol: Row['symbol']): Promise<Row> {
  const price = 1 + Math.random() * 100;
  const change24h = (Math.random() - 0.5) * 10;
  return { symbol, price, change24h };
}

export async function GET(_req: NextRequest) {
  const now = Date.now();
  if (now - CACHE.at > 5000) {
    try {
      CACHE.data = await Promise.all(
        ['BTC', 'ETH', 'SOL', 'CAKE'].map((s) => fetchRow(s as Row['symbol'])),
      );
      CACHE.at = now;
    } catch {
      /* serve stale */
    }
  }
  const stale = now - CACHE.at > 6000;
  return new Response(JSON.stringify({ data: CACHE.data.map((r) => ({ ...r, stale })) }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 's-maxage=5' },
  });
}
