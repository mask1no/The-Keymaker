export interface UiSettings {
  mode: 'RPC' | 'RPC_FANOUT';
  region: 'ffm' | 'ams' | 'ny' | 'tokyo';
  priority: 'low' | 'med' | 'high' | 'vhigh';
  tipLamports: number;
  chunkSize: number;
  concurrency: number;
  jitterMs: [number, number];
  dryRun: boolean;
  cluster: 'mainnet-beta' | 'devnet';
}

const defaultSettings: UiSettings = {
  mode: 'RPC',
  region: 'ffm',
  priority: 'med',
  tipLamports: 5000,
  chunkSize: 5,
  concurrency: 4,
  jitterMs: [50, 150],
  dryRun: true,
  cluster: 'mainnet-beta',
};

let cachedSettings: UiSettings | null = null;

export function getUiSettings(): UiSettings {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    // Try to load from environment variables first
    const envSettings: Partial<UiSettings> = {};
    
    if (process.env.NEXT_PUBLIC_EXECUTION_MODE) {
      envSettings.mode = process.env.NEXT_PUBLIC_EXECUTION_MODE as UiSettings['mode'];
    }
    
    if (process.env.NEXT_PUBLIC_REGION) {
      envSettings.region = process.env.NEXT_PUBLIC_REGION as UiSettings['region'];
    }
    
    if (process.env.NEXT_PUBLIC_PRIORITY) {
      envSettings.priority = process.env.NEXT_PUBLIC_PRIORITY as UiSettings['priority'];
    }
    
    if (process.env.NEXT_PUBLIC_TIP_LAMPORTS) {
      envSettings.tipLamports = parseInt(process.env.NEXT_PUBLIC_TIP_LAMPORTS);
    }
    
    if (process.env.NEXT_PUBLIC_CHUNK_SIZE) {
      envSettings.chunkSize = parseInt(process.env.NEXT_PUBLIC_CHUNK_SIZE);
    }
    
    if (process.env.NEXT_PUBLIC_CONCURRENCY) {
      envSettings.concurrency = parseInt(process.env.NEXT_PUBLIC_CONCURRENCY);
    }
    
    if (process.env.NEXT_PUBLIC_JITTER_MIN && process.env.NEXT_PUBLIC_JITTER_MAX) {
      envSettings.jitterMs = [
        parseInt(process.env.NEXT_PUBLIC_JITTER_MIN),
        parseInt(process.env.NEXT_PUBLIC_JITTER_MAX)
      ];
    }
    
    if (process.env.NEXT_PUBLIC_DRY_RUN) {
      envSettings.dryRun = process.env.NEXT_PUBLIC_DRY_RUN === 'true';
    }
    
    if (process.env.NEXT_PUBLIC_CLUSTER) {
      envSettings.cluster = process.env.NEXT_PUBLIC_CLUSTER as UiSettings['cluster'];
    }

    cachedSettings = { ...defaultSettings, ...envSettings };
  } catch (error) {
    console.warn('Failed to load settings from environment, using defaults:', error);
    cachedSettings = defaultSettings;
  }

  return cachedSettings;
}

export function setUiSettings(settings: Partial<UiSettings>): void {
  const currentSettings = getUiSettings();
  cachedSettings = { ...currentSettings, ...settings };
  
  // In a real application, you might want to persist these settings
  // For now, we'll just update the cache
  console.log('Settings updated:', cachedSettings);
}