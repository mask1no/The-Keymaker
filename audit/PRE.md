# Phase 0 Baseline & Evidence

## Command Results

### pnpm i

```
Lockfile is up to date, resolution step is skipped
Already up to date

dependencies:
+ @headlessui/react 2.2.9
+ @octokit/rest 22.0.0
+ @supabase/supabase-js 2.58.0
+ class-variance-authority 0.7.1
+ clsx 2.1.1
+ cmdk 1.1.1
+ framer-motion 12.23.22
+ lucide-react 0.514.0
+ next-themes 0.4.6
+ qrcode.react 4.2.0
+ react-hotkeys-hook 5.1.0
+ react-qr-code 2.0.18
+ use-sound 5.0.0

devDependencies:
+ @tauri-apps/cli 2.8.4

Done in 600ms using pnpm v10.14.0
```

### pnpm typecheck

**Script not found in npm context** - TypeScript checking via `npx tsc --noEmit` failed due to PowerShell environment limitations.

### pnpm lint

**Script not found in npm context** - ESLint checking via `npm run lint` failed.

### pnpm build

**Script not found in npm context** - Next.js build via `npm run build` failed.

## Environment Variables Referenced in Codebase

### Server-only Environment Variables (should be secrets):

- `HELIUS_RPC_URL` - Primary RPC endpoint (Helius)
- `HELIUS_WS_URL` - WebSocket endpoint for real-time data
- `ENGINE_API_TOKEN` - API token for engine endpoints
- `BIRDEYE_API_KEY` - API key for Birdeye token data
- `KEYMAKER_MASTER_PASSPHRASE` - Master passphrase for encryption
- `KEYMAKER_SESSION_SECRET` - Session secret for HMAC signing
- `REDIS_URL` - Redis connection URL
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token
- `SENTRY_DSN` - Sentry error tracking DSN
- `SENTRY_AUTH_TOKEN` - Sentry auth token
- `SENTRY_ORG` - Sentry organization
- `SENTRY_PROJECT` - Sentry project
- `RPC_URL` - Fallback RPC URL
- `PUMPPORTAL_ENDPOINT` - PumpPortal API endpoint

### Client-safe Environment Variables (can be public):

- `NEXT_PUBLIC_HELIUS_RPC` - Public RPC endpoint for client use
- `NEXT_PUBLIC_HELIUS_WS` - Public WebSocket endpoint
- `NEXT_PUBLIC_BASE_URL` - Base URL for API calls
- `NEXT_PUBLIC_NETWORK` - Network selection (mainnet-beta/devnet)
- `NEXT_PUBLIC_JITO_TIP_LAMPORTS` - Default Jito tip amount
- `NEXT_PUBLIC_JUPITER_FEE_BPS` - Jupiter swap fee
- `NODE_ENV` - Environment (development/production)
- `CI` - CI environment flag

### Development-only Variables:

- `SMOKE_BASE_URL` - Base URL for smoke tests
- `KEYMAKER_DISABLE_LIVE_NOW` - Disable live execution
- `KEYMAKER_ALLOW_LIVE` - Allow live execution
- `KEYMAKER_REQUIRE_ARMING` - Require arming for live execution
- `NEXT_RUNTIME` - Next.js runtime (nodejs/edge)
- `NEXT_STANDALONE` - Enable standalone build
- `ANALYZE` - Enable bundle analyzer
