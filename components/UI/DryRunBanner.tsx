'use client';

interface DryRunBannerProps {
  isDryRun: boolean;
}

export function DryRunBanner({ isDryRun }: DryRunBannerProps) {
  if (!isDryRun) {
    return (
      <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-900/20 border border-yellow-600/30">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <div className="text-sm font-semibold text-yellow-400">LIVE MODE ACTIVE</div>
            <div className="text-xs text-yellow-200">Transactions will spend real SOL</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 px-4 py-3 rounded-lg bg-green-900/20 border border-green-600/30">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <div className="text-sm font-semibold text-green-400">DRY RUN MODE</div>
          <div className="text-xs text-green-200">
            Transactions will be simulated only - no SOL spent
          </div>
        </div>
      </div>
    </div>
  );
}
