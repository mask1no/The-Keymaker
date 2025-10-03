import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const file = join(process.cwd(), 'data', `journal.${y}-${m}-${d}.ndjson`);
    if (!existsSync(file)) return NextResponse.json({ events: [] });
    const raw = readFileSync(file, 'utf8').trim();
    if (!raw) return NextResponse.json({ events: [] });
    const lines = raw.split('\n').slice(-10);
    const events = lines.map((l) => {
      try {
        const o = JSON.parse(l);
        const ev = o.ev || 'event';
        const time = new Date().toISOString().slice(11, 19);
        let summary = '';
        if (ev === 'submit') summary = `bundleId=${o.bundleId} tip=${o.tipLamports}`;
        else if (ev === 'status') summary = `bundleId=${o.bundleId} statuses=${(o.statuses || []).length}`;
        else if (ev === 'ui_last_bundleIds') summary = `last=${(o.bundleIds || []).join(',')}`;
        else if (ev === 'fund') summary = `txSig=${o.txSig} lamports=${o.lamports}`;
        else if (ev === 'wallet_generated') summary = `group=${o.group} pub=${String(o.pub || '').slice(0, 8)}...`;
        return { time, event: ev, summary };
      } catch {
        return null;
      }
    }).filter(Boolean);
    return NextResponse.json({ events });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}


