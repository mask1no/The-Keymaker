# The Keymaker — Monorepo (Web + Daemon)

## Architecture

- `apps/web`: Next.js 14 App Router UI (port 3000)
- `apps/daemon`: Node/TS WebSocket daemon (port 8787)
- `packages/types`: shared TypeScript types
- `packages/logger`: minimal structured logger

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set `RPC_URL`, `KEYSTORE_PASSWORD` (local only)
3. `npm run dev` and open `http://localhost:3000`

## Master Wallet

- Connect Phantom/Solflare/Backpack in UI, then click “Set as Master”.
- The daemon performs a nonce-based signature challenge over WS to acknowledge the master wallet.
- The web app never sees or stores private keys.

## Daemon

- Manages encrypted keystore, RPC/Jito, tx planning, bundling, logging.
- Emits `HEALTH` WS messages every 5s with RPC/Jito status and ping.
- Persists SQLite DB at `DB_FILE` with tables for folders, wallets, tasks, task_events, fills.

## Development Scripts

- `npm run dev` — runs web (3000) and daemon (8787)
- `npm run build` — builds both apps

## Acceptance (v0.4)

- WS auth: Pre-auth mutator → `AUTH_REQUIRED`; after nonce sign → `AUTH_OK`.
- Wallets: Folders capped at 20 wallets; 21st create/import → `WALLET_LIMIT_REACHED`.
- Delete→Sweep: Preview shows balances; delete sweeps SOL→master; emits `SWEEP_PROGRESS` then `SWEEP_DONE`; folder removed and master balance increases.
- Notifications bell: Shows `HEALTH` flips (RPC/Jito), `TASK_EVENT(DONE|FAIL|ABORT)`, errors, funding/sweep, and coin ops. Each item links to explorer for `sig` and token `ca`.
- Task lifecycle streaming: `PREP → BUILD → SUBMIT → CONFIRM → SETTLE → DONE/FAIL` over WS. Kill switch toggles run state; `TASK_KILL` stops within a second and emits `FAIL/TASK_CANCELLED`.
- Sniper online: From Market Maker → SNIPE, pick a CA and a folder with ≥2 funded wallets. `execMode="RPC_SPRAY"` (default) or `"JITO_LITE"` (2–3 tx bundles with randomized tips). Example smoke: 0.005 SOL each, `slippageBps=500`, modest CU band; explorer shows signatures.
- PNL/Fills: Minimal rows are stored per fill with qty/price best-effort via pre/post balances; `apps/web/app/(routes)/api/pnl/route.ts` proxies the daemon `/pnl` endpoint.

## Security

- No private keys in web; all signing inside daemon (encrypted keystore). HEALTH pings every 5s. No new env keys beyond documented ones.
