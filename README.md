The Keymaker
============

Production-ready Solana bundler cockpit built on Next.js 14.

- Docs: see `md/PRD.md`
- Ops notes: see `md/OPS.md` (if present)

Dev notes
---------

- Port: set `PORT=3001` for local dev if desired. All app fetches use relative paths (`/api/...`) so port changes do not break auth.
- Only `/login` is a client island. Core routes (`/engine`, `/bundle`, `/settings`, `/wallets`) are SSR-only.

Scripts
-------

- Type-check core only: `pnpm check:node` and `pnpm core:build`
- Analyzer: `pnpm analyze`


