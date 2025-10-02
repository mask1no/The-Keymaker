import { mkdirSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';

export function ensureDir(pathStr: string): void {
  if (!existsSync(pathStr)) {
    mkdirSync(pathStr, { recursive: true });
  }
}

export function createDailyJournal(dir: string): string {
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

function sanitize(obj: any): any {
  if (obj == null || typeof obj !== 'object') return obj;
  const out: any = Array.isArray(obj) ? [] : {};
  const keyRe = /(key|secret|token|pass|authorization|cookie|set-cookie)/i;
  for (const [k, v] of Object.entries(obj)) {
    if (keyRe.test(k)) {
      out[k] = '[redacted]';
    } else if (typeof v === 'string') {
      // Remove long opaque tokens embedded in strings
      let s = v.replace(/(api[-_ ]?key=)[^&\s]+/gi, '$1[redacted]');
      s = s.replace(/(authorization:?)\s*bearer\s+[A-Za-z0-9._-]+/gi, '$1 Bearer [redacted]');
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

export function logJsonLine(filePath: string, obj: unknown): void {
  const dir = dirname(filePath);
  ensureDir(dir);
  const safe = sanitize(obj);
  appendFileSync(filePath, JSON.stringify(safe) + '\n', 'utf8');
}
