# Keymaker — lean Solana bundler with Jito, CLI-first, SSR console.

## 10-line Runbook (Non-Coder)

1. pnpm install --ignore-scripts
2. pnpm check:node && pnpm core:build
3. solana-keygen new -o ~/keymaker-payer.json -s
4. solana-keygen pubkey ~/keymaker-payer.json (fund ~0.01 SOL from Phantom)
5. export KEYPAIR_JSON=~/keymaker-payer.json
6. pnpm cli:send # → {bundleId}
7. pnpm cli:status ffm <id> # → {statuses}
8. tail -n 5 data/journal\*.ndjson
9. pnpm dev → open /engine
10. curl /api/metrics | curl /api/health

## Architecture

- Core modules in `lib/core/src`: Jito client, journal, metrics, types.
- CLI in `bin/keymaker.ts` (send/status/fund). Signing is server/CLI only.
- Tiny API: `/api/engine/*` routes for deposit-address, submit, status, metrics, health.
- SSR-only console at `/engine` (no client bundle).

## Usage

- CLI: `pnpm cli:send`, `pnpm cli:status ffm <id>`, `pnpm cli:fund <to> <lamports>`
- Envs: `KEYPAIR_JSON`, `HELIUS_RPC_URL` (or `NEXT_PUBLIC_HELIUS_RPC`), optional `ENGINE_API_TOKEN`.
- Optional: `PRIORITY`, `TIP_LAMPORTS`, `BLOCKHASH`.

## Performance

- SSR-only `/engine`. No client-side signing or heavy bundles.

## Safety

- No browser keys. Repo private. Logs redact secrets.

## Roadmap

- Pump.fun & Raydium adapters emit instruction arrays only; submission stays in core.

## History

- See docs/archive for prior audits and notes.
