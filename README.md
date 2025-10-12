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

## Acceptance (first pass)

- Web boots, wallet connect works (Phantom/Solflare/Backpack)
- Daemon WS on 8787, HEALTH messages every 5s
- Market Maker page can send `TASK_CREATE` and receive `TASK_ACCEPTED`
- SQLite file created at `DB_FILE`, tables present

## Security

- No private keys in the web app.
- Daemon keystore encrypted with `KEYSTORE_PASSWORD` (temporary; move to OS keychain next).
- Logs redact secrets; only signatures/slots/amounts are logged.
