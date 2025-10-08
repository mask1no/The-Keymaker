const DashboardWrapper = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/engine" className="card hover:border-white/30 transition-colors">
          <div className="font-medium mb-2">Engine Control</div>
          <div className="text-sm text-zinc-400">
            Configure and execute trades in RPC mode; Turbo tip optional per action
          </div>
        </a>
        <a href="/keymaker" className="card hover:border-white/30 transition-colors">
          <div className="font-medium mb-2">Keymaker</div>
          <div className="text-sm text-zinc-400">Manual cockpit and volume profiles</div>
        </a>
        <a href="/wallets" className="card hover:border-white/30 transition-colors">
          <div className="font-medium mb-2">Wallet Groups</div>
          <div className="text-sm text-zinc-400">
            Create and manage wallet groups for bundle distribution
          </div>
        </a>
        <a href="/settings" className="card hover:border-white/30 transition-colors">
          <div className="font-medium mb-2">Settings</div>
          <div className="text-sm text-zinc-400">
            Configure RPC endpoints, execution modes, and preferences
          </div>
        </a>
        <a href="/pnl" className="card hover:border-white/30 transition-colors">
          <div className="font-medium mb-2">P&L Tracking</div>
          <div className="text-sm text-zinc-400">View profit and loss metrics for your trades</div>
        </a>
        <a href="/guide" className="card hover:border-white/30 transition-colors">
          <div className="font-medium mb-2">Guide</div>
          <div className="text-sm text-zinc-400">Learn how to use The Keymaker effectively</div>
        </a>
      </div>
    </div>
  );
};

export default DashboardWrapper;
