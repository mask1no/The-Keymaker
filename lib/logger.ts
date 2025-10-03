import 'server-only';

type Level = 'info' | 'warn' | 'error';

function isLikelySecretKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes('secret') ||
    k.includes('token') ||
    k.includes('apikey') ||
    k.endsWith('key') ||
    k.includes('password')
  );
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length > 16) return value.slice(0, 4) + '***' + value.slice(-4);
    return '***';
  }
  if (typeof value === 'number') return '***';
  return '***';
}

export function sanitize<T>(input: T): T {
  try {
    if (input == null) return input;
    if (Array.isArray(input)) return input.map((x) => sanitize(x)) as unknown as T;
    if (typeof input === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
        if (isLikelySecretKey(k)) {
          out[k] = redactValue(v);
        } else if (typeof v === 'object' && v !== null) {
          out[k] = sanitize(v);
        } else {
          out[k] = v;
        }
      }
      return out as unknown as T;
    }
    return input;
  } catch {
    return input;
  }
}

export function log(level: Level, message: string, meta?: Record<string, unknown>): void {
  try {
    const payload = meta ? sanitize(meta) : undefined;
    if (level === 'info') console.log(message, payload ?? '');
    else if (level === 'warn') console.warn(message, payload ?? '');
    else console.error(message, payload ?? '');
  } catch {
    // noop
  }
}

export const logger = {
  info: (m: string, meta?: Record<string, unknown>) => log('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log('error', m, meta),
};

export {}; // auto-stubbed (lib/logger.ts)
