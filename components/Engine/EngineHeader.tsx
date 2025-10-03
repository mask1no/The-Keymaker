import BadgePill from '@/components/UI/BadgePill';

export default function EngineHeader(
  { mode, armedUntilLabel, dryRun, cluster, onOpenSettings }:
  { mode: 'JITO_BUNDLE' | 'RPC_FANOUT'; armedUntilLabel: string; dryRun: boolean; cluster: string; onOpenSettings: () => void }
) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-lg font-semibold mr-2">Engine</span>
      <BadgePill tone="accent">Execution: {mode}</BadgePill>
      <BadgePill tone={armedUntilLabel ? 'success' : 'muted'}>ARMED {armedUntilLabel ? `until ${armedUntilLabel}` : '(disarmed)'}</BadgePill>
      <BadgePill tone={dryRun ? 'warn' : 'danger'}>DryRun: {dryRun ? 'ON' : 'OFF'}</BadgePill>
      <BadgePill>Cluster: {cluster}</BadgePill>
      <button className="ml-auto text-sm text-zinc-300 hover:text-white underline" onClick={onOpenSettings}>
        Settings →
      </button>
    </div>
  );
}


