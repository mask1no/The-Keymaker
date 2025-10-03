import 'server-only';

type UiSettings = {
  mode: 'JITO_BUNDLE' | 'RPC_FANOUT';
  region: 'ffm' | 'ams' | 'ny' | 'tokyo';
  priority: 'low' | 'med' | 'high';
  tipLamports: number;
  chunkSize: number;
  concurrency: number;
  jitterMs: [number, number];
  dryRun: boolean;
  cluster: 'mainnet-beta' | 'devnet';
  liveMode: boolean;
  rpcHttp?: string;
  wsUrl?: string;
};

const DEFAULTS: UiSettings = {
  mode: 'JITO_BUNDLE',
  region: 'ffm',
  priority: 'med',
  tipLamports: Number(process.env.NEXT_PUBLIC_JITO_TIP_LAMPORTS || 5000),
  chunkSize: 5,
  concurrency: 4,
  jitterMs: [50, 150],
  dryRun: (process.env.DRY_RUN_DEFAULT || 'YES').toUpperCase() === 'YES',
  cluster: 'mainnet-beta',
  liveMode: false,
  rpcHttp: process.env.NEXT_PUBLIC_HELIUS_RPC || undefined,
  wsUrl: process.env.HELIUS_WS_URL || process.env.NEXT_PUBLIC_HELIUS_WS || undefined,
};

// Persist across dev HMR
const GLOBAL_KEY = '__KM_UI_SETTINGS__';
// @ts-expect-error attach to global for HMR
globalThis[GLOBAL_KEY] = globalThis[GLOBAL_KEY] || { ...DEFAULTS } as UiSettings;
// @ts-expect-error read from global
let uiSettings: UiSettings = globalThis[GLOBAL_KEY];

export function getUiSettings(): UiSettings {
  return { ...uiSettings };
}

export function setUiSettings(next: Partial<UiSettings>): UiSettings {
  uiSettings = { ...uiSettings, ...next };
  // @ts-expect-error keep global in sync
  globalThis[GLOBAL_KEY] = uiSettings;
  return getUiSettings();
}
