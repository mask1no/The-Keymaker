# TODO — Keymaker UI/SSR/Auth Overhaul

- [x] Implement session utils (nonce, canonical message, signed cookie)
- [x] Add /api/auth/nonce and /api/auth/verify (rate limit, 8KB cap, Node runtime)
- [x] Middleware gating to /login; preserve API token guards
- [x] Create /login client island (Phantom message-sign; no tx signing)
- [x] Convert layout/header/nav to SSR-only (remove wallet adapter providers)
- [x] Apply dark coding theme tokens and utilities in app/globals.css
- [x] Settings as source of truth (mode, dryRun, cluster, params)
- [x] Engine quick-settings badges + link to Settings
- [x] Wallets page SSR (session pubkey display + tracked wallets forms)
- [x] Market API: /api/marketcap/[mint] via Dexscreener
- [x] Bundler SSR bento with Market card and skeletons
- [x] Convert /dashboard, /guide, /home to SSR/no client bundles
- [ ] Quarantine legacy UI and exclude in toolchains (tsconfig/eslint/prettier)
- [ ] Remove temporary docs: continue.md, AUDIT.md (or move to docs/ARCHIVE)
- [ ] README updates: Design, Login, Settings, Market, Safety, Runbook (PowerShell)
- [ ] Lint/format changed files; run checks: pnpm check:node && pnpm core:build
- [ ] Commit and push to main with message:
      feat(ui): dark coding theme, SSR bento, login, settings source of truth, market bento, safety interlocks; cleanup + docs

