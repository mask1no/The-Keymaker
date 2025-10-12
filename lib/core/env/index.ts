import { z } from 'zod';

const serverSchema = z.object({
  HELIUS_RPC_URL: z.string().url({ message: 'HELIUS_RPC_URL must be a valid URL' }),
  JITO_RELAY_URL: z.string().url({ message: 'JITO_RELAY_URL must be a valid URL' }).optional(),
  JITO_TIP_LAMPORTS_DEFAULT: z
    .string()
    .transform((v) => (v?.trim?.() ? Number(v) : Number.NaN))
    .refine((n) => Number.isFinite(n) && n >= 0, {
      message: 'JITO_TIP_LAMPORTS_DEFAULT must be a non-negative number',
    })
    .optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_API_BASE: z
    .string()
    .url({ message: 'NEXT_PUBLIC_API_BASE must be a valid URL (e.g., http://localhost:3001)' }),
});

type ServerEnv = z.infer<typeof serverSchema> & {
  // normalized numeric default
  JITO_TIP_LAMPORTS_DEFAULT_NUM: number;
};

type PublicEnv = z.infer<typeof publicSchema>;

let cachedServerEnv: ServerEnv | null = null;
let cachedPublicEnv: PublicEnv | null = null;

function loadServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid server env: ${issues}`);
  }
  const tip = Number.isFinite(Number(parsed.data.JITO_TIP_LAMPORTS_DEFAULT))
    ? Number(parsed.data.JITO_TIP_LAMPORTS_DEFAULT)
    : 50_000; // sane small default tip
  cachedServerEnv = { ...parsed.data, JITO_TIP_LAMPORTS_DEFAULT_NUM: tip } as ServerEnv;
  return cachedServerEnv;
}

function loadPublicEnv(): PublicEnv {
  if (cachedPublicEnv) return cachedPublicEnv;
  const parsed = publicSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid public env: ${issues}`);
  }
  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}

export const env = {
  get server(): ServerEnv {
    return loadServerEnv();
  },
  get public(): PublicEnv {
    return loadPublicEnv();
  },
};

export function requireEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  return env.server[key];
}

export function getPublicEnv<K extends keyof PublicEnv>(key: K): PublicEnv[K] {
  return env.public[key];
}


