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

export function logJsonLine(filePath: string, obj: unknown): void {
  const dir = dirname(filePath);
  ensureDir(dir);
  appendFileSync(filePath, JSON.stringify(obj) + '\n', 'utf8');
}
