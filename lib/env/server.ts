import 'server-only';
import { z } from 'zod';

const ServerEnvSchema = z.object({
  HELIUS_RPC_URL: z.string().url(),
  HELIUS_RPC_URL_FALLBACK: z.string().url().optional().nullable(),
  HELIUS_WS_URL: z.string().url(),
  JUPITER_API_BASE: z.string().url().default('https://quote-api.jup.ag/v6'),
  BIRDEYE_API_KEY: z.string().optional().nullable(),
  KEYMAKER_ALLOW_LIVE: z.enum(['YES', 'NO']).default('NO'),
  KEYMAKER_REQUIRE_ARMING: z.enum(['YES', 'NO']).default('YES'),
  KEYMAKER_SESSION_SECRET: z.string().min(16),
  KEYMAKER_DATA_DIR: z.string().default('~/.keymaker'),
  KEYMAKER_BACKUP_DIR: z.string().optional().nullable(),
  PROGRAM_ALLOWLIST_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export function loadServerEnv(): ServerEnv {
  const raw = {
    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
    HELIUS_RPC_URL_FALLBACK: process.env.HELIUS_RPC_URL_FALLBACK,
    HELIUS_WS_URL: process.env.HELIUS_WS_URL,
    JUPITER_API_BASE: process.env.JUPITER_API_BASE,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    KEYMAKER_ALLOW_LIVE: process.env.KEYMAKER_ALLOW_LIVE || 'NO',
    KEYMAKER_REQUIRE_ARMING: process.env.KEYMAKER_REQUIRE_ARMING || 'YES',
    KEYMAKER_SESSION_SECRET: process.env.KEYMAKER_SESSION_SECRET,
    KEYMAKER_DATA_DIR: process.env.KEYMAKER_DATA_DIR,
    KEYMAKER_BACKUP_DIR: process.env.KEYMAKER_BACKUP_DIR,
    PROGRAM_ALLOWLIST_ENABLED: process.env.PROGRAM_ALLOWLIST_ENABLED || 'false',
  } as Record<string, unknown>;
  const parsed = ServerEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const errs = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid server environment: ${errs}`);
  }
  return parsed.data;
}
