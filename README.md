# The Keymaker

Solana bundler cockpit built on Next.js 14.

**⚠️ DEVELOPMENT PROTOTYPE - NOT PRODUCTION READY ⚠️**

**Current Status**: Functional prototype with working JITO bundling and RPC fanout modes. Requires significant hardening before production use.

- **Audit Score**: 4/10 - See [AUDIT_REPORT.md](md/AUDIT_REPORT.md)
- **Action Plan**: See [AUDIT_REPORT_FIX.md](md/AUDIT_REPORT_FIX.md)
- **Architecture**: See [PRD](md/PRD.md) for detailed specs
- **Operations**: See [OPS](md/OPS.md) for deployment guide

## Dev notes

- Port: set `PORT=3001` for local dev if desired. All app fetches use relative paths (`/api/...`) so port changes do not break auth.
- Run sanity checks: `pnpm sanity`
- Core routes (`/engine`, `/bundle`, `/settings`, `/wallets`) use SSR but ship **94.8KB JS bundle** (after optimization from 166KB)
- Bundle optimization is ongoing work with target <50KB
- Test coverage: <50% (improving)

### Environment

Create a `.env` file from `.env.example` (see root of project) and fill values. Secrets must not be committed.

Required environment variables:
- `HELIUS_RPC_URL` - Helius RPC endpoint for Solana
- `ENGINE_API_TOKEN` - API token for engine endpoints (min 32 chars)
- `KEYMAKER_SESSION_SECRET` - Session secret for HMAC (min 32 chars)
- `KEYPAIR_JSON` - Path to payer keypair JSON
- `JITO_BLOCK_ENGINES_JSON` - Jito block engine configuration

Optional:
- `PORT` - Server port (default: 3000)
- `KEYMAKER_GROUP` - Default wallet group (default: bundle)

## Scripts

- Type-check core only: `pnpm check:node` and `pnpm core:build`
- Analyzer: `pnpm analyze`

### CLI

- Group-aware wallets live on the server under `keypairs/<group>`. Manage via `/wallets` (SSR): create groups, set active group, remove pubkeys. Active group is stored in a `km_group` cookie. Execution wallets are read from the active group by engine submit.
