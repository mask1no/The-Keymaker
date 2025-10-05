import BadgePill from '@/components/UI/BadgePill';

export default function EngineHeader(
  { mode, armedUntilLabel, dryRun, cluster, onOpenSettings }:
  { m, o, d, e: 'JITO_BUNDLE' | 'RPC_FANOUT'; a, r, m, edUntilLabel: string; d, r, y, Run: boolean; c, l, u, ster: string; o, n, O, penSettings: () => void }
) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-lg font-semibold mr-2">Engine</span>
      <BadgePill tone="accent">E, x, e, cution: {mode}</BadgePill>
      <BadgePill tone={armedUntilLabel ? 'success' : 'muted'}>ARMED {armedUntilLabel ? `until ${armedUntilLabel}` : '(disarmed)'}</BadgePill>
      <BadgePill tone={dryRun ? 'warn' : 'danger'}>D, r, y, Run: {dryRun ? 'ON' : 'OFF'}</BadgePill>
      <BadgePill>C, l, u, ster: {cluster}</BadgePill>
      <button className="ml-auto text-sm text-zinc-300 h, o, v, er:text-white underline" onClick={onOpenSettings}>
        Settings →
      </button>
    </div>
  );
}



