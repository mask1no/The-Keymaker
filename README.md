# The Keymaker

Production-ready Solana bundler UI with strict SSR, hardened APIs, and a dark, accessible theme.

## Quick Start

- pnpm install --ignore-scripts
- pnpm check:node
- pnpm core:build
- pnpm dev

PowerShell tip: run commands separately (no chaining with &&).

## Safety

- Deposit address: GET `/api/engine/deposit-address` returns `{ publicKey }` only.
- Proof endpoint: GET `/api/engine/prove` returns an ed25519 proof of a canonical message.
- Dry-run honored in both engines with journal entries.
- Arming latch required for live submits: `KEYMAKER_ALLOW_LIVE=YES` + timed arm via `/engine`.
- Optional RPC `cluster=devnet`; Jito remains mainnet.
 - In production, `KEYMAKER_SESSION_SECRET` is required; app fails fast if missing.

Verify deposit pubkey:

```bash
solana-keygen pubkey "$Env:KEYPAIR_JSON"
```

## Runbook

- Configure `KEYPAIR_JSON` and `ENGINE_API_TOKEN` in environment.
- Login at `/login` (message-sign only). Middleware gates other routes.
- Manage tracked wallets at `/wallets`.
- Set engine defaults at `/settings`.
- Operate via `/engine` and `/bundle` (SSR-only).

## Docs Hub

See `/md/docs/**` for deep dives and operator notes.

## Docker

Docker assets are under `/docker/**`. Use `-f docker/Dockerfile*` when building.

## Development Notes

- SSR-only routes: `/engine`, `/bundle`, `/settings`, `/wallets`.
- Client island: `/login`.
- API hardening: `runtime='nodejs'`, `dynamic='force-dynamic'`, token guard header, per-IP rate limit, 8KB cap, uniform `apiError`, `requestId`.
- Settings persisted in cookie via `lib/server/settings.ts`.
 - Zero-client-JS on core SSR routes: avoid importing client libraries in `app/layout.tsx` or shared modules.
