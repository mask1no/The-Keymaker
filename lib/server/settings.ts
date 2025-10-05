import 'server-only';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

// Persistent backing file
const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'ui-settings.json');

function ensureStorage() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) writeFileSync(FILE, JSON.stringify(DEFAULTS, null, 2));
}

function readFromDisk(): UiSettings {
  ensureStorage();
  try {
    const raw = readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // Provide defaults for any missing fields
    return { ...DEFAULTS, ...parsed } as UiSettings;
  } catch {
    return { ...DEFAULTS };
  }
}

function writeToDisk(s: UiSettings) {
  ensureStorage();
  writeFileSync(FILE, JSON.stringify(s, null, 2));
}

// Persist across dev HMR with disk as source of truth
const GLOBAL_KEY = '__KM_UI_SETTINGS__';
// @ts-expect-error attach to global for HMR
globalThis[GLOBAL_KEY] = globalThis[GLOBAL_KEY] || readFromDisk();
// @ts-expect-error read from global
let uiSettings: UiSettings = globalThis[GLOBAL_KEY];

export function getUiSettings(): UiSettings {
  // In case file changed externally, prefer in-memory unless missing
  return { ...uiSettings };
}

export function setUiSettings(next: Partial<UiSettings>): UiSettings {
  uiSettings = { ...uiSettings, ...next };
  // @ts-expect-error keep global in sync
  globalThis[GLOBAL_KEY] = uiSettings;
  writeToDisk(uiSettings);
  return getUiSettings();
}

