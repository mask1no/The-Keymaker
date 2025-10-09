import 'server-only';
import { Connection, Keypair } from '@solana/web3.js';
import { multiWalletBuy, multiWalletSell } from '@/lib/engine/trade';
import { getDb } from '@/lib/db/sqlite';
import { logger } from '@/lib/logger';

interface VolumeProfile {
  id: number;
  name: string;
  mint: string;
  walletPubkeys: string[];
  buySellBias: number; // e.g., 2.0 means 2:1 buy:sell ratio
  minBuySol: number;
  maxBuySol: number;
  minSellPct: number;
  maxSellPct: number;
  delaySecMin: number;
  delaySecMax: number;
  maxActions: number;
  maxSpendSol: number;
  timeStopMin: number;
  maxDrawdownPct: number;
  slippageBps: number;
  impactCapPct: number;
}

interface VolumeRun {
  id: number;
  profileId: number;
  status: 'running' | 'stopped' | 'completed';
  startedAt: number;
  stoppedAt?: number;
  actionsExecuted: number;
  totalSpent: number;
  stats: {
    buys: number;
    sells: number;
    errors: number;
  };
}

const activeRuns = new Map<number, NodeJS.Timeout>();

/**
 * Start a volume bot run from a profile
 */
export async function startVolumeRun(
  profileId: number,
  walletKeypairs: Keypair[],
  connection: Connection
): Promise<number> {
  const db = await getDb();

  // Load profile
  const profile = (await db.get('SELECT * FROM volume_profiles WHERE id = ?', [
    profileId,
  ])) as VolumeProfile;

  if (!profile) {
    throw new Error('Profile not found');
  }

  // Create run record
  const result = await db.run(
    'INSERT INTO volume_runs (profile_id, status, started_at, actions_executed, total_spent, stats_json) VALUES (?, ?, ?, ?, ?, ?)',
    [profileId, 'running', Date.now(), 0, 0, JSON.stringify({ buys: 0, sells: 0, errors: 0 })]
  );

  const runId = result.lastID;

  logger.info('Starting volume run', { runId, profileId, mint: profile.mint });

  // Start execution loop
  scheduleNextAction(runId, profile, walletKeypairs, connection);

  return runId;
}

/**
 * Stop a running volume bot
 */
export async function stopVolumeRun(runId: number): Promise<void> {
  const timeout = activeRuns.get(runId);

  if (timeout) {
    clearTimeout(timeout);
    activeRuns.delete(runId);
  }

  const db = await getDb();
  await db.run('UPDATE volume_runs SET status = ?, stopped_at = ? WHERE id = ?', [
    'stopped',
    Date.now(),
    runId,
  ]);

  logger.info('Stopped volume run', { runId });
}

/**
 * Get status of a volume run
 */
export async function getVolumeRunStatus(runId: number): Promise<VolumeRun | null> {
  const db = await getDb();
  const run = await db.get('SELECT * FROM volume_runs WHERE id = ?', [runId]);

  if (!run) {
    return null;
  }

  return {
    id: run.id,
    profileId: run.profile_id,
    status: run.status,
    startedAt: run.started_at,
    stoppedAt: run.stopped_at,
    actionsExecuted: run.actions_executed,
    totalSpent: run.total_spent,
    stats: JSON.parse(run.stats_json || '{"buys":0,"sells":0,"errors":0}'),
  };
}

/**
 * Schedule the next action in the volume loop
 */
async function scheduleNextAction(
  runId: number,
  profile: VolumeProfile,
  wallets: Keypair[],
  connection: Connection
): Promise<void> {
  const db = await getDb();

  // Check if run is still active
  const run = await getVolumeRunStatus(runId);

  if (!run || run.status !== 'running') {
    return;
  }

  // Check caps
  const elapsed = Date.now() - run.startedAt;
  const elapsedMin = elapsed / 60000;

  if (
    run.actionsExecuted >= profile.maxActions ||
    run.totalSpent >= profile.maxSpendSol ||
    elapsedMin >= profile.timeStopMin
  ) {
    await stopVolumeRun(runId);
    await db.run('UPDATE volume_runs SET status = ? WHERE id = ?', ['completed', runId]);
    logger.info('Volume run completed (caps reached)', { runId });
    return;
  }

  // Random delay
  const delayMs =
    (profile.delaySecMin + Math.random() * (profile.delaySecMax - profile.delaySecMin)) * 1000;

  const timeout = setTimeout(async () => {
    try {
      await executeVolumeAction(runId, profile, wallets, connection);
      // Schedule next
      scheduleNextAction(runId, profile, wallets, connection);
    } catch (error) {
      logger.error('Volume action failed', { runId, error });
      // Continue despite errors
      scheduleNextAction(runId, profile, wallets, connection);
    }
  }, delayMs);

  activeRuns.set(runId, timeout);
}

/**
 * Execute a single buy or sell action
 */
async function executeVolumeAction(
  runId: number,
  profile: VolumeProfile,
  wallets: Keypair[],
  connection: Connection
): Promise<void> {
  const db = await getDb();
  const run = await getVolumeRunStatus(runId);

  if (!run) return;

  // Decide buy vs sell based on bias
  const buyProbability = profile.buySellBias / (profile.buySellBias + 1);
  const isBuy = Math.random() < buyProbability;

  const stats = run.stats;

  try {
    if (isBuy) {
      // Random buy amount
      const buySol = profile.minBuySol + Math.random() * (profile.maxBuySol - profile.minBuySol);

      // Pick random wallet
      const wallet = wallets[Math.floor(Math.random() * wallets.length)];

      const results = await multiWalletBuy({
        mint: profile.mint,
        wallets: [wallet],
        perWalletSolLamports: Math.floor(buySol * 1e9),
        slippageBps: profile.slippageBps,
        impactCapPct: profile.impactCapPct,
        connection,
        dryRun: false,
      });

      if (results[0]?.success) {
        stats.buys++;
        await db.run(
          'UPDATE volume_runs SET actions_executed = actions_executed + 1, total_spent = total_spent + ?, stats_json = ? WHERE id = ?',
          [buySol, JSON.stringify(stats), runId]
        );
      } else {
        stats.errors++;
      }
    } else {
      // Random sell percent
      const sellPct =
        profile.minSellPct + Math.random() * (profile.maxSellPct - profile.minSellPct);

      const wallet = wallets[Math.floor(Math.random() * wallets.length)];

      const results = await multiWalletSell({
        mint: profile.mint,
        wallets: [wallet],
        sellPctOrAmount: sellPct,
        slippageBps: profile.slippageBps,
        connection,
        dryRun: false,
      });

      if (results[0]?.success) {
        stats.sells++;
        await db.run(
          'UPDATE volume_runs SET actions_executed = actions_executed + 1, stats_json = ? WHERE id = ?',
          [JSON.stringify(stats), runId]
        );
      } else {
        stats.errors++;
      }
    }

    logger.info('Volume action executed', {
      runId,
      action: isBuy ? 'buy' : 'sell',
      success: true,
    });
  } catch (error) {
    stats.errors++;
    await db.run('UPDATE volume_runs SET stats_json = ? WHERE id = ?', [
      JSON.stringify(stats),
      runId,
    ]);

    logger.error('Volume action failed', { runId, error });
  }
}

/**
 * Resume all running volume bots on startup
 */
export async function resumeVolumeBots(connection: Connection): Promise<void> {
  const db = await getDb();
  const runs = await db.all('SELECT * FROM volume_runs WHERE status = ?', ['running']);

  logger.info('Resuming volume runs', { count: runs.length });

  for (const run of runs) {
    const profile = await db.get('SELECT * FROM volume_profiles WHERE id = ?', [run.profile_id]);

    if (!profile) continue;

    // TODO: Load wallet keypairs for this profile
    const wallets: Keypair[] = [];

    scheduleNextAction(run.id, profile as VolumeProfile, wallets, connection);
  }
}

