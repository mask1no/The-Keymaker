import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FeePresetEnum = z.enum(['low', 'med', 'high', 'vhigh']);

const CustomFeesSchema = z.object({
  useCustomFees: z.boolean(),
  rpc: z.object({
    buyPriorityLamports: z.number().int().nonnegative(),
    sellPriorityLamports: z.number().int().nonnegative(),
    cuLimit: z.number().int().min(100_000).max(1_400_000),
    preset: FeePresetEnum.optional(),
    autoPriority: z.boolean(),
  }),
  jito: z.object({
    enabled: z.boolean(),
    buyTipLamports: z.number().int().nonnegative(),
    sellTipLamports: z.number().int().nonnegative(),
  }),
  slippageBpsDefault: z.number().int().min(1).max(10_000),
});

const HotkeysSchema = z.object({
  row1: z.string(),
  row2: z.string(),
  row3: z.string(),
  row4: z.string(),
  row5: z.string(),
  row6: z.string(),
  row7: z.string(),
  row8: z.string(),
  row9: z.string(),
  buy: z.string(),
  sell: z.string(),
  enqueueToggle: z.string(),
  refresh: z.string(),
  simulate: z.string(),
  sendLive: z.string(),
  help: z.string(),
});

const VolumeDefaultsSchema = z.object({
  delaySecMin: z.number().int().min(1).max(600).default(2),
  delaySecMax: z.number().int().min(1).max(600).default(5),
  slippageBps: z.number().int().min(1).max(10_000).default(150),
  bias: z
    .tuple([z.number().int().min(0).default(2), z.number().int().min(0).default(1)])
    .default([2, 1]),
});

const FundingDefaultsSchema = z.object({
  masterReserveSol: z.number(),
  defaultBufferSol: z.number(),
  defaultJitterPct: z.number(),
  defaultMinThresholdSol: z.number(),
});

const UiSettingsSchema = z.object({
  customFees: CustomFeesSchema,
  hotkeys: HotkeysSchema,
  volumeDefaults: VolumeDefaultsSchema,
  fundingDefaults: FundingDefaultsSchema,
});

const DEFAULT_CUSTOM_FEES: z.infer<typeof CustomFeesSchema> = {
  useCustomFees: true,
  rpc: {
    buyPriorityLamports: 5_000,
    sellPriorityLamports: 5_000,
    cuLimit: 900_000,
    preset: 'med',
    autoPriority: true,
  },
  jito: { enabled: false, buyTipLamports: 0, sellTipLamports: 0 },
  slippageBpsDefault: 150,
};

const DEFAULT_HOTKEYS: z.infer<typeof HotkeysSchema> = {
  row1: '1',
  row2: '2',
  row3: '3',
  row4: '4',
  row5: '5',
  row6: '6',
  row7: '7',
  row8: '8',
  row9: '9',
  buy: 'b',
  sell: 's',
  enqueueToggle: 'q',
  refresh: 'r',
  simulate: 'Enter',
  sendLive: 'Ctrl+Enter',
  help: '?',
};

const DEFAULT_VOLUME_DEFAULTS: z.infer<typeof VolumeDefaultsSchema> = {
  delaySecMin: 2,
  delaySecMax: 5,
  slippageBps: 150,
  bias: [2, 1],
};

const DEFAULT_FUNDING_DEFAULTS: z.infer<typeof FundingDefaultsSchema> = {
  masterReserveSol: 1,
  defaultBufferSol: 0.02,
  defaultJitterPct: 10,
  defaultMinThresholdSol: 0.005,
};

async function ensureTable() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ui_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function readKey<T>(key: string, fallback: T): Promise<T> {
  await ensureTable();
  const db = await getDb();
  const row = await db.get('SELECT value FROM ui_settings WHERE key = ?', [key]);
  if (!row?.value) return fallback;
  try {
    const parsed = JSON.parse(row.value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

async function writeKey(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  const val = JSON.stringify(value);
  await db.run(
    'INSERT INTO ui_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    [key, val],
  );
}

export async function GET() {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const customFees = await readKey('customFees', DEFAULT_CUSTOM_FEES);
    const hotkeys = await readKey('hotkeys', DEFAULT_HOTKEYS);
    const volumeDefaults = await readKey('volumeDefaults', DEFAULT_VOLUME_DEFAULTS);
    const fundingDefaults = await readKey('fundingDefaults', DEFAULT_FUNDING_DEFAULTS);
    const data = UiSettingsSchema.parse({ customFees, hotkeys, volumeDefaults, fundingDefaults });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_settings', details: e.issues }, { status: 500 });
    }
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

const UpsertSchema = z.object({
  customFees: CustomFeesSchema.optional(),
  hotkeys: HotkeysSchema.optional(),
  volumeDefaults: VolumeDefaultsSchema.optional(),
  fundingDefaults: FundingDefaultsSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const next = UpsertSchema.parse(body);

    const current = {
      customFees: await readKey('customFees', DEFAULT_CUSTOM_FEES),
      hotkeys: await readKey('hotkeys', DEFAULT_HOTKEYS),
      volumeDefaults: await readKey('volumeDefaults', DEFAULT_VOLUME_DEFAULTS),
      fundingDefaults: await readKey('fundingDefaults', DEFAULT_FUNDING_DEFAULTS),
    } as z.infer<typeof UiSettingsSchema>;

    const merged: z.infer<typeof UiSettingsSchema> = {
      customFees: next.customFees ?? current.customFees,
      hotkeys: next.hotkeys ?? current.hotkeys,
      volumeDefaults: next.volumeDefaults ?? current.volumeDefaults,
      fundingDefaults: next.fundingDefaults ?? current.fundingDefaults,
    };

    // Persist only provided keys
    if (next.customFees) await writeKey('customFees', merged.customFees);
    if (next.hotkeys) await writeKey('hotkeys', merged.hotkeys);
    if (next.volumeDefaults) await writeKey('volumeDefaults', merged.volumeDefaults);
    if (next.fundingDefaults) await writeKey('fundingDefaults', merged.fundingDefaults);

    const response = UiSettingsSchema.parse(merged);
    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
