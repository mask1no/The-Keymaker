import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { DEFAULT_CUSTOM_FEES, DEFAULT_HOTKEYS } from '@/lib/types/ui';
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

const UiSettingsSchema = z.object({
  customFees: CustomFeesSchema,
  hotkeys: HotkeysSchema,
});

async function ensureTables() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ui_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function readSettings(): Promise<z.infer<typeof UiSettingsSchema>> {
  await ensureTables();
  const db = await getDb();
  const rows = await db.all('SELECT key, value FROM ui_settings');
  const map = new Map<string, string>(rows.map((r: any) => [r.key, r.value]));
  const customFees = map.get('customFees');
  const hotkeys = map.get('hotkeys');
  const data = {
    customFees: customFees ? JSON.parse(customFees) : DEFAULT_CUSTOM_FEES,
    hotkeys: hotkeys ? JSON.parse(hotkeys) : DEFAULT_HOTKEYS,
  };
  return UiSettingsSchema.parse(data);
}

async function writeSettings(next: z.infer<typeof UiSettingsSchema>) {
  await ensureTables();
  const db = await getDb();
  const tx = await db.exec('BEGIN');
  try {
    await db.run('INSERT OR REPLACE INTO ui_settings (key, value) VALUES (?, ?)', [
      'customFees',
      JSON.stringify(next.customFees),
    ]);
    await db.run('INSERT OR REPLACE INTO ui_settings (key, value) VALUES (?, ?)', [
      'hotkeys',
      JSON.stringify(next.hotkeys),
    ]);
    await db.exec('COMMIT');
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
}

export async function GET() {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const data = await readSettings();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const payload = await req.json();
    const parsed = UiSettingsSchema.parse(payload);
    await writeSettings(parsed);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getUiSettings, setUiSettings } from '@/lib/server/settings';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ui = getUiSettings();
    return NextResponse.json(ui);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  mode: z.enum(['JITO_BUNDLE', 'RPC_FANOUT']).optional(),
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  tipLamports: z.number().int().min(0).optional(),
  chunkSize: z.number().int().min(1).max(50).optional(),
  concurrency: z.number().int().min(1).max(20).optional(),
  jitterMs: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  dryRun: z.boolean().optional(),
  cluster: z.enum(['mainnet-beta', 'devnet']).optional(),
  liveMode: z.boolean().optional(),
  rpcHttp: z.string().url().optional(),
  wsUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const next = UpdateSchema.parse(body);
    setUiSettings(next);
    const ui = getUiSettings();
    return NextResponse.json(ui);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
