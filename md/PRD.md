<!-- PRD.md vNext -->

### Executive Summary

The Keymaker is a **local, non-custodial Solana execution cockpit** with two send paths:
- **JITO_BUNDLE** for atomic bursts (≤5 tx per bundle, chunked for >5).
- **RPC_FANOUT** for parallel sends with priority fees (non-atomic).

The app is a **private tool** for creating meme coins (Pump.fun first), performing dev/multi-wallet buys, and exiting positions, with **folders of up to 20 wallets** per group. Workspaces are **namespaced by the login wallet** (Phantom/Backpack public key), so Wallets/Groups/History for Wallet X are invisible to Wallet Z.

### Navigation & Information Architecture

Left nav (fixed):
- **Home** — 4 live status lights (Jito, RPC, WS, Solana Mainnet), recent activity.
- **Coin** — Create token (Pump.fun), dev buy, configure and run JITO/RPC multi-buy; live market-cap panel.
- **Coin Library** — Bento grid of “copy-from-CA” templates (DexScreener/Birdeye/Metaplex sourced) with **Copy to Coin** prefill.
- **Wallets** — Namespaced folders (≤20 wallets); create/import; random funding from master wallet; role pickers (dev + up to 3 sniper); switch active folder.
- **P&L** — Realized/unrealized per coin and group; export CSV.
- **Settings** — Mode switch (JITO/RPC), fee/tip ceilings, dry-run/simulate toggles, vault export/import, “remember this device”.

### Engines & Limits

- **JITO_BUNDLE**
  - ≤5 signed tx per bundle; chunk N wallets into groups of 5.
  - Tip slider with ceilings; simulate-before-send optional; leader-aware timing.
- **RPC_FANOUT**
  - Parallel Jupiter swaps with priority fees; WS confirms; throttle + backoff.
  - Not atomic; suitable for “as-fast-as-possible” buys/sells across many wallets.

### Status & Health (Home)

Four independent probes with green/amber/red lights:
- **Jito:** `tip_floor` + lightweight bundle simulation reachability.
- **RPC:** `getLatestBlockhash` round-trip + `getHealth`.
- **WS:** `slotSubscribe` heartbeat with missed-beat thresholds.
- **Solana Mainnet:** derived from RPC health + last slot delta; optional “Next Jito leader in ~N slots”.

### Wallets & Persistence

- **Namespace = login wallet public key** (Phantom/Backpack SIWS).
- Wallet groups stored per namespace; only visible when signed in with that wallet.
- Max 20 wallets per group; create/import; file layout `keypairs/<masterPubkey>/<group>/<pubkey>.json`.
- Randomized funding from master wallet (extension) — the app never holds the master private key.

### Coin (Create → Buy)

- **Pump.fun live creation** (V1): metadata (image + JSON) built and uploaded (IPFS/Arweave), produce URI, invoke Pump.fun program.
- Optional **Dev buy** immediately after create.
- **Multi-wallet buy:**
  - **JITO mode:** chunk wallets into bundles of 5; tip and timing controls.
  - **RPC mode:** parallel buys with priority fees.
- **Market-cap panel:**
  - Bonding phase: approximate from bonding-curve state or spot × fixed supply (1B).
  - After pool: FDV/MC from DexScreener/Birdeye; linkouts.

### Coin Library

- Paste a **CA** or select a discovered coin → fetch:
  - **DexScreener**: name/symbol, pair URL, FDV/price, sometimes socials.
  - **Birdeye**: token info (logo/socials) where available.
  - **Metaplex** on-chain metadata URI → image/description.
- Normalize to a `CoinDraft { name, symbol, image, website?, twitter?, telegram?, description? }`.
- **Copy to Coin**: prefill the Coin page for a fresh Pump.fun create (we **don’t** reuse other tokens’ URIs).

### Sells

- **Global** or **per-wallet** sells.
- **RPC mode**: per-wallet “Positions” table with actions **Sell All**, **Sell %**, **Sell after T**.
- **JITO mode**: batch up to 5 wallets per bundle for atomic sell bursts.
- All sells use **Jupiter quote/swap** under the hood; simulate optional.

### Security

- Master wallet remains in the browser extension; **never** exported.
- Sub-wallet keys stored locally on your machine (server-side file store in V1; browser-encrypted vault optional later).
- DRY_RUN default true; “Live Mode” requires env + explicit arming in UI.
- Tip/priority fee ceilings; concurrency throttles; full journaling (bundle IDs, sigs, slots, timings).

### Acceptance Criteria (MVP)

1) **Login** with Phantom/Backpack → workspace switches by wallet; Wallets page shows only that wallet’s groups.
2) **Home** shows 4 status lights; toggling RPC URL/Jito URL flips lights accordingly.
3) **Coin Library** paste CA → preview → Copy to Coin → Coin form prefilled.
4) **Coin** create (dry-run) builds metadata; Live Mode actually creates Pump.fun token and returns sig.
5) **Multi-buy** in JITO and RPC modes both execute (dry-run first, then live) with visible logs.
6) **Manual per-wallet sells** work in RPC mode; JITO sells batch ≤5.
7) **P&L** shows realized/unrealized per coin/group; export works.
8) **Logs** downloadable; each action logged with ids, fees, and outcomes.


