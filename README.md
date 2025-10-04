## UI API Endpoints

These endpoints back the cockpit UI and are safe in dry-run by default:

- `GET /api/ui/settings` – Returns current UI settings cookie (mode, dryRun, cluster, liveMode)
- `POST /api/ui/settings` – Update UI settings (body: `{ mode?: 'JITO_BUNDLE'|'RPC_FANOUT', dryRun?: boolean, cluster?: 'mainnet-beta'|'devnet', liveMode?: boolean }`)
- `GET /api/ops/status` – Returns `{ armed: boolean, armedUntil: number }`
- `POST /api/ops/arm` – Arm live mode for minutes `{ minutes: number }` (still gated by env & middleware)
- `POST /api/ops/disarm` – Disarm live mode immediately
- `GET /api/journal/recent` – Last 10 events of the current-day journal

Notes:
- Live operations remain blocked unless env and middleware allow (KEYMAKER_DISABLE_LIVE_NOW, KEYMAKER_REQUIRE_ARMING, KEYMAKER_ALLOW_LIVE).
- Dry-run should remain ON by default; toggle is available in the header pills.

# The Keymaker (MVP)

A **local, non-custodial Solana bundler cockpit**. Create tokens (Pump.fun), do dev/multi-wallet buys, and exit positions—using either **JITO bundles** (atomic ≤5) or **RPC fan-out** (fast, non-atomic).

**Status:** Development prototype. **DRY_RUN is ON by default.** You must explicitly arm “Live Mode.”

## Navigation

- **Home** — Status lights: Jito / RPC / WS / Solana Mainnet
- **Coin** — Create (Pump.fun), dev buy, multi-wallet buy, market-cap panel
- **Coin Library** — Paste CA or pick a coin → **Copy to Coin** (prefill)
- **Wallets** — Namespaced folders (≤20 wallets), create/import, random funding, roles
- **P&L** — Realized/unrealized per coin/group; CSV export
- **Settings** — JITO/RPC switch, tip/fee ceilings, dry-run/simulate, vault export/import

## Requirements

- Node 20+, pnpm 9+
- Phantom or Backpack wallet extension
- **ENV:** Helius RPC/WS, Jito endpoint, Jupiter, Birdeye (optional), IPFS/Arweave creds for live create

## Environment

Copy `.env.example` → `.env.local` and set:

```

APP_NETWORK=mainnet-beta

# RPC / WS

HELIUS_RPC_URL=
HELIUS_WS_URL=

# Jito Block Engine

JITO_HTTP_URL=
JITO_REGION=auto
JITO_TIP_LAMPORTS_DEFAULT=100000

# Jupiter

JUPITER_QUOTE_API=[https://quote-api.jup.ag/v6](https://quote-api.jup.ag/v6)

# Market data (optional)

BIRDEYE_API_KEY=

# Safety

KEYMAKER_ALLOW_LIVE=NO
KEYMAKER_REQUIRE_ARMING=YES
DRY_RUN_DEFAULT=YES

# Defaults

KEYMAKER_GROUP=bundle
PORT=3000

````

## Run

```bash
pnpm i
pnpm dev
# open http://localhost:3000
````

* Sign in with your wallet (SIWS). Workspace **namespace** = your login wallet pubkey.
* Create/import wallet groups under **Wallets** (max 20 per group).
* **Home** shows real status lights (Jito/RPC/WS/SM).
* **Coin Library** paste a CA → **Copy to Coin**.
* **Coin** can create on Pump.fun (dry-run unless Live Mode), then dev/multi-buy via **JITO** or **RPC**.
* **P&L** aggregates realized/unrealized; export CSV.

## Live Mode & Safety

* Live sends are blocked unless **both**:

  * `KEYMAKER_ALLOW_LIVE=YES` in env, **and**
  * You toggle **Arm Live** in Settings.
* Tip/fee ceilings and concurrency throttles protect you in volatile periods.
* Simulation toggles exist for bundles and swaps.

## Go LIVE Checklist

- [ ] .env set with DRY defaults (DRY_RUN_DEFAULT=YES, KEYMAKER_REQUIRE_ARMING=YES)
- [ ] RPC HTTP and WS URLs configured; WS light is green on /home
- [ ] ENGINE_API_TOKEN and KEYMAKER_SESSION_SECRET set
- [ ] `pnpm preflight` and `pnpm typecheck` pass
- [ ] Login works; session cookie present
- [ ] Wallet group created; master wallet connected in browser
- [ ] `pnpm smoke` (prod) or `pnpm smoke:local` (dev) passes
- [ ] Arm (LIVE ARMED banner appears) and set KEYMAKER_ALLOW_LIVE=YES
- [ ] Send tiny dust buy; confirm via RPC and WS
- [ ] Disarm and set KEYMAKER_ALLOW_LIVE=NO

## Wallet Setup & Funding (Quick Guide)

1) Create a wallet group under Wallets. The group master is your login wallet.
2) Import or generate execution wallets (≤20). Assign snipers (≤3) if needed.
3) Use Random-fund on the Wallets page to distribute SOL from the master wallet. You will sign transfers in your wallet extension (Phantom/Backpack).
4) Export an encrypted backup of the group (JSON bundle) and store it offline.
5) On Coin page, after launching, you can dev-buy or multi-buy in DRY mode first, then LIVE when armed.

## Known Limits

* **Jito bundle size:** max **5 tx per bundle**, chunked for larger sets.
* **RPC fan-out:** not atomic; near-simultaneous with WS confirms.
* **Pump.fun:** metadata must be built/uploaded (we do that for you); do not reuse other tokens’ URIs.

```

## Env example (append or ensure these keys exist)

```

APP_NETWORK=mainnet-beta
HELIUS_RPC_URL=
HELIUS_WS_URL=
JITO_HTTP_URL=
JITO_REGION=auto
JITO_TIP_LAMPORTS_DEFAULT=100000
JUPITER_QUOTE_API=https://quote-api.jup.ag/v6
BIRDEYE_API_KEY=
KEYMAKER_ALLOW_LIVE=NO
KEYMAKER_REQUIRE_ARMING=YES
DRY_RUN_DEFAULT=YES
KEYMAKER_GROUP=bundle
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
- Manual per-wallet sells in RPC mode; batched JITO sells.
- P&L with CSV export.
- Updated `md/PRD.md` and `README.md`.
