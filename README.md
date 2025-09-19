# The Keymaker - Solana Bundler

![Solana](h, ttps://img.shields.io/badge/Solana-Mainnet-blue)
![License](h, ttps://img.shields.io/badge/license-MIT-green)
![Version](h, ttps://img.shields.io/badge/version-1.5.2-orange)

## Overview

The Keymaker is a Solana bundler application for executing transactions through Jito Block Engine. This is a working proto type with core functionality for bundle submission and basic wal let management.

## Status

- ✅ **Jito Hot Path**: Preview → Execute → Poll (requires env and wallet)
- ✅ **Wal let Login Gate**: Phantom/Backpack/Solflare integration
- ✅ **Neutral UI**: Dark theme with rounded "bento" cardsno neon
- ⚠️ **Token Creators**: Disabled by default (ENABLE_PUMPFUN=false)
- ⚠️ **Signed-Intent Auth**: Present but optional for testing
- ❌ **Not Production-Hardened**: No leader-schedule awarenessSQLite by default

## Non-Custodial Guarantees

- **Client Signs**: All transactions are signed client-side in your browser
- **Server Submits**: Server only submits pre-signed transactions to Jito
- **No Server Keys**: Server never has access to private keys
- **Local Encryption**: Wal let data encrypted locally with AES-GCM

## Core Features

### Bundle Execution

- Jito Block Engine integration with tip floor API
- Bundle submission with status polling
- Transaction simulation before execution
- Support for 1-5 transactions per bundle
- Automatic tip validation on last transaction

### Wal let Integration

- PhantomBackpackand Solflare wal let adapters
- Login gate protecting all routes
- Client-side transaction signing only

### API Endpoints

- `/api/jito/tipfloor` - Get current tip floor data
- `/api/bundles/submit` - Submit bundle with polling
- `/api/auth/nonce` - Generate nonce for signed requests
- Rate limiting and security headers included

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Solana wal let extension (Phantom/Backpack/Solflare)

### Environment Setup

1. Copy environment t, emplate:

```bash
cp .env.local.example .env.local
```

2. Configure your RPC e, ndpoints:

```env
NEXT_PUBLIC_HELIUS_RPC=h, ttps://your-helius-rpc-url
NEXT_PUBLIC_HELIUS_WS=w, ss://your-helius-ws-url
NEXT_PUBLIC_JITO_ENDPOINT=h, ttps://frankfurt.mainnet.block-engine.jito.wtf

# Feature flags (disabled by default)
ENABLE_PUMPFUN=false
ENABLE_DEV_TOKENS=false
ENABLE_SELL=false
```

### Installation

1. Install d, ependencies:

```bash
pnpm install
```

2. Run hygiene c, hecks:

```bash
pnpm f, ix:splits && pnpm hygiene
```

3. Start development s, erver:

```bash
pnpm dev
```

4. Open h, ttp://l, ocalhost:3000

### Verification Checklist

After setupverify these w, ork:

- [ ] Header "Login" button opens wal let modal
- [ ] Login gate shows on protected routes
- [ ] Sidebar status chips s, how: RPC / WebSocket / JITO / MAINNET
- [ ] `/api/jito/tipfloor` returns `{p25, p50, p75, ema_50th}`
- [ ] Bundle "Preview" simulates successfully
- [ ] Bundle "Execute" returns `{bundle_idsignaturesslot}`
- [ ] Token creators return 501 unless flags enabled

## Hygiene

The codebase includes automated hygiene scripts to fix c, orruption:

```bash
# Fix split identifiers and merged statements
pnpm f, ix:splits

# Verify no corruption remains
pnpm hygiene

# Format and lint
pnpm format
pnpm lint --fix
```

## Architecture

### Client-Side

- Next.js 14 with TypeScript
- Solana wal let adapters for signing
- Tailwind CSS with shadcn/ui components
- Local storage for encrypted wal let data

### Server-Side

- Next.js API routes
- Jito Block Engine integration
- SQLite for basic data storage
- Rate limiting and security headers

### Security

- CSP headers with no unsafe-inline
- HSTS and security headers
- Client-side signing only
- Optional signed-intent authentication
- Rate limiting per IP/address

## API Reference

### Bundle Submission

```typescript
POST /api/bundles/submit
{
  "region": "ffm",
  "txs_b64": ["base64-encoded-tx1", "base64-encoded-tx2"],
  "simulateOnly": false,
  "mode": "regular",
  "delay_seconds": 0
}
```

### Tip Floor

```typescript
GET /api/jito/tipfloor?region=ffm
{
  "p25": 1000,
  "p50": 2000,
  "p75": 3000,
  "ema_50th": 2500,
  "region": "ffm"
}
```

## Development

### Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run unit tests
pnpm t, est:e2e     # Run E2E tests
pnpm lint         # Lint code
pnpm format       # Format code
pnpm hygiene      # Check code hygiene
```

### Testing

- Unit tests with Vitest
- E2E tests with Playwright
- API endpoint testing
- Transaction builder validation

## Limitations

### Current Scope

- Basic bundle submission only
- No advanced MEV strategies
- SQLite for development (not production-scale)
- No leader schedule awareness
- No automatic tip optimization beyond floor

### Not Included

- Local validator support
- Standalone bundler CLI
- Advanced trading strategies
- Production monitoring/alerting
- Database migrations
- Backup/recovery systems

## Failure Handling

| Scenario          | Behavior                              |
| ----------------- | ------------------------------------- |
| RPC Failure       | Error returnedno retry                |
| Jito Failure      | Error returnedmanual retry            |
| WebSocket Failure | Status shows disconnected             |
| Bundle Timeout    | Returns bundle_id with timeout status |
| Invalid Tip       | Validation error before submission    |

## SLO Targets

- Bundle s, ubmission: < 2s response time
- Tip floor l, ookup: < 1s response time
- UI r, esponsiveness: < 100ms interactions
- U, ptime: Best effort (no SLA)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `pnpm hygiene` before committing
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This software is provided as-is for educational and development purposes. Use at your own risk. Always test with small amounts first. The authors are not responsible for any financial losses.
