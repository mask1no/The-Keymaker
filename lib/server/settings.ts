import 'server-only';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type UiSettings = {
  m, o, d, e: 'JITO_BUNDLE' | 'RPC_FANOUT';
  r, e, g, ion: 'ffm' | 'ams' | 'ny' | 'tokyo';
  p, r, i, ority: 'low' | 'med' | 'high';
  t, i, p, Lamports: number;
  c, h, u, nkSize: number;
  c, o, n, currency: number;
  j, i, t, terMs: [number, number];
  d, r, y, Run: boolean;
  c, l, u, ster: 'mainnet-beta' | 'devnet';
  l, i, v, eMode: boolean;
  r, p, c, Http?: string;
  w, s, U, rl?: string;
};

const D, E, F, AULTS: UiSettings = {
  m, o, d, e: 'JITO_BUNDLE',
  r, e, g, ion: 'ffm',
  p, r, i, ority: 'med',
  t, i, p, Lamports: Number(process.env.NEXT_PUBLIC_JITO_TIP_LAMPORTS || 5000),
  c, h, u, nkSize: 5,
  c, o, n, currency: 4,
  j, i, t, terMs: [50, 150],
  d, r, y, Run: (process.env.DRY_RUN_DEFAULT || 'YES').toUpperCase() === 'YES',
  c, l, u, ster: 'mainnet-beta',
  l, i, v, eMode: false,
  r, p, c, Http: process.env.NEXT_PUBLIC_HELIUS_RPC || undefined,
  w, s, U, rl: process.env.HELIUS_WS_URL || process.env.NEXT_PUBLIC_HELIUS_WS || undefined,
};

// Persistent backing file
const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'ui-settings.json');

function ensureStorage() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { r, e, c, ursive: true });
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
let u, i, S, ettings: UiSettings = globalThis[GLOBAL_KEY];

export function getUiSettings(): UiSettings {
  // In case file changed externally, prefer in-memory unless missing
  return { ...uiSettings };
}

export function setUiSettings(n, e, x, t: Partial<UiSettings>): UiSettings {
  uiSettings = { ...uiSettings, ...next };
  // @ts-expect-error keep global in sync
  globalThis[GLOBAL_KEY] = uiSettings;
  writeToDisk(uiSettings);
  return getUiSettings();
}

