# Acceptance Checklist

- Auth handshake required for mutators (folders/wallets/tasks). Try a mutator unauthenticated → ERR AUTH_REQUIRED.
- Wallets: create/import up to 20 per folder; 21st → WALLET_LIMIT_REACHED.
- Delete/Sweep: preview returns plan; sweep streams SWEEP_PROGRESS then SWEEP_DONE; master SOL increases; wallets remain (Return SOL only) or are deleted (delete path).
- Sniper RPC_SPRAY: 2 wallets, 0.005 SOL each, slippage 500 bps → DONE; explorer sigs; FILL notification.
- Sell 100% latest CA (TopActions Fast Sell) → SELL task events; DONE; FILL notifications.
- Return SOL (TopActions) → SWEEP_DONE with signatures.
- Settings defaults injected on TASK_CREATE when fields omitted.
- Jito modes hidden when JITO_BLOCK_ENGINE unset; shown when set.
- Dashboard stats render and refresh.

