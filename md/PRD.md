# The Keymaker – Product Requirements Document (PRD)

## Executive Summary

The Keymaker is a Solana bundler application for executing transactions through Jito Block Engine. This document outlines the current implementationarchitecture decisionsand development roadmap for a working proto type with core bundling functionality.

**Current Status**: Production-ready SSR cockpit with JITO_BUNDLE and RPC_FANOUT modes, multi-wallet sign-in (message-sign only), SSR wallet tracking, hardened security, and near-zero client JS on core routes.

## Vision & Mission

### Product Vision

The Keymaker is the definitive thin cockpit for Solana execution. The UI orchestrates while the server handles all heavy lifting. It delivers an **operator-grade experience** for planning and launching bundles with:

- **Military-grade reliability**
- **Crystal-clear guardrails**
- **Transparent health monitoring**
- **Lightning-fast workflows**

### Mission StatementTo provide institutional-grade Solana execution tools that eliminate operational complexity while maximizing performance and security.

## Product Objectives

### Core Objectives

- **Zero Mock Production**: Complete elimination of mock data — all operations execute on mainnet
- **Enterprise Reliability**: 99.9% uptime with comprehensive error handling and recovery
- **MEV Optimization**: Intelligent tip floor enforcement and bundle success maximization
- **Security First**: Military-grade encryption and secure key management
- **Performance Excellence**: Sub-3-second bundle execution with intelligent failover

### Success Metrics

- **Bundle Success Rate**: ≥ 85% landing rate
- **System Availability**: ≥ 99.9% uptime
- **Average Latency**: ≤ 3 seconds per bundle
- **Security Incidents**: Zero security breaches
- **Operator Efficiency**: 10x faster workflow vs manual execution

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Next.js API   │    │   External APIs │
│   (React/TS)    │◄──►│   (Serverless)  │◄──►│   (JitoRPC)   │
│                 │    │                 │    │                 │
│ • Dashboard UI  │    │ • Bundle Engine │    │ • Jito Block    │
│ • Wal let Mgmt   │    │ • Status Poller │    │   Engine        │
│ • Analytics     │    │ • Health Checks │    │ • Helius RPC    │
│ • Settings      │    │ • Rate Limiting │    │ • Jupiter API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   SQLite DB     │
                    │   (Analytics)   │
                    └─────────────────┘
```

### Technology Stack

| Component            | Technology                         | Purpose                           |
| -------------------- | ---------------------------------- | --------------------------------- |
| **Frontend**         | Next.js 14.2, React 18, TypeScript | Modern web application framework  |
| **UI Framework**     | Tailwind CSS                       | Responsive design system          |
| **State Management** | Zustand                            | Lightweight client state          |
| **Database**         | SQLite                             | Analytics and transaction history |
| **Security**         | AES-256-GCMPBKDF2                  | Military-grade encryption         |
| **Monitoring**       | Sentry                             | Error tracking and performance    |
| **Deployment**       | DockerKubernetes                   | Container orchestration           |

## Core Workflows

### 1) Standard Bundle Execution

**Create → Preview → Execute**

```
User Action → Server Processing → External Validation → Bundle Submission
     │              │                        │                      │
     ▼              ▼                        ▼                      ▼
• Token Creation  • Native v0 Build       • Simulation Gates     • Jito Submission
• Wal let Setup    • Tip Optimization      • Health Checks        • Status Polling
• Parameter Config• Region Selection      • Rate Limiting        • Telemetry
```

#### Detailed F, l, o, w:

1. **Create**: Optional SPL token creation flow (server-sidereceipt-gated)
2. **Preview**: Build native v0 transactionssimulate on server (`s, i, m, ulateOnly: true`)
3. **Validation**: Strict guardrails check (tip accountscompute budgethealth status)
4. **Execute**: Submit exact base64 set that passed preview
5. **Monitor**: Status updates from server poller with real-time feedback

### 2) Delayed Bundle Execution

**Arm → Prefetch → Rebuild → Submit**

```
Operator Arms Timer → T-5, s: Blockhash → T-1, s: Rebuild → T=0: Submit
       │                      │                     │                │
       ▼                      ▼                     ▼                ▼
• Set 30s/60s delay      • Fresh blockhash      • Embed tip       • Jito submit
• Health verification     • Region selection     • Simulate again  • Status poll
• Parameter freeze        • Connection test      • Guardrail check • Success confirm
```

### 3) Smoke Testing Workflow

**Validate → Test → Verify**

```
Environment Setup → Bundle Creation → Submission → Monitoring → Verification
       │                     │                    │                │
       ▼                     ▼                    ▼                ▼
• Wal let funding        • Minimal tx bundle    • Jito endpoint   • Status polling
• Key validation        • Tip optimization     • Region fallback • Success metrics
• RPC connectivity      • Base64 encoding      • Error handling  • Report generation
```

## Modes

- **JITO_BUNDLE**: Build N txs (dev + bundle wallets), compute dynamic tip (Jito tipfloor EMA), submit bundle via regional Block Engines with retries/failover. Target: same block; no in-between snipes.
- **RPC_FANOUT (Mass Sniper)**: Build N independent buy txs and fan them out via RPC with concurrency and jitter.

## Wallets & Groups

- Manage tracked wallets on `/wallets` (SSR). Optionally group wallets (e.g., `bundle_20`), where index 0 is dev and others are bundle.

## Manual Controls (RPC mode)

- Buy now per wallet or group.
- Sell % per wallet (10/25/50/100).
- Sell after time per wallet (non-durable scheduling; documented).
  All actions are SSR server-actions; journal entries are appended to `data/journal.Y-m-d.ndjson`.

## Security

- No browser tx signing; only message-sign for login at `/login`. Browser never signs transactions.
- API guarded (per-IP token bucket, 8KB caps, runtime=`nodejs`, dynamic=`force-dynamic`, uniform `apiError`, requestId).
- HMAC session, Secure+HttpOnly cookie in prod, SameSite=Lax; `KEYMAKER_SESSION_SECRET` required in prod.
- CSP strict; `connect-src` extended only to allow wallet extensions (`chrome-extension:`, `moz-extension:`, `ms-browser-extension:`).
- Token guard: in production, `/api/engine/*` and `/api/market/*` require `x-engine-token`.
  Robots disallow `/api/` and `/engine`.

## Performance

- Core SSR-only routes (`/engine`, `/bundle`, `/settings`, `/wallets`) ship ≤ 5 KB first-load JS (≈0 ideal). `/login` is the only client island.

## Observability

- Health & metrics endpoints; NDJSON journaling with redaction for /(key|token|secret|pass)/i.

## Dev Notes

- Use relative API paths (`/api/...`) so dev on `PORT=3001` works.
- `.env.example` contains placeholders only; never commit real secrets or use `NEXT_PUBLIC_*` for secrets.
- `pnpm check:node && pnpm core:build` type-checks core.

## Health & Monitoring Model

### System Health Architecture

```
Health Sources → Aggregation → Caching → Distribution
       │              │             │              │
       ▼              ▼             ▼              ▼
• RPC Health      • Single source  • 30s cache    • UI Dashboard
• Jito Status     • Server-driven  • Auto-refresh • API Endpoints
• Database        • No client      • Error bounds • Alert System
• Puppeteer       • Direct calls   • Fallback     • Monitoring
```

### Health Check Specification

#### `/api/health` - System Health Endpoint

**Response S, t, r, ucture:**

```json
{
  "ok": true,
  "version": "1.5.0",
  "timestamp": "2025-01-01, T00:00:00.000Z",
  "checks": {
    "rpc": {
      "status": "healthy|degraded|down",
      "latency_ms": 45,
      "endpoint": "h, t, t, ps://mainnet.helius-rpc.com",
      "last_check": "2025-01-01, T00:00:00.000Z"
    },
    "jito": {
      "status": "healthy|degraded|down",
      "latency_ms": 23,
      "region": "ffm",
      "endpoint": "h, t, t, ps://ffm.mainnet.block-engine.jito.wtf",
      "last_check": "2025-01-01, T00:00:00.000Z"
    },
    "database": {
      "status": "healthy|degraded|down",
      "connections": 2,
      "last_backup": "2025-01-01, T00:00:00.000Z"
    },
    "puppeteer": {
      "status": "healthy|degraded|down",
      "browser_version": "Chromium 120.0.6099.0",
      "last_check": "2025-01-01, T00:00:00.000Z"
    }
  }
}
```

... (truncated for brevity; content preserved from original PRD.md)
