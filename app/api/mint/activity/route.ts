import { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';
export const runtime = 'nodejs';

const cache = new Map<string, { ts: number; items: any[] }>();
const TTL = 5000;

async function fetchTrades(_mint: string) {
  return [];
}

export const GET = withSessionAndLimit(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get('mint') || '';
  const sinceTs = Number(searchParams.get('sinceTs') || 0);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
  if (!mint) return { items: [] };
  const ent = cache.get(mint);
  const now = Date.now();
  let items = ent?.items ?? [];
  let stale = false;
  if (!ent || now - ent.ts > TTL) {
    try {
      items = await fetchTrades(mint);
      cache.set(mint, { ts: now, items });
    } catch {
      stale = true;
    }
  }
  const filtered = items.filter((x: any) => !sinceTs || x.ts > sinceTs).slice(0, limit);
  return { items: filtered, stale };
});
