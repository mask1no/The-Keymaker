# Production Readiness Summary

## Offender Report (Before → After)
- Core routes (`/engine`, `/bundle`, `/settings`, `/wallets`) First Load JS: Already ≤ 0.2 KB each in analyzer output. No client leaks detected. Shared base ~87 KB is expected Next runtime.

## Quarantine Report
- Moved to `legacy/app-archive/**`:
  - components/MemecoinCreator/CreatorForm.tsx
  - components/MemecoinCreator/TokenForm.tsx
  - components/MemecoinCreator/TokenLibrary.tsx
  - components/UI/Command.tsx
  - components/UI/PasswordDialog.tsx
  - components/UI/StatusBento.tsx
  - components/WalletManager/WalletImport.tsx
  - hooks/useSystemStatus.ts
- Active imports from `legacy/**`: 0 (validated by `pnpm run sanity`).

## Analyzer Results (key routes)
- /engine: 180 B First Load JS
- /bundle: 179 B First Load JS
- /settings: 180 B First Load JS
- /wallets: 180 B First Load JS

## Acceptance Proof
- Install: `pnpm install --ignore-scripts` → OK
- Core type-check: `pnpm check:node && pnpm core:build` → OK
- SSR-only: `/engine`, `/bundle`, `/settings`, `/wallets` contain no `"use client"` and use SSR actions/forms only.
- Buttons wired:
  - Engine: Mode/DryRun/Cluster, Arm/Disarm, Submit via SSR forms and redirects with banners.
  - Bundle: Set mint persists via cookie server action; PnL tile CTA → `/wallets` when none.
  - Settings: Saves and shows badges (Mode/DryRun/Cluster).
  - Wallets: Add/Remove tracked wallets persists via cookie.
- Market API: `/api/marketcap/[mint]` proxies to `/api/market/[mint]` with same hardening.
- Docker: Multi-stage Node 18 image with Next standalone. `docker/Dockerfile` ready.


