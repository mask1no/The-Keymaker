# The Keymaker - Solana Bundler

![Solana](https://img.shields.io/badge/Solana-Mainnet-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.5.2-orange)

## Overview

The Keymaker is a Solana bundler application for executing transactions through Jito Block Engine. This is a working prototype with core functionality for bundle submission and basic wallet management.

## Status

- ✅ **Jito Hot Path**: Preview → Execute → Poll (requires env and wallet)
- ✅ **Wallet Login Gate**: Phantom/Backpack/Solflare integration
- ✅ **Neutral UI**: Dark theme with rounded "bento" cards, no neon
- ⚠️ **Token Creators**: Disabled by default (ENABLE_PUMPFUN=false)
- ⚠️ **Signed-Intent Auth**: Present but optional for testing
- ❌ **Not Production-Hardened**: No leader-schedule awareness, SQLite by default

## Non-Custodial Guarantees

- **Client Signs**: All transactions are signed client-side in your browser
- **Server Submits**: Server only submits pre-signed transactions to Jito
- **No Server Keys**: Server never has access to private keys
- **Local Encryption**: Wallet data encrypted locally with AES-GCM

## Core Features

### Bundle Execution

- Jito Block Engine integration with tip floor API
- Bundle submission with status polling
- Transaction simulation before execution
- Support for 1-5 transactions per bundle
- Automatic tip validation on last transaction

### Wallet Integration

- Phantom, Backpack, and Solflare wallet adapters
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
- Solana wallet extension (Phantom/Backpack/Solflare)

### Environment Setup

1. Copy environment template:

```bash
cp .env.local.example .env.local
```

2. Configure your RPC endpoints:

```env
NEXT_PUBLIC_HELIUS_RPC=https://your-helius-rpc-url
NEXT_PUBLIC_HELIUS_WS=wss://your-helius-ws-url
NEXT_PUBLIC_JITO_ENDPOINT=https://frankfurt.mainnet.block-engine.jito.wtf

# Feature flags (disabled by default)
ENABLE_PUMPFUN=false
ENABLE_DEV_TOKENS=false
ENABLE_SELL=false
```

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Run hygiene checks:

```bash
pnpm fix:splits && pnpm hygiene
```

3. Start development server:

```bash
pnpm dev
```

4. Open http://localhost:3000

### Verification Checklist

After setup, verify these work:

- [ ] Header "Login" button opens wallet modal
- [ ] Login gate shows on protected routes
- [ ] Sidebar status chips show: RPC / WebSocket / JITO / MAINNET
- [ ] `/api/jito/tipfloor` returns `{p25, p50, p75, ema_50th}`
- [ ] Bundle "Preview" simulates successfully
- [ ] Bundle "Execute" returns `{bundle_id, signatures, slot}`
- [ ] Token creators return 501 unless flags enabled

## Hygiene

The codebase includes automated hygiene scripts to fix corruption:

```bash
# Fix split identifiers and merged statements
pnpm fix:splits

# Verify no corruption remains
pnpm hygiene

# Format and lint
pnpm format
pnpm lint --fix
```

## Architecture

### Client-Side

- Next.js 14 with TypeScript
- Solana wallet adapters for signing
- Tailwind CSS with shadcn/ui components
- Local storage for encrypted wallet data

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
pnpm test:e2e     # Run E2E tests
pnpm lint         # Lint code
pnpm format       # Format code
pnpm hygiene      # Check code hygiene
```

### Testing

- Unit tests with Jest
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
| RPC Failure       | Error returned, no retry              |
| Jito Failure      | Error returned, manual retry          |
| WebSocket Failure | Status shows disconnected             |
| Bundle Timeout    | Returns bundle_id with timeout status |
| Invalid Tip       | Validation error before submission    |

## SLO Targets

- Bundle submission: < 2s response time
- Tip floor lookup: < 1s response time
- UI responsiveness: < 100ms interactions
- Uptime: Best effort (no SLA)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `pnpm hygiene` before committing
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This software is provided as-is for educational and development purposes. Use at your own risk. Always test with small amounts first. The authors are not responsible for any financial losses.
