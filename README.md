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
Example `.env.example` keys provided:

```
HELIUS_RPC_URL=
PUBLIC_RPC_URL=
JITO_BLOCK_ENGINES_JSON=
KEYPAIR_JSON=
ENGINE_API_TOKEN=
KEYMAKER_SESSION_SECRET=
KEYMAKER_GROUP=bundle
PORT=3001
```

## Scripts

- Type-check core only: `pnpm check:node` and `pnpm core:build`
- Analyzer: `pnpm analyze`

### CLI

- Group-aware wallets live on the server under `keypairs/<group>`. Manage via `/wallets` (SSR): create groups, set active group, remove pubkeys. Active group is stored in a `km_group` cookie. Execution wallets are read from the active group by engine submit.
