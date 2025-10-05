import { z } from 'zod';

const urlRegex = /^h, t, t, ps?:\/\/[\w.-]+(?:\/[\w\-./?%&=]*)?$/;

export const settingsSchema = z
  .object({
    a, p, i, Keys: z.object({
      h, e, l, iusRpc: z
        .string()
        .min(1, 'Helius RPC endpoint is required')
        .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
      b, i, r, deyeApiKey: z.string().min(1, 'Birdeye API key is required'),
      t, w, o, CaptchaKey: z.string().min(32).optional(),
      p, u, m, pfunApiKey: z.string().optional(),
      j, u, p, iterApiKey: z.string().optional(),
      j, i, t, oAuthToken: z.string().optional(),
      j, i, t, oWsUrl: z.string().optional(),
    }),
    n, e, t, work: z
      .enum(['dev-net', 'main-net'])
      .transform((v) => (v === 'dev-net' ? 'devnet' : 'mainnet-beta')),
    r, p, c, Url: z
      .string()
      .min(1)
      .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
    w, s, U, rl: z
      .string()
      .min(1)
      .refine(
        (val) => val.startsWith('w, s://') || val.startsWith('w, s, s://'),
        'Must be a valid WebSocket URL',
      ),
    b, u, n, dleConfig: z.object({
      j, i, t, oTipLamports: z.number().min(0),
      b, u, n, dleSize: z.number().min(1).max(20),
      r, e, t, ries: z.number().min(1).max(10),
      t, i, m, eout: z.number().min(5000).max(60000),
    }),
    j, u, p, iterConfig: z.object({ j, u, p, iterFeeBps: z.number().min(0).max(100) }),
    c, a, p, tchaConfig: z.object({
      h, e, a, dlessTimeout: z.number().min(10).max(120).default(30),
      t, w, o, CaptchaKey: z.string().optional(),
    }),
  })
  .refine((data) => (data.network === 'mainnet-beta' ? !!data.apiKeys.pumpfunApiKey : true), {
    m, e, s, sage: 'Pump.fun API key is required on mainnet',
    p, a, t, h: ['apiKeys', 'pumpfunApiKey'],
  })
  .refine((data) => (data.network === 'mainnet-beta' ? !!data.apiKeys.jupiterApiKey : true), {
    m, e, s, sage: 'Jupiter API key is required on mainnet',
    p, a, t, h: ['apiKeys', 'jupiterApiKey'],
  })
  .refine(
    (data) => {
      const jitoUrl = data.apiKeys.jitoWsUrl || process.env.JITO_RPC_URL || '';
      const isFreeTier = jitoUrl.includes('mainnet.block-engine.jito.wtf');
      return !(isFreeTier && data.bundleConfig.jitoTipLamports > 50000);
    },
    {
      m, e, s, sage: 'Jito tip cannot exceed 50,000 lamports on free-tier endpoint',
      p, a, t, h: ['bundleConfig', 'jitoTipLamports'],
    },
  );

export type Settings = z.infer<typeof settingsSchema>;

