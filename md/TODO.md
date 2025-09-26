# Keymaker Mismatch Report & TODO

## Inventory

- Pages: `/engine`, `/bundle`, `/settings`, `/login`, `/wallets` (added), plus dashboards and misc.
- APIs: engine submit/status/prove/deposit, bundles submit/status, health, leader, marketcap (old), market (added), auth nonce/verify, settings.
- Core libs: `lib/core/src/**` strict typed, `lib/server/**` actions, `lib/server/settings.ts` cookie-backed.
- Components: various UI; corrupted `components/ExecutionLog/**` quarantined.
- Styles: dark theme tokens in `app/globals.css`.
- Middleware: gates unauthenticated to `/login`.

## Mismatches Found

- Missing `/wallets/page.tsx` → Added SSR-only wallet manager.
- Missing `/api/market/[mint]/route.ts` → Added hardened route.
- Corrupted token-split & light backgrounds:
  - `components/UI/GlassCard.tsx` used `bg-white/5` → fixed to dark `bg-zinc-900/40`.
  - `components/ExecutionLog/ExecutionLog.tsx` + `LogsPanel.tsx` were corrupted and client-only → quarantined to `legacy/app-archive/**`.
- Accidental "use client" on SSR routes: no instances found on `/engine`, `/bundle`, `/settings`.
- Root `README.md` missing → Will add.

## Completed

- [x] Add SSR `/wallets` with cookie-backed tracked wallets.
- [x] Add `/api/market/[mint]` with token guard, per-IP rate limit, 8KB cap.
- [x] Refactor `/bundle` to SSR-only bento with streaming skeletons, PnL CTA.
- [x] Quarantine corrupted ExecutionLog UI; ensure `legacy/**` excluded.
- [x] Dark theme fix for `GlassCard`.

## Remaining

- [x] Verify settings SSR server-actions and quick badges on `/engine` stay aligned.
- [x] Add root `README.md` (overview, Safety, Runbook, links to `/md/docs/**`).
- [ ] Run Prettier/ESLint on changed files; ensure `scripts/sanity.mjs` passes.
- [ ] Acceptance: install, `check:node`, `core:build`, middleware gate, analyze 0KB client on SSR routes, market bento loads, safety prove OK, journaling/dry-run, arming latch.
