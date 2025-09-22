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
  const re = /(key|secret|token|pass)/i;
  for (const [k, v] of Object.entries(obj)) {
    if (re.test(k)) out[k] = '[redacted]';
    else out[k] = typeof v === 'object' ? sanitize(v as any) : v;
  }
  return out;
}

export function logJsonLine(filePath: string, obj: unknown): void {
  const dir = dirname(filePath);
  ensureDir(dir);
  const safe = sanitize(obj);
  appendFileSync(filePath, JSON.stringify(safe) + '\n', 'utf8');
}
