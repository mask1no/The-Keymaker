import 'server-only';

// Environment validation and configuration
export interface EnvConfig {
  // Core configuration
  keypairJson: string;
  sessionSecret: string;

  // RPC endpoints
  heliusRpcUrl: string;
  publicHeliusRpc: string;

  // Network configuration
  network: 'mainnet-beta' | 'devnet';

  // API security
  engineApiToken?: string;

  // External API keys
  birdeyeApiKey?: string;
  coingeckoApiKey?: string;

  // Jito configuration
  jitoTipLamports: number;
  jupiterFeeBps: number;

  // Execution defaults
  priority: 'low' | 'med' | 'high' | 'vhigh';
  tipLamports: number;
  blockhash?: string;

  // Monitoring
  sentryDsn?: string;
  sentryAuthToken?: string;
  sentryOrg?: string;
  sentryProject?: string;

  // Development options
  nextStandalone: boolean;
  analyze: boolean;
  dbPath?: string;

  // Rate limiting
  payloadLimitTradesBytes: number;
  payloadLimitEngineBytes: number;
  tradesMaxTxIds: number;
  tradesMaxWallets: number;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}

function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}

function getBooleanEnvVar(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function getNumberEnvVar(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return parsed;
}

export function getEnvConfig(): EnvConfig {
  try {
    return {
      // Core configuration
      keypairJson: getEnvVar('KEYPAIR_JSON'),
      sessionSecret: getEnvVar('KEYMAKER_SESSION_SECRET'),

      // RPC endpoints
      heliusRpcUrl: getEnvVar('HELIUS_RPC_URL'),
      publicHeliusRpc: getEnvVar('NEXT_PUBLIC_HELIUS_RPC'),

      // Network configuration
      network: getEnvVar('NEXT_PUBLIC_NETWORK', 'mainnet-beta') as 'mainnet-beta' | 'devnet',

      // API security
      engineApiToken: getOptionalEnvVar('ENGINE_API_TOKEN'),

      // External API keys
      birdeyeApiKey: getOptionalEnvVar('BIRDEYE_API_KEY'),
      coingeckoApiKey: getOptionalEnvVar('COINGECKO_API_KEY'),

      // Jito configuration
      jitoTipLamports: getNumberEnvVar('NEXT_PUBLIC_JITO_TIP_LAMPORTS', 5000),
      jupiterFeeBps: getNumberEnvVar('NEXT_PUBLIC_JUPITER_FEE_BPS', 5),

      // Execution defaults
      priority: getEnvVar('PRIORITY', 'med') as 'low' | 'med' | 'high' | 'vhigh',
      tipLamports: getNumberEnvVar('TIP_LAMPORTS', 5000),
      blockhash: getOptionalEnvVar('BLOCKHASH'),

      // Monitoring
      sentryDsn: getOptionalEnvVar('SENTRY_DSN'),
      sentryAuthToken: getOptionalEnvVar('SENTRY_AUTH_TOKEN'),
      sentryOrg: getOptionalEnvVar('SENTRY_ORG'),
      sentryProject: getOptionalEnvVar('SENTRY_PROJECT'),

      // Development options
      nextStandalone: getBooleanEnvVar('NEXT_STANDALONE', false),
      analyze: getBooleanEnvVar('ANALYZE', false),
      dbPath: getOptionalEnvVar('DB_PATH'),

      // Rate limiting
      payloadLimitTradesBytes: getNumberEnvVar('PAYLOAD_LIMIT_TRADES_BYTES', 32768),
      payloadLimitEngineBytes: getNumberEnvVar('PAYLOAD_LIMIT_ENGINE_BYTES', 524288),
      tradesMaxTxIds: getNumberEnvVar('TRADES_MAX_TX_IDS', 50),
      tradesMaxWallets: getNumberEnvVar('TRADES_MAX_WALLETS', 50),
    };
  } catch (error) {
    console.error('Environment configuration error:', error);
    throw new Error('Failed to load environment configuration. Please check your .env file.');
  }
}

// Validate environment in production
export function validateProductionEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    const config = getEnvConfig();

    // Check critical production requirements
    if (!config.keypairJson) {
      throw new Error('KEYPAIR_JSON is required in production');
    }

    if (!config.sessionSecret || config.sessionSecret === 'development-insecure-secret') {
      throw new Error('KEYMAKER_SESSION_SECRET must be set to a secure value in production');
    }

    if (!config.heliusRpcUrl) {
      throw new Error('HELIUS_RPC_URL is required in production');
    }

    if (!config.engineApiToken) {
      console.warn('ENGINE_API_TOKEN is not set. Consider setting it for production security.');
    }

    console.log('✅ Production environment validation passed');
  }
}

// Get client-side environment variables
export function getClientEnv() {
  return {
    network: process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta',
    heliusRpc: process.env.NEXT_PUBLIC_HELIUS_RPC,
    jitoTipLamports: parseInt(process.env.NEXT_PUBLIC_JITO_TIP_LAMPORTS || '5000'),
    jupiterFeeBps: parseInt(process.env.NEXT_PUBLIC_JUPITER_FEE_BPS || '5'),
  };
}
