import { cookies } from 'next/headers';
import type { ExecutionMode, Priority } from '@/lib/core/src/engine';
import type { RegionKey } from '@/lib/core/src/types';

export interface UiSettings {
  mode: ExecutionMode;
  region: RegionKey;
  priority: Priority;
  tipLamports?: number;
  chunkSize?: number;
  concurrency?: number;
  jitterMs?: [number, number];
  dryRun?: boolean;
  cluster?: 'mainnet-beta' | 'devnet';
  liveMode?: boolean; // explicit user intent to allow live sends (still gated by env + arming)
}

const COOKIE_NAME = 'keymaker_ui_settings';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function getUiSettings(): UiSettings {
  try {
    const c = cookies().get(COOKIE_NAME)?.value || '';
    const raw = c ? (JSON.parse(c) as Partial<UiSettings>) : {};
    const mode = (raw.mode === 'RPC_FANOUT' ? 'RPC_FANOUT' : 'JITO_BUNDLE') as ExecutionMode;
    const region = (
      ['ffm', 'ams', 'ny', 'tokyo'].includes(String(raw.region)) ? raw.region : 'ffm'
    ) as RegionKey;
    const priority = (
      ['low', 'med', 'high', 'vhigh'].includes(String(raw.priority)) ? raw.priority : 'med'
    ) as Priority;
    const tipLamports =
      typeof raw.tipLamports === 'number' ? clamp(raw.tipLamports, 0, 1_000_000) : undefined;
    const chunkSize = typeof raw.chunkSize === 'number' ? clamp(raw.chunkSize, 1, 20) : 5;
    const concurrency = typeof raw.concurrency === 'number' ? clamp(raw.concurrency, 1, 16) : 4;
    const jitterMs: [number, number] = Array.isArray(raw.jitterMs)
      ? [Math.max(0, raw.jitterMs[0] || 0), Math.max(0, raw.jitterMs[1] || 0)]
      : [50, 150];
    const dryRun = typeof raw.dryRun === 'boolean' ? raw.dryRun : true;
    const cluster = raw.cluster === 'devnet' ? 'devnet' : 'mainnet-beta';
    const liveMode = raw.liveMode === true;
    return {
      mode,
      region,
      priority,
      tipLamports,
      chunkSize,
      concurrency,
      jitterMs,
      dryRun,
      cluster,
      liveMode,
    };
  } catch {
    return {
      mode: 'JITO_BUNDLE',
      region: 'ffm',
      priority: 'med',
      chunkSize: 5,
      concurrency: 4,
      jitterMs: [50, 150],
      dryRun: true,
      cluster: 'mainnet-beta',
      liveMode: false,
    };
  }
}

export function setUiSettings(next: Partial<UiSettings>) {
  const current = getUiSettings();
  const merged: UiSettings = { ...current, ...next } as UiSettings;
  cookies().set(COOKIE_NAME, JSON.stringify(merged), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  });
}
