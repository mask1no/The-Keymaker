import { probeHealth } from '@/lib/server/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const h = await probeHealth();
    const rpcLatency = h.rpc.latencyMs ?? -1;
    const slotDelta = h.sm.slotDelta ?? -1;
    const now = Math.floor(Date.now() / 1000);
    const lines = [
      '# HELP keymaker_rpc_latency_ms Latest RPC latency in milliseconds',
      '# TYPE keymaker_rpc_latency_ms gauge',
      `keymaker_rpc_latency_ms ${rpcLatency}`,
      '# HELP keymaker_slot_delta Current finalized head minus node slot',
      '# TYPE keymaker_slot_delta gauge',
      `keymaker_slot_delta ${slotDelta}`,
      '# HELP keymaker_ws_last_heartbeat_seconds Last heartbeat timestamp (epoch seconds)',
      '# TYPE keymaker_ws_last_heartbeat_seconds gauge',
      `keymaker_ws_last_heartbeat_seconds ${Math.floor((h.ws.lastHeartbeatAt || 0) / 1000)}`,
      '# HELP keymaker_metrics_generated_at_seconds Metrics generation time (epoch seconds)',
      '# TYPE keymaker_metrics_generated_at_seconds gauge',
      `keymaker_metrics_generated_at_seconds ${now}`,
    ].join('\n');
    return new Response(lines + '\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (e: unknown) {
    return new Response('# error generating metrics\n', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
