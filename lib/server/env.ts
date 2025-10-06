export function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

export function warnEnv(key: string): void {
  if (!process.env[key]) console.warn(`[warn] Optional env not set: ${key}`);
}

export function assertServerOnly(keys: string[]): void {
  for (const k of keys) {
    if (k.startsWith('NEXT_PUBLIC_'))
      throw new Error(`Server-only keys must not be NEXT_PUBLIC: ${k}`);
  }
}

import 'server-only';

type EnvIssue = { level: 'error' | 'warn'; message: string };

function hasLikelySecret(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  if (
    v.includes('api-key=') ||
    v.includes('apikey=') ||
    v.includes('authorization') ||
    v.includes('bearer ')
  )
    return true;
  // Long opaque token
  if (value.length >= 48 && /[A-Za-z0-9_-]{48,}/.test(value)) return true;
  return false;
}

export function validateEnvAtStartup(): void {
  const issues: EnvIssue[] = [];
  const isProd = process.env.NODE_ENV === 'production';

  // Required in production
  if (isProd) {
    if (!process.env.ENGINE_API_TOKEN || (process.env.ENGINE_API_TOKEN?.length || 0) < 32) {
      issues.push({ level: 'warn', message: 'ENGINE_API_TOKEN is missing or too short' });
    }
    if (
      !process.env.KEYMAKER_SESSION_SECRET ||
      (process.env.KEYMAKER_SESSION_SECRET?.length || 0) < 32
    ) {
      issues.push({ level: 'warn', message: 'KEYMAKER_SESSION_SECRET is missing or too short' });
    }
    if (!process.env.HELIUS_RPC_URL && !process.env.PUBLIC_RPC_URL) {
      issues.push({
        level: 'warn',
        message: 'No RPC configured (HELIUS_RPC_URL or PUBLIC_RPC_URL)',
      });
    }
  }

  // API key hygiene: never expose server-only keys via NEXT_PUBLIC_*
  const publicEnv = Object.entries(process.env)
    .filter(([k]) => k.startsWith('NEXT_PUBLIC_'))
    .reduce<Record<string, string | undefined>>((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {});

  for (const [key, val] of Object.entries(publicEnv)) {
    // Common sensitive keys that should NOT be public
    if (/BIRDEYE|HELIUS|PUMPFUN|SENTRY_DSN_SECRET/i.test(key)) {
      if (val && hasLikelySecret(val)) {
        issues.push({ level: 'error', message: `Unsafe exposure detected: ${key}` });
      }
    }
    // Helius URLs must not include api-key when public
    if (key === 'NEXT_PUBLIC_HELIUS_RPC' && hasLikelySecret(val)) {
      issues.push({
        level: 'error',
        message: 'NEXT_PUBLIC_HELIUS_RPC appears to include a secret token',
      });
    }
    if (key === 'NEXT_PUBLIC_JITO_ENDPOINT' && hasLikelySecret(val)) {
      issues.push({
        level: 'error',
        message: 'NEXT_PUBLIC_JITO_ENDPOINT appears to include a secret token',
      });
    }
  }

  // SECONDARY RPC presence is optional
  if (
    process.env.SECONDARY_RPC_URL &&
    process.env.SECONDARY_RPC_URL === process.env.HELIUS_RPC_URL
  ) {
    issues.push({
      level: 'warn',
      message: 'SECONDARY_RPC_URL equals primary; failover will be ineffective',
    });
  }

  // Emit issues
  for (const i of issues) {
    const msg = `[env] ${i.level.toUpperCase()}: ${i.message}`;
    if (i.level === 'error') {
      if (isProd) {
        // Crash only for critical exposures
        throw new Error(msg);
      } else {
        console.error(msg);
      }
    } else {
      console.warn(msg);
    }
  }
}
