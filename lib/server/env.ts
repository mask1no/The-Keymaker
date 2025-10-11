import 'server-only';
import { z } from 'zod';

// Server-only environment variables that must never be exposed to client
const serverEnvSchema = z.object({
  // Core secrets (required in production)
  HELIUS_RPC_URL: z.string().url().optional(),
  HELIUS_WS_URL: z.string().url().optional(),
  ENGINE_API_TOKEN: z
    .string()
    .min(16, 'ENGINE_API_TOKEN must be at least 16 characters')
    .optional(),
  BIRDEYE_API_KEY: z.string().optional(),
  KEYMAKER_MASTER_PASSPHRASE: z
    .string()
    .min(12, 'KEYMAKER_MASTER_PASSPHRASE must be at least 12 characters')
    .optional(),
  KEYMAKER_SESSION_SECRET: z
    .string()
    .min(32, 'KEYMAKER_SESSION_SECRET must be at least 32 characters')
    .optional(),

  // Redis configuration
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Additional RPC endpoints
  RPC_URL: z.string().url().optional(),
  SECONDARY_RPC_URL: z.string().url().optional(),
  PUMPPORTAL_ENDPOINT: z.string().url().optional(),

  // Development/testing
  SMOKE_BASE_URL: z.string().url().optional(),
  KEYMAKER_DISABLE_LIVE_NOW: z.string().optional(),
  KEYMAKER_ALLOW_LIVE: z.string().optional(),
  KEYMAKER_REQUIRE_ARMING: z.string().optional(),
});

// Client-safe environment variables (can be exposed via NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_HELIUS_RPC: z.string().url().optional(),
  NEXT_PUBLIC_HELIUS_WS: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_NETWORK: z.enum(['mainnet-beta', 'devnet']).optional(),
  NEXT_PUBLIC_JITO_TIP_LAMPORTS: z.coerce.number().int().positive().optional(),
  NEXT_PUBLIC_JUPITER_FEE_BPS: z.coerce.number().int().min(0).max(10000).optional(),
  NEXT_PUBLIC_BUNDLE_TX_LIMIT: z.coerce.number().int().min(1).max(20).optional(),
});

// Combined schema for validation
const envSchema = serverEnvSchema.merge(clientEnvSchema);

// Parse and validate environment variables at startup
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${issues}`);
  }
  throw error;
}

// Export validated environment variables
export { env as validatedEnv };

// Legacy compatibility functions
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value;
}

export function warnEnv(key: string): void {
  if (!process.env[key]) console.warn(`[warn] Optional env not set: ${key}`);
}

// Server-only assertion helper
export function assertServerOnly(keys: string[]): void {
  for (const key of keys) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      throw new Error(`Server-only env keys must not start with NEXT_PUBLIC_: ${key}`);
    }
  }
}

// Validate environment at startup (call this in server startup)
export function validateEnvAtStartup(): void {
  const isProd = process.env.NODE_ENV === 'production';

  // Check for secret exposure in public variables
  const publicVars = Object.entries(process.env)
    .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    .filter(([key, value]) => {
      // These should never contain secrets
      const sensitiveKeys = ['HELIUS_RPC', 'JITO_ENDPOINT', 'BIRDEYE', 'SENTRY'];
      return sensitiveKeys.some((sensitive) => key.includes(sensitive)) && value;
    });

  for (const [key, value] of publicVars) {
    if (value && value.length > 50) {
      console.error(`[SECURITY] Potential secret exposure in public env var: ${key}`);
      if (isProd) {
        throw new Error(`Secret exposure detected in production: ${key}`);
      }
    }
  }

  // Validate required secrets in production
  if (isProd) {
    const requiredSecrets = ['HELIUS_RPC_URL', 'KEYMAKER_SESSION_SECRET'];
    for (const secret of requiredSecrets) {
      if (!process.env[secret] || process.env[secret]!.length < 16) {
        throw new Error(`Required secret missing or too short in production: ${secret}`);
      }
    }
  }
}
