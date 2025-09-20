# The Keymaker - Solana Bundler

![Solana](https://img.shields.io/badge/Solana-Mainnet-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.5.2-orange)

## Overview

The Keymaker is a Solana bundler application for executing transactions through Jito Block Engine. The current build focuses on bundle simulation and execution with a clean UI and optional test mode.

## Status

- ✅ Bundler UI: Preview → Execute → Poll (requires env and wallet)
- ✅ Wallet adapters: Phantom / Backpack / Solflare
- ✅ Design system: Tailwind + shadcn/ui components
- ⚠️ Token creation: Pump.fun/Raydium flows gated/off by default
- ⚠️ SQLite fallback for basic persistence (no Prisma required in dev)

## Non-Custodial

- Client signs; server submits signed transactions to Jito
- No server private keys

## Features

### Bundle Execution
- Jito tipfloor endpoint
- Bundle submission with polling (SSE + fallback)
- Simulation before execution
- Guardrails: compute budget, Jito tip present, balance check

### API
- `GET /api/jito/tipfloor` – tipfloor metrics
- `POST /api/bundles/submit` – simulate/execute bundles

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Solana wallet extension

### Environment
Create `.env.local`:
```env
NEXT_PUBLIC_HELIUS_RPC=https://your-helius-rpc-url
NEXT_PUBLIC_JITO_ENDPOINT=https://frankfurt.mainnet.block-engine.jito.wtf
# Optional test mode (server & client)
TEST_MODE=1
NEXT_PUBLIC_TEST_MODE=1
```

### Install & Run
```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

### Verify
- Header wallet button opens wallet modal
- `/api/jito/tipfloor` returns metrics
- On `/bundle`:
  - Paste base64 v0 txs (≤5)
  - Preview (simulate) succeeds and returns a payloadHash
  - Execute returns `{ bundle_id, signatures, slot, status }` (test-mode is stubbed success)

## Development

### Scripts
```bash
pnpm dev       # Start dev server
pnpm build     # Build for production
pnpm test      # Unit tests
pnpm lint      # Lint
pnpm format    # Format
```

## Notes
- Prisma is optional; dev uses SQLite fallback via `lib/db.ts`.
- Legacy dashboard features are temporarily disabled in the UI while being upgraded.

## License
MIT
