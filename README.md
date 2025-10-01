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

## Known Limits

* **Jito bundle size:** max **5 tx per bundle**, chunked for larger sets.
* **RPC fan-out:** not atomic; near-simultaneous with WS confirms.
* **Pump.fun:** metadata must be built/uploaded (we do that for you); do not reuse other tokens’ URIs.

```

---

## Env example (append or ensure these keys exist)

```

APP_NETWORK=mainnet-beta
HELIUS_RPC_URL=
HELIUS_WS_URL=
JITO_HTTP_URL=
JITO_REGION=auto
JITO_TIP_LAMPORTS_DEFAULT=100000
JUPITER_QUOTE_API=[https://quote-api.jup.ag/v6](https://quote-api.jup.ag/v6)
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
- Updated `md/PRD.md` and `README.md` exactly as above.

---

 

