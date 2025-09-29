# The Keymaker

Solana bundler cockpit built on Next.js 14.

**⚠️ DEVELOPMENT PROTOTYPE - NOT PRODUCTION READY ⚠️**

**Current Status**: Functional development build with working JITO bundling and RPC fanout modes. Recently improved for better usability.

**Recent Improvements (Sept 2025)**:
- ✅ Removed armed requirement - operations work by default now
- ✅ Better error messages with actionable feedback
- ✅ Removed "coming soon" placeholders
- ✅ Mobile navigation fully functional
- ✅ Clean code structure with proper client/server separation

**Documentation**:
- **Architecture**: See [PRD](md/PRD.md) for detailed specs
- **Operations**: See [OPS](md/OPS.md) for deployment guide
- **Audits**: See [AUDIT_REPORT.md](md/AUDIT_REPORT.md) for security/code review

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
- `KEYMAKER_DISABLE_LIVE` - Set to `YES` to disable live operations (default: NO)
- `KEYMAKER_REQUIRE_ARMING` - Set to `YES` to require manual arming (default: NO)

## Scripts

- Type-check core only: `pnpm check:node` and `pnpm core:build`
- Analyzer: `pnpm analyze`

### CLI

- Group-aware wallets live on the server under `keypairs/<group>`. Manage via `/wallets` (SSR): create groups, set active group, remove pubkeys. Active group is stored in a `km_group` cookie. Execution wallets are read from the active group by engine submit.
