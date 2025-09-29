# The Keymaker

Solana bundler cockpit built on Next.js 14.
**⚠️ Current Status: Development/Testing - NOT Production Ready**

- Docs: see [PRD](md/PRD.md) for architecture
- Ops: see [OPS](md/OPS.md) for deployment guide
- Status: 5.5/10 - See [AUDIT_REPORT.md](md/AUDIT_REPORT.md)

## Dev notes

- Port: set `PORT=3001` for local dev if desired. All app fetches use relative paths (`/api/...`) so port changes do not break auth.
- Run sanity checks: `pnpm sanity`
- Only `/login` is a client island. Core routes (`/engine`, `/bundle`, `/settings`, `/wallets`) use SSR but ship ~166KB JS bundle (optimization needed).

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
