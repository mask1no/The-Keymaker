import { acquire } from '@/lib/locks/mintLock';
import type { VolumeProfile, VolumeRunStatus, VolumeRunStats } from '@/lib/types/volume';
import { getDb } from '@/lib/db';

type Scheduled = {
  runId: string;
  due: number;
  mint: string;
};

const HEAP: Scheduled[] = [];

function pushSchedule(s: Scheduled) {
  HEAP.push(s);
  HEAP.sort((a, b) => a.due - b.due);
}

function popDue(now: number): Scheduled | undefined {
  if (!HEAP.length) return undefined;
  if (HEAP[0].due > now) return undefined;
  return HEAP.shift();
}

function randomDelay(msMin: number, msMax: number): number {
  const min = Math.min(msMin, msMax) * 1000;
  const max = Math.max(msMin, msMax) * 1000;
  return Math.floor(min + Math.random() * (max - min + 1));
}

async function getProfile(profileId: string): Promise<VolumeProfile | null> {
  const db = await getDb();
  const row = await db.get('SELECT id, name, json FROM volume_profiles WHERE id = ?', [profileId]);
  if (!row) return null;
  try {
    const j = JSON.parse(row.json);
    return { id: row.id, name: row.name, ...j } as VolumeProfile;
  } catch {
    return null;
  }
}

async function updateStats(runId: string, fn: (s: VolumeRunStats) => void) {
  const db = await getDb();
  const row = await db.get('SELECT stats_json FROM volume_runs WHERE id = ?', [runId]);
  const stats: VolumeRunStats = row?.stats_json
    ? JSON.parse(row.stats_json)
    : { actions: 0, buys: 0, sells: 0, spendLamports: 0, startedAt: Date.now() };
  fn(stats);
  await db.run('UPDATE volume_runs SET stats_json = ? WHERE id = ?', [
    JSON.stringify(stats),
    runId,
  ]);
}

async function shouldStop(runId: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.get('SELECT status, stats_json FROM volume_runs WHERE id = ?', [runId]);
  const status: VolumeRunStatus = row?.status || 'stopped';
  if (status === 'stopping' || status === 'stopped' || status === 'completed' || status === 'error')
    return status;
  return null;
}

async function enqueueOne(runId: string, mint: string, profile: VolumeProfile): Promise<void> {
  const release = await acquire(mint);
  try {
    // Placeholder: simulate one action with buy-biased probability
    const buyWeight = Math.max(0, profile.bias?.[0] ?? 2);
    const sellWeight = Math.max(0, profile.bias?.[1] ?? 1);
    const total = buyWeight + sellWeight || 1;
    const isBuy = Math.random() < buyWeight / total;
    await updateStats(runId, (s) => {
      s.actions += 1;
      s.lastTickAt = Date.now();
      if (isBuy) s.buys += 1;
      else s.sells += 1;
    });
  } finally {
    await release();
  }
}

let runnerStarted = false;
function ensurePump() {
  if (runnerStarted) return;
  runnerStarted = true;
  (async function loop() {
    for (;;) {
      const now = Date.now();
      const due = popDue(now);
      if (!due) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      const stop = await shouldStop(due.runId);
      if (stop) continue;
      const db = await getDb();
      const run = await db.get('SELECT profile_id FROM volume_runs WHERE id = ?', [due.runId]);
      const profile = run ? await getProfile(run.profile_id) : null;
      if (!profile) continue;
      await enqueueOne(due.runId, due.mint, profile);
      // schedule next for this mint
      const delay = randomDelay(profile.delaySecMin, profile.delaySecMax);
      pushSchedule({ runId: due.runId, mint: due.mint, due: Date.now() + delay });
    }
  })();
}

export async function scheduleRun(runId: string, profile: VolumeProfile) {
  ensurePump();
  const now = Date.now();
  for (const m of profile.mints) {
    pushSchedule({
      runId,
      mint: m,
      due: now + randomDelay(profile.delaySecMin, profile.delaySecMax),
    });
  }
}

export async function resumeRunsOnBoot() {
  try {
    const db = await getDb();
    const rows = await db.all("SELECT id, profile_id FROM volume_runs WHERE status = 'running'");
    for (const r of rows || []) {
      const profile = await getProfile(r.profile_id);
      if (profile) await scheduleRun(r.id, profile);
    }
  } catch {}
}
