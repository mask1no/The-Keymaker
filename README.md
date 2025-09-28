# The Keymaker

Production-ready Solana bundler cockpit built on Next.js 14.

- Docs: see [PRD](md/PRD.md). Dev on `PORT=3001` supported; all app API calls use relative `/api/...` paths.
- Ops notes: see `md/OPS.md` (if present)

## Dev notes

- Port: set `PORT=3001` for local dev if desired. All app fetches use relative paths (`/api/...`) so port changes do not break auth.
- Run sanity checks: `pnpm sanity`
- Only `/login` is a client island. Core routes (`/engine`, `/bundle`, `/settings`, `/wallets`) are SSR-only.

### Environment

Create a `.env` file from `.env.example` and fill values. Secrets must not be committed.

## Scripts

- Type-check core only: `pnpm check:node` and `pnpm core:build`
- Analyzer: `pnpm analyze`

### CLI

- Create a group of N server wallets and list them:
  - `pnpm cli:group:create bundle_5 5`
  - `pnpm cli:group:list bundle_5`
