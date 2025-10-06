import { z } from 'zod';

const urlRegex = /^https?:\/\/[\w.-]+(?:\/[\w\-./?%&=]*)?$/;

export const settingsSchema = z
  .object({
    apiKeys: z.object({
      heliusRpc: z
        .string()
        .min(1, 'Helius RPC endpoint is required')
        .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
      birdeyeApiKey: z.string().min(1, 'Birdeye API key is required'),
      twoCaptchaKey: z.string().min(32).optional(),
      pumpfunApiKey: z.string().optional(),
      jupiterApiKey: z.string().optional(),
      jitoAuthToken: z.string().optional(),
      jitoWsUrl: z.string().optional(),
    }),
    network: z
      .enum(['dev-net', 'main-net'])
      .transform((v) => (v === 'dev-net' ? 'devnet' : 'mainnet-beta')),
    rpcUrl: z
      .string()
      .min(1)
      .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
    wsUrl: z
      .string()
      .min(1)
      .refine(
        (val) => val.startsWith('ws://') || val.startsWith('wss://'),
        'Must be a valid WebSocket URL',
      ),
    bundleConfig: z.object({
      jitoTipLamports: z.number().min(0),
      bundleSize: z.number().min(1).max(20),
      retries: z.number().min(1).max(10),
      timeout: z.number().min(5000).max(60000),
    }),
    jupiterConfig: z.object({ jupiterFeeBps: z.number().min(0).max(100) }),
    captchaConfig: z.object({
      headlessTimeout: z.number().min(10).max(120).default(30),
      twoCaptchaKey: z.string().optional(),
    }),
  })
  .refine((data) => (data.network === 'mainnet-beta' ? !!data.apiKeys.pumpfunApiKey : true), {
    message: 'Pump.fun API key is required on mainnet',
    path: ['apiKeys', 'pumpfunApiKey'],
  })
  .refine((data) => (data.network === 'mainnet-beta' ? !!data.apiKeys.jupiterApiKey : true), {
    message: 'Jupiter API key is required on mainnet',
    path: ['apiKeys', 'jupiterApiKey'],
  })
  .refine(
    (data) => {
      const jitoUrl = data.apiKeys.jitoWsUrl || process.env.JITO_RPC_URL || '';
      const isFreeTier = jitoUrl.includes('mainnet.block-engine.jito.wtf');
      return !(isFreeTier && data.bundleConfig.jitoTipLamports > 50000);
    },
    {
      message: 'Jito tip cannot exceed 50,000 lamports on free-tier endpoint',
      path: ['bundleConfig', 'jitoTipLamports'],
    },
  );

export type Settings = z.infer<typeof settingsSchema>;
