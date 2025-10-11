### The Keymaker

RPC-first cockpit for Solana trading and token ops. No bundler required; Turbo (1‑tx tip) is optional per action.

### What it includes

- Coin: Create (pump.fun path) and Buy
- Keymaker Manual: manual fan-out, activity feed, funding/sweep/clean
- Keymaker Volume: buy-biased profiles with caps and impact-aware execution
- P&L and Wallets
- Settings: Custom Fees, Keybinds, Volume defaults, Funding defaults

### Navigation

- Home, Coin, Coin Library, Keymaker, Wallets, P&L, Settings

### Login

- SIWS: Sign in with Solana (Phantom/Backpack/etc.)

### Settings

- Custom Fees: Network priority and Turbo tip (Jito optional)
- Keybinds for Manual
- Volume defaults
- Funding defaults

### Health

`/api/health` returns:

```
{ rpc: { rttMs, health }, ws: { lastHeartbeatMs, health }, slot: { current, delta }, jito: { enabled } }
```

### Idempotency

- Stable JSON hashing; `tx_dedupe.msg_hash` unique. Selftest returns the same signature on re-send.

### Live Markets

- `/api/markets/tickers` returns BTC/ETH/CAKE from CoinGecko and SOL from Birdeye. Cache 5s; stale after 10s.

### Activity Feed

- `/api/mint/activity` windowed feed of recent trades. Default last 5 minutes; supports `sinceTs` and `limit`.

### Per-mint lock

- Process-local leases with advisory gap using `mint_activity` table. Shared by Manual and Volume.

### Funding / Sweep / Deep Clean

- `/api/wallets/fund` supports strategies: equal, per_wallet, target, volume_stipend; preview with `?dryRun=1`.
- `/api/wallets/sweep` leaves buffer, skips dust; one tx per wallet; preview with `?dryRun=1`.
- `/api/wallets/deepclean` closes empty ATAs and unwraps WSOL (guarded); preview supported.

All routes require SIWS and are rate-limited.

### Volume

- Profiles CRUD `/api/volume/profiles` (zod validated; fills defaults from volume defaults)
- Start/Stop/Status APIs; runner resumes on boot

### Theme

- White-primary theme tokens enforced in `app/globals.css`.

### Run locally

```
pnpm i
pnpm dev
```

Default dev server: http://localhost:3000

## UI API Endpoints

These endpoints back the cockpit UI and are safe in dry-run by default:

- `GET /api/ui/settings` – Returns current UI settings cookie (mode, dryRun, cluster, liveMode)
- `POST /api/ui/settings` – Update UI settings (body: `{ mode?: 'RPC_FANOUT', dryRun?: boolean, cluster?: 'mainnet-beta'|'devnet', liveMode?: boolean }`)
- `GET /api/ops/status` – Returns `{ armed: boolean, armedUntil: number }`
- `POST /api/ops/arm` – Arm live mode for minutes `{ minutes: number }` (still gated by env & middleware)
- `POST /api/ops/disarm` – Disarm live mode immediately
- `GET /api/journal/recent` – Last 10 events of the current-day journal

Notes:

- Live operations remain blocked unless env and middleware allow (KEYMAKER_DISABLE_LIVE_NOW, KEYMAKER_REQUIRE_ARMING, KEYMAKER_ALLOW_LIVE).
- Dry-run should remain ON by default; toggle is available in the header pills.

# The Keymaker

A **local, non-custodial Solana cockpit**. Create tokens (Pump.fun), do dev/multi-wallet buys, and exit positions—primarily via **RPC fan-out** (fast, non-atomic). Turbo (1‑tx tip) is available per action.

**Status:** Development prototype. **DRY_RUN is ON by default.** You must explicitly arm “Live Mode.”

## Navigation

- **Home** — Status lights: Turbo / RPC / WS / Solana Mainnet
- **Coin** — Create (Pump.fun), dev buy, multi-wallet buy, market-cap panel
- **Coin Library** — Paste CA or pick a coin → **Copy to Coin** (prefill)
- **Wallets** — Namespaced folders (≤20 wallets), create/import, random funding, roles
- **P&L** — Realized/unrealized per coin/group; CSV export
- **Settings** — RPC defaults, Turbo tip ceilings, dry-run/simulate, vault export/import

## Requirements

- Node 20+, pnpm 9+
- Phantom or Backpack wallet extension
- **ENV:** Helius RPC/WS, Jupiter, Birdeye (optional), IPFS/Arweave creds for live create

## Environment

Copy `.env.example` → `.env.local` and set:

```

APP_NETWORK=mainnet-beta

# RPC / WS

HELIUS_RPC_URL=
HELIUS_WS_URL=

# Jupiter

JUPITER_QUOTE_API=https://quote-api.jup.ag/v6

# Market data (optional)

BIRDEYE_API_KEY=

# Safety

KEYMAKER_ALLOW_LIVE=NO
KEYMAKER_REQUIRE_ARMING=YES
DRY_RUN_DEFAULT=YES

# Defaults

KEYMAKER_GROUP=default
PORT=3000

```

## Run

```bash
pnpm i
pnpm dev --port 3000
# open http://localhost:3000
```

- Sign in with your wallet (SIWS). Workspace **namespace** = your login wallet pubkey.
- Create/import wal let groups under **Wallets** (max 20 per group).
- **Home** shows real status lights (Turbo/RPC/WS/SM).
- **Coin Library** paste a CA → **Copy to Coin**.
- **Coin** can create on Pump.fun (dry-run unless Live Mode), then dev/multi-buy via **Turbo** or **RPC**.
- **P&L** aggregates realized/unrealized; export CSV.
- App defaults to live mode on mainnet. Use UI toggle for simulations if needed.

## Wallet Setup & Funding (Quick Guide)

1. Create a wallet group under Wallets. The group master is your login wallet.
2. Import or generate execution wallets (≤20). Assign snipers (≤3) if needed.
3. Use Random-fund on the Wallets page to distribute SOL from the master wallet. You will sign transfers in your wallet extension (Phantom/Backpack).
4. Export an encrypted backup of the group (JSON bundle) and store it offline.
5. On Coin page, after launching, you can dev-buy or multi-buy in DRY mode first, then LIVE when armed.

## Known Limits

- **RPC fan-out:** not atomic; near-simultaneous with WS confirms.
- **Pump.fun:** metadata must be built/uploaded (we do that for you); do not reuse other tokens’ URIs.

```

## Env example (append or ensure these keys exist)

```

APP_NETWORK=mainnet-beta
HELIUS_RPC_URL=
HELIUS_WS_URL=
JUPITER_QUOTE_API=https://quote-api.jup.ag/v6
BIRDEYE_API_KEY=
KEYMAKER_ALLOW_LIVE=NO
KEYMAKER_REQUIRE_ARMING=YES
DRY_RUN_DEFAULT=YES
KEYMAKER_GROUP=default
PORT=3000

```

---

## Code quality rules

- Type everything. No `any`.
- Keep business logic in `lib/core` (adapters for Jito, Jupiter, Pump.fun, Birdeye, DexScreener).
- UI components in `components/*` with clean props; pages minimal and declarative.
- API routes return typed JSON and never block on unbounded concurrency.
- Logs are structured and redact secrets.
- Don’t remove existing working features; refactor gradually, guarded by flags.

---

## Deliverables

- Updated routes & side nav.
- Working 4-light status panel.
- Namespaced wallet groups (per login wallet).
- Coin Library with Copy-to-Coin.
- Coin create (Pump.fun) with metadata build; dev buy; multi-buy modes.
- Manual sells in RPC mode.
- P&L with CSV export.
- Updated `md/PRD.md` and `README.md`.
```
