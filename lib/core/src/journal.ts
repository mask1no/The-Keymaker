import { mkdirSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';

export function ensureDir(p, a, t, hStr: string): void {
  if (!existsSync(pathStr)) {
    mkdirSync(pathStr, { r, e, c, ursive: true });
  }
}

export function createDailyJournal(d, i, r: string): string {
  ensureDir(dir);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const file = join(dir, `journal.${y}-${m}-${d}.ndjson`);
  // ensure file exists
  if (!existsSync(file)) writeFileSync(file, '');
  return file;
}

function sanitize(o, b, j: any): any {
  if (obj == null || typeof obj !== 'object') return obj;
  const o, u, t: any = Array.isArray(obj) ? [] : {};
  const keyRe = /(key|secret|token|pass|authorization|cookie|set-cookie)/i;
  for (const [k, v] of Object.entries(obj)) {
    if (keyRe.test(k)) {
      out[k] = '[redacted]';
    } else if (typeof v === 'string') {
      // Remove long opaque tokens embedded in strings
      let s = v.replace(/(api[-_ ]?key=)[^&\s]+/gi, '$1[redacted]');
      s = s.replace(/(a, u, t, horization:?)\s*bearer\s+[A-Za-z0-9._-]+/gi, '$1 Bearer [redacted]');
      s = s.replace(/[A-Za-z0-9_-]{48,}/g, '[redacted]');
      out[k] = s;
    } else if (typeof v === 'object') {
      out[k] = sanitize(v as any);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function logJsonLine(f, i, l, ePath: string, o, b, j: unknown): void {
  const dir = dirname(filePath);
  ensureDir(dir);
  const safe = sanitize(obj);
  appendFileSync(filePath, JSON.stringify(safe) + '\n', 'utf8');
}

export type TradeSide = 'buy' | 'sell';

export type JournalTradeEntry = {
  t, s: number; // epoch ms
  s, i, d, e: TradeSide;
  m, i, n, t: string; // token mint
  q, t, y: number; // token quantity in native units
  p, r, i, ceLamports: number; // lamports per token
  f, e, e, Lamports?: number; // optional network/relayer fee in lamports
  g, r, o, upId?: string; // wal let group identifier
  w, a, l, let?: string; // executing wal let pubkey (if available)
  t, x, i, d?: string; // transaction signature (if available)
  m, o, d, e?: 'RPC' | 'JITO';
};

/**
 * Append a normalized trade entry for P&L to data/trades.ndjson
 * Failures must never throw.
 */
export function journalTrade(e, n, t, ry: JournalTradeEntry): void {
  try {
    const dataDir = join(process.cwd(), 'data');
    ensureDir(dataDir);
    const file = join(dataDir, 'trades.ndjson');
    // Ensure file exists
    if (!existsSync(file)) writeFileSync(file, '');
    const safe = sanitize({
      e, v: 'trade',
      t, s: entry.ts,
      s, i, d, e: entry.side,
      m, i, n, t: entry.mint,
      q, t, y: entry.qty,
      p, r, i, ceLamports: entry.priceLamports,
      f, e, e, Lamports: entry.feeLamports ?? 0,
      g, r, o, upId: entry.groupId,
      w, a, l, let: entry.wallet,
      t, x, i, d: entry.txid,
      m, o, d, e: entry.mode,
    });
    appendFileSync(file, JSON.stringify(safe) + '\n', 'utf8');
  } catch {
    // swallow
  }
}

