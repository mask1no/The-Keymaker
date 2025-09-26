import { settingsSchema } from './settings';

describe('Settings Validation', () => {
  const validSettings = {
    apiKeys: {
      heliusRpc: 'https://mainnet.helius-rpc.com/?api-key=test',
      birdeyeApiKey: 'test-birdeye-key',
      twoCaptchaKey: 'a'.repeat(32),
      pumpfunApiKey: 'test-pump-key',
      jupiterApiKey: 'test-jupiter-key',
      jitoAuthToken: 'test-jito-token',
      jitoWsUrl: 'https://jito.example.com',
    },
    network: 'dev-net',
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
    bundleConfig: { jitoTipLamports: 5000, bundleSize: 5, retries: 3, timeout: 30000 },
    jupiterConfig: { jupiterFeeBps: 5 },
    captchaConfig: { headlessTimeout: 30 },
  } as const;

  it('validates correct settings', () => {
    const result = settingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it('transforms network values correctly', () => {
    const dev = settingsSchema.parse({ ...validSettings, network: 'dev-net' });
    expect(dev.network).toBe('devnet');
    const main = settingsSchema.parse({ ...validSettings, network: 'main-net' });
    expect(main.network).toBe('mainnet-beta');
  });

  it('requires valid heliusRpc URL', () => {
    const res = settingsSchema.safeParse({ ...validSettings, apiKeys: { ...validSettings.apiKeys, heliusRpc: 'invalid-url' } });
    expect(res.success).toBe(false);
  });

  it('requires pumpfunApiKey on mainnet', () => {
    const res = settingsSchema.safeParse({ ...validSettings, network: 'main-net', apiKeys: { ...validSettings.apiKeys, pumpfunApiKey: '' } });
    expect(res.success).toBe(false);
  });

  it('enforces free-tier Jito tip cap', () => {
    const res = settingsSchema.safeParse({
      ...validSettings,
      apiKeys: { ...validSettings.apiKeys, jitoWsUrl: 'https://mainnet.block-engine.jito.wtf/api' },
      bundleConfig: { ...validSettings.bundleConfig, jitoTipLamports: 60000 },
    });
    expect(res.success).toBe(false);
  });
}); 