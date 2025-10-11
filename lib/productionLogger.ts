import { mkdirSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

function ensureDir(pathStr: string): void {
  if (!existsSync(pathStr)) mkdirSync(pathStr, { recursive: true });
}

export type EngineLog = {
  corrId?: string;
  route?: string;
  wallet?: string;
  mint?: string;
  side?: 'buy' | 'sell';
  lamports?: number;
  status?: string;
  slot?: number;
  signature?: string;
  message?: string;
  level?: 'info' | 'warn' | 'error';
  at?: string;
};

const filePath = join(process.cwd(), 'logs', 'engine.jsonl');
ensureDir(dirname(filePath));

export function logEngineJsonl(entry: EngineLog) {
  try {
    const line = JSON.stringify({ at: new Date().toISOString(), level: 'info', ...entry });
    appendFileSync(filePath, line + '\n', 'utf8');
  } catch {}
}

export const log = {
  info: (...a: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') console.log('[i]', ...a);
  },
  warn: (...a: unknown[]) => console.warn('[w]', ...a),
  error: (...a: unknown[]) => console.error('[e]', ...a),
};
