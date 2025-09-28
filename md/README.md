# Keymaker — lean Solana bundler with Jito/RPC modes, CLI-first, SSR console.

## 10-line Runbook (Non-Coder)

1. pnpm install --ignore-scripts
2. pnpm check:node && pnpm core:build
3. solana-keygen new -o ~/keymaker-payer.json -s
4. solana-keygen pubkey ~/keymaker-payer.json # fund ~0.01 SOL from Phantom
5. export KEYPAIR_JSON=~/keymaker-payer.json
6. pnpm cli:send # -> {"bundleId": "..."} or mode-specific ids/sigs, then a status map
7. pnpm cli:status ffm <bundleId>
8. tail -n 5 data/journal\*.ndjson
9. pnpm dev && open http://localhost:3000/engine
10. (optional) curl /api/metrics | curl /api/health

PowerShell: run commands separately instead of chaining with &&

## Architecture

- Core modules in `lib/core/src`: Jito client, journal, metrics, types.
- CLI in `bin/keymaker.ts` (send/status/fund). Signing is server/CLI only.
- Tiny API: `/api/engine/*` routes for deposit-address, submit, status, metrics, health.
- SSR-only console at `/engine` (no client bundle).

## Usage

- CLI: `pnpm cli:send`, `pnpm cli:status ffm <id>`, `pnpm cli:fund <to> <lamports>`
- Envs: `KEYPAIR_JSON`, `HELIUS_RPC_URL` (or `NEXT_PUBLIC_HELIUS_RPC`), optional `ENGINE_API_TOKEN`.
- Optional: `PRIORITY`, `TIP_LAMPORTS`, `BLOCKHASH`.

## Execution Modes

- JITO_BUNDLE: best-effort same-slot ordered bundles (tip required; inclusion not guaranteed).
- RPC_FANOUT: separate transactions with concurrency + jitter; not atomic/same-slot.

## API Examples

If `ENGINE_API_TOKEN` is set, include the header `-H "x-engine-token: $ENGINE_API_TOKEN"`.

Deposit address (GET):

```bash
curl -s ${BASE:-http://localhost:3001}/api/engine/deposit-address \
  -H "x-engine-token: $ENGINE_API_TOKEN"
```

Submit (POST) — Jito example:

```bash
curl -s ${BASE:-http://localhost:3001}/api/engine/submit \
  -H "content-type: application/json" \
  -H "x-engine-token: $ENGINE_API_TOKEN" \
  -d '{"mode":"JITO_BUNDLE","region":"ffm","priority":"med","tipLamports":5000}'
```

Submit (POST) — RPC example:

```bash
curl -s ${BASE:-http://localhost:3001}/api/engine/submit \
  -H "content-type: application/json" \
  -H "x-engine-token: $ENGINE_API_TOKEN" \
  -d '{"mode":"RPC_FANOUT","priority":"med","concurrency":4,"jitterMs":[50,150]}'
```

Status (POST):

```bash
curl -s ${BASE:-http://localhost:3001}/api/engine/status \
  -H "content-type: application/json" \
  -H "x-engine-token: $ENGINE_API_TOKEN" \
  -d '{"mode":"JITO_BUNDLE","region":"ffm","bundleId":"<ID>"}'
```

Adapter demo (POST):

```bash
curl -s ${BASE:-http://localhost:3001}/api/adapters/build \
  -H "content-type: application/json" \
  -H "x-engine-token: $ENGINE_API_TOKEN" \
  -d '{"adapter":"spl-mint-demo","memo":"hello"}'
```

Metrics/Health (GET):

```bash
curl -s ${BASE_URL:-http://localhost:3001}/api/metrics
curl -s ${BASE_URL:-http://localhost:3001}/api/health
```

## Design & Performance

- Dark coding theme for legibility (Monokai/Cursor-like). WCAG-friendly contrast, visible focus outlines.
- SSR-only for core pages (`/engine`, `/bundle`, `/settings`, `/dashboard`) → near-zero client JS.
- Market Bento on `/bundle` streams server data with skeletons for instant first paint.

## Login

- Visit `/login` and sign the canonical message with Phantom only (no tx signing in browser):
  `Keymaker-Login|pubkey=<BASE58>|ts=<ISO>|nonce=<hex>` → server verifies ed25519 and issues httpOnly session cookie.
- Middleware gates all routes except `/login` and `/api/**`.

## Settings & Execution Modes

- Settings are the source of truth (`lib/server/settings.ts`):
  `{ mode:'JITO_BUNDLE'|'RPC_FANOUT', region, priority, tipLamports?, chunkSize?, concurrency?, jitterMs?, dryRun?:boolean, cluster?:'mainnet-beta'|'devnet' }`
- Defaults: `{ mode:'JITO_BUNDLE', region:'ffm', priority:'med', chunkSize:5, concurrency:4, jitterMs:[50,150], dryRun:true, cluster:'mainnet-beta' }`.
- Quick badges on `/engine`; full form on `/settings`.

## Market Bento

- `/api/market/[mint]` fetches market stats. `/bundle` SSR shows Price/24h/FDV/Liquidity/Volume; PnL tile currently disabled with CTA.

## Safety

- Proof-of-control before funding:
  1. Verify deposit pubkey equals your payer: PowerShell: `solana-keygen pubkey "$Env:KEYPAIR_JSON"`; macOS/Linux: `solana-keygen pubkey ~/keymaker-payer.json`.
  2. GET `/api/engine/prove` with header `x-engine-token` and verify signature (ed25519) locally.
- DryRun mode: enable via `/engine` UI or send `dryRun:true` in `/api/engine/submit` to simulate only.
- Arming latch: live submits are blocked unless `KEYMAKER_ALLOW_LIVE=YES` and you POST `/api/ops/arm`. Disarm with `/api/ops/disarm`.
- Devnet is supported for RPC fanout via `cluster:"devnet"`.

Example curl:

```bash
# Prove control (no funds)
curl -s ${BASE:-http://localhost:3001}/api/engine/prove -H "x-engine-token: $ENGINE_API_TOKEN"

# Submit dry-run Jito
curl -s ${BASE:-http://localhost:3001}/api/engine/submit \
  -H 'Content-Type: application/json' -H "x-engine-token: $ENGINE_API_TOKEN" \
  -d '{"mode":"JITO_BUNDLE","region":"ffm","priority":"med","dryRun":true}'

# Submit dry-run RPC (devnet)
curl -s ${BASE:-http://localhost:3001}/api/engine/submit \
  -H 'Content-Type: application/json' -H "x-engine-token: $ENGINE_API_TOKEN" \
  -d '{"mode":"RPC_FANOUT","priority":"med","concurrency":4,"jitterMs":[50,150],"dryRun":true,"cluster":"devnet"}'

# Arm live window
curl -s ${BASE:-http://localhost:3001}/api/ops/arm -H "x-engine-token: $ENGINE_API_TOKEN" -X POST -d '{"minutes":15}'
```

- No browser keys. Repo private. Logs redact secrets.
- Engine API is Node runtime and dynamic; guarded by optional `ENGINE_API_TOKEN`, rate limited, size-capped, and schema-validated.
- Strict security headers via `next.config.js` (CSP, frameguard, no-referrer, nosniff, permissions-policy). No third-party client fetches.

## Docs

This is the canonical docs home. Related docs:

- `/md/RUNBOOK.md` — run commands and sanity checks
- `/md/OPS.md` — operational notes
- `/md/PRD.md` — product/design spec

> Merged content from: `md/docs/README.md` (commit preserved via git mv).
