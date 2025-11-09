# The Keymaker

**A local, web-based multi-wallet sniper and market-maker for Solana.**  
UI runs on **http://localhost:3000** (Next.js 14).  
Secure daemon runs on **ws://localhost:8787** (Node/TS).  
Targets **user-created memecoins (Pump.fun)** and post-launch routing via **Jupiter v6**.  
Signing, keys, and execution live **only in the daemon**.

> ⚠️ This tool moves real funds. Start tiny and read the **Safety** section.

## Quick Start

```bash
# 1) Install
pnpm i

# 2) Configure
# Web env
copy apps/web/env.sample apps/web/.env.local
# Daemon env
copy apps/daemon/env.sample apps/daemon/.env.local
# Set KEYSTORE_PASSWORD and RPC_URL at minimum; optionally set GRPC_ENDPOINT and JITO_BLOCK_ENGINE

# 3) Build (optional) and Run
pnpm -r build
pnpm dev
# Web:    http://localhost:3000
# Daemon: ws://localhost:8787  (HEALTH ping every 5s)
```

### 10‑Minute First Trade (Local)

1) Prepare env (root `.env`): set `KEYSTORE_PASSWORD`, a reliable `RPC_URL`, and `MASTER_SECRET_BASE58` matching the wallet you connect in the UI (dev-only).
2) Start locally:
   - `npm run dev`
   - Web: `http://localhost:3000`, Daemon WS: `ws://localhost:8787`
3) In the UI → Wallets:
   - Create folder `default`
   - Create 2 wallets inside
   - Fund the folder with `0.02 SOL` total (master funds are required)
4) Open `/coin/[mint]` for your token CA:
   - Wallets: `2` • Max SOL/Wallet: `0.005` • Slippage: `500 bps`
   - Click “Buy 50%” → watch live TASK_EVENT and explorer sigs
5) Click “Sell 100%” to exit; open PnL to see fills aggregate by CA.


## What This Is (and isn’t)

* **Is:** Local dashboard to create/import wallets, group them, and execute **multi-wallet buys** on your tokens (and others) with **three execution modes**:

  * `RPC_SPRAY` — parallel RPC sends with jitter/variance
  * `STEALTH_STRETCH` — spread over time with heavier variance
  * `JITO_LITE` — small Jito bundles (2–3 tx) with randomized tips, plus fallback to RPC
* **Isn’t:** A hosted service; a key-pasting website; or a magic profit machine. It’s tooling.

## Architecture

```
apps/
  web/            # Next.js 14 UI (App Router)
  daemon/         # Node/TS WebSocket server (signing + execution)
packages/
  types/          # Shared TypeScript types (tasks, params, events)
  logger/         # Structured logging (redacts sensitive data)
.github/workflows # CI (lint/build)
```

**Security invariants (non-negotiable):**

* Web never sees private keys; daemon signs everything.
* All mutating WS calls require **nonce-based wallet auth** (master wallet signature).
* Program **allowlist** enforced at submit time.
* **Caps**, **kill switch**, **idempotency**, and **per-mint locks** guard every submit path.

## Configuration

Only these env vars are recognized:

```
# Environment file precedence
# - Daemon: loads apps/daemon/.env.local first, then apps/daemon/.env (fallback)
# - Web (Next.js): loads apps/web/.env.local

RPC_URL=...                    # required (primary)
RPC_URLS=...                   # optional (comma/space-separated fanout list)
GRPC_ENDPOINT=...              # optional (Helius Yellowstone/LaserStream). Blank => listener disabled
JITO_BLOCK_ENGINE=...          # optional. Blank => Jito disabled, RPC fallback only
BIRDEYE_API_KEY=...            # optional (marks/PNL)
DB_FILE=./apps/daemon/keymaker.sqlite
KEYSTORE_FILE=./apps/daemon/keystore.json
KEYSTORE_PASSWORD=change_me_dev_only
MASTER_SECRET_BASE58=          # dev-only backdoor; should be blank in real use
PUMPFUN_API_BASE=              # optional (HTTP publish path). If set, COIN_PUBLISH_PUMPFUN uses POST { mint, payerPubkey }
PUMPFUN_API_KEY=               # optional bearer for Pump.fun HTTP if required

# Auto-snipe (listener → strategy)
AUTOSNIPE_ENABLED=0
AUTOSNIPE_FOLDER_ID=
AUTOSNIPE_WALLET_COUNT=3
AUTOSNIPE_BUY_SOL=0.01
AUTOSNIPE_SLIPPAGE_BPS=500
AUTOSNIPE_EXEC_MODE=JITO_BUNDLE
AUTOSNIPE_JITTER_MIN_MS=20
AUTOSNIPE_JITTER_MAX_MS=120
AUTOSNIPE_CU_MIN=800
AUTOSNIPE_CU_MAX=1500
AUTOSNIPE_TIP_MIN=0
AUTOSNIPE_TIP_MAX=0
AUTOSNIPE_DEDUP_SEC=60
```

**Fallback behavior**

* No `GRPC_ENDPOINT` → app runs; listener off; manual CA inputs still work.
* No `JITO_BLOCK_ENGINE` → `JITO_LITE` downgrades to RPC sends automatically.

## Features & Status

| Area          | What it does                                                                           | Status                  |
| ------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| Auth          | WS nonce challenge; master wallet signs message before any mutator                     | ✅                       |
| Wallets       | Create/import; **≤20** per folder; list/rename                                         | ✅                       |
| Delete/Sweep  | Folder delete previews balances; sweeps **SOL → master**; streams progress; idempotent | ✅                       |
| Notifications | Bell with unread badge; task events, health flips, errors; explorer links              | ✅                       |
| Sniper        | `RPC_SPRAY`, `STEALTH_STRETCH`, `JITO_LITE` (small bundles + tip variance)             | ✅/🚧 (*see Acceptance*) |
| Auto‑snipe    | Helius gRPC Pump.fun events → strategy → SNIPE tasks (filters + dedupe)                 | ✅ (configurable)        |
| RPC fanout    | Multiple endpoints with hedged send + pooled confirms                                   | ✅                       |
| PnL/Fills     | Best-effort via pre/post balances; records qty, price, fees, tips                      | ✅/🚧                    |
| Listener      | Helius Yellowstone/LaserStream gRPC; emits Pump.fun create events                      | ✅/🚧 (optional)         |
| Exits         | Fast Sell All; Sell Ladder 25/50/100                                                    | ✅                       |
| Security      | CSP headers; keystore/db/logs ignored in VCS                                            | ✅                       |

> ✅/🚧 = implemented but verify via **Acceptance**.

## Execution Modes

* **RPC_SPRAY**: parallel sending with per-wallet **jitter**, **slippage variance**, **compute-unit price variance**.
* **STEALTH_STRETCH**: spray across a wider window; lower concurrency + heavier randomization.
* **JITO_LITE**: pack **2–3 signed tx**/bundle, randomize tip within band, slight slot delays. Falls back to RPC when no block engine.

## Safety

* **Caps** (enforced in daemon): `MAX_TX_SOL`, `MAX_SOL_PER_MIN`, `MAX_SESSION_SOL`.
* **Kill switch**: checked before each send; stops new sends immediately.
* **Program allowlist**: Allowed → **System**, **SPL Token**, **Metaplex Metadata**, **Jupiter router** (add Pump.fun when direct IX enabled).
* **Idempotency**: stable hash of tx message; duplicates return prior sigs.
* **Per-mint locks**: prevent overlapping tasks on same CA.
* **Dev-only master secret**: `MASTER_SECRET_BASE58` is for local testing only. Leave blank for real use.
* **CSP**: strict default-src 'self'; WS/HTTP target derived from NEXT_PUBLIC_WS_URL.

## WebSocket API (client ↔ daemon)

**Auth**

* `AUTH_CHALLENGE` → `{ kind:"AUTH_NONCE", nonce }`
* `AUTH_PROVE { pubkey, signature, nonce }` → `{ kind:"AUTH_OK", masterPubkey }`
* Errors: `{ kind:"ERR", error:"AUTH_REQUIRED"|"AUTH_BAD_SIGNATURE"|"AUTH_PUBKEY_MISMATCH", ref? }`

**Folders/Wallets**

* `FOLDER_LIST` → `{ kind:"FOLDERS", folders:[{id,name,count}] }`
* `FOLDER_CREATE { id, name }` → `{ACK}` → `FOLDERS`
* `FOLDER_RENAME { id, name }` → `FOLDERS`
* `FOLDER_WALLETS { folderId }` → `{ kind:"WALLETS", folderId, wallets:[{id,pubkey,role}] }`
* `WALLET_CREATE { folderId }` (≤20) → `WALLETS` or `{ERR, error:"WALLET_LIMIT_REACHED"}`
* `WALLET_IMPORT { folderId, secretBase58 }` → `WALLETS`

**Delete/Sweep**

* `FOLDER_DELETE_PREVIEW { id }` → `{ kind:"FOLDER_DELETE_PLAN", wallets:[{pubkey,solLamports,tokens:[...] }], estFeesLamports }`
* `FOLDER_DELETE { id, masterPubkey }` → stream `{ kind:"SWEEP_PROGRESS", id, info:{pubkey,sig} }` then `{ kind:"SWEEP_DONE", id, signatures:[...] }`

**Tasks**

* `TASK_CREATE { kind:"SNIPE"|"MM", ca, params }` → `{ kind:"TASK_ACCEPTED", id }` then events
* `TASK_LIST` → `{ kind:"TASKS", tasks:[...] }`
* `TASK_KILL { id }` → `{ kind:"TASK_EVENT", id, state:"FAIL", info:{ error:"TASK_CANCELLED" } }`

**Events**

* `TASK_EVENT { id, state:"PREP"|"BUILD"|"SUBMIT"|"CONFIRM"|"SETTLE"|"DONE"|"FAIL", info? }`
* `HEALTH { rpc:{ok,lagMs}, grpc:{ok}, jito:{ok}, ts }`
* `{ kind:"ERR", error:"CODE", ref? }`

## Acceptance (prove runtime)

1. **Auth:** unauthenticated mutator → `AUTH_REQUIRED`; after nonce sign → `AUTH_OK`.
2. **Wallets:** create/import up to 20; 21st → `WALLET_LIMIT_REACHED`.
3. **Delete→Sweep:** preview, then stream `SWEEP_PROGRESS` → `SWEEP_DONE`; master SOL increases.
4. **Listener:** with `GRPC_ENDPOINT` set, log Pump.fun create `{mint, ca, slot, sig}`; without it, app runs without crashes.
5. **Sniper — RPC_SPRAY:** 2 wallets, `0.005 SOL`, `slippage=500bps` → `PREP→…→DONE`; two explorer sigs; fills written; notifications fired.
6. **Sniper — JITO_LITE:** if `JITO_BLOCK_ENGINE` set, 2–3 tx bundles with tip band; confirm inclusion + time-to-confirm.
7. **Kill & caps:** Kill stops new sends within ~1s; exceeding caps yields `{ERR:"CAP_EXCEEDED"}`.

### MVP Acceptance Checklist

- Auth handshake required for any mutating action (folders/wallets/tasks).
- Create/import wallets (limit 20 per folder), list/rename folders.
- Fund folder from master; delete+sweep returns SOL to master.
- Snipe: 2-wallet buy completes; explorer sigs visible; notifications fire.
- Sell: 2-wallet sell completes; PnL aggregates fills by CA.
- Optional: Jito-lite path used when `JITO_BLOCK_ENGINE` is set.
- Optional: Pump.fun publish via HTTP works when `PUMPFUN_API_BASE` is set.

## PnL (v0.5)

* Store `{ task_id, wallet_pubkey, ca, side, qty_tokens, price_sol_per_token, sig, fee_lamports, tip_lamports, at }`.
* Effective price = `(SOL spent incl. priority fees + tip) / tokens received`.

## Development Notes

* Do **not** add new env keys. Knobs live in Settings (DB).
* Do **not** move signing into `apps/web`.
* Prefer updating existing files; do not duplicate modules.
* When adding a feature, update this README’s **Acceptance** and **WS API** sections in the same PR.

## Roadmap

* Direct Pump.fun buy IX (pre-AMM)
* Sells & MM loops via Jupiter (exactOut)
* Price feeds (Pyth/Birdeye) backing PnL
* Exportable run reports and “launch profiles”

## License

MIT
