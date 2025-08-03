import { z } from 'zod';

// URL validation regex
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/;

export const settingsSchema = z.object({
  apiKeys: z.object({
    heliusRpc: z.string()
      .min(1, 'Helius RPC endpoint is required')
      .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
    birdeyeApiKey: z.string()
      .min(1, 'Birdeye API key is required'),
    pumpfunApiKey: z.string().optional(),
    letsbonkApiKey: z.string().optional(),
    jitoAuthToken: z.string().optional(),
  }),
  network: z.enum(['mainnet-beta', 'devnet']),
  rpcUrl: z.string()
    .min(1, 'RPC URL is required')
    .refine((val) => urlRegex.test(val), 'Must be a valid URL'),
  wsUrl: z.string()
    .min(1, 'WebSocket URL is required')
    .refine((val) => val.startsWith('ws://') || val.startsWith('wss://'), 'Must be a valid WebSocket URL'),
  bundleConfig: z.object({
    tipAmount: z.number().min(0).max(1000000),
    bundleSize: z.number().min(1).max(20),
    retries: z.number().min(1).max(10),
    timeout: z.number().min(5000).max(60000),
  }),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;