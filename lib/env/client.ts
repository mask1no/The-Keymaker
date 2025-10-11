'use client';
import { z } from 'zod';

const ClientEnvSchema = z.object({
  NEXT_PUBLIC_HELIUS_RPC: z.string().url(),
  NEXT_PUBLIC_APP_VERSION: z.string().min(1),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

export function loadClientEnv(): ClientEnv {
  const raw = {
    NEXT_PUBLIC_HELIUS_RPC: process.env.NEXT_PUBLIC_HELIUS_RPC,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
  } as Record<string, unknown>;
  const parsed = ClientEnvSchema.safeParse(raw);
  if (!parsed.success) {
    // In client, avoid throwing hard; provide defaults for better DX
    const fallback: ClientEnv = {
      NEXT_PUBLIC_HELIUS_RPC: 'https://api.mainnet-beta.solana.com',
      NEXT_PUBLIC_APP_VERSION: 'dev',
    };
    return fallback;
  }
  return parsed.data;
}
