# Keymaker Audit — Mismatch Report and TODO

## Mismatch Report (from self-audit)
- SSR pages: cleaned, no unintended "use client"; nav disables prefetch for heavy routes.
- Login/session: implemented; middleware gates; Wallets SSR forms present.
- Settings: persists mode/dryRun/cluster + params; Engine shows quick badges + link.
- Market API: guarded (rate limit, size cap) and uniform errors via apiError.
- Design: dark coding theme tokens; focusable/pressable utilities; readable cards.
- Docker/docs: docker/ folder (Dockerfile, Dockerfile.dev, .dockerignore); docs index present; root .dockerignore added.
- Legacy quarantine: legacy/** excluded in tsconfig/eslint/prettier.

## TODO (execution plan)
- [ ] Migrate PRD.md and shortcut.md content into /md and delete root copies.
- [ ] Update README to reference /docker build commands and /md docs.
- [ ] Verify pnpm analyze shows ~0 client JS on SSR routes.
- [ ] Add CTA on Bundler PnL tile to configure tracked wallets (link to /wallets).
- [ ] Confirm robots.txt disallows /api/ and /engine (already present).
- [ ] Run prettier/eslint on changed files.
- [ ] Final checks: pnpm check:node && pnpm core:build.
- [ ] Commit with consolidated message and push to main.
