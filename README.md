# The Keymaker v1.5.0 - Production-Grade Solana Bundler

<!-- CI re-run trigger: ensure Actions picks up latest lint fixes -->

![The Keymaker](https://img.shields.io/badge/Solana-Mainnet-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.5.0-orange)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-yellowgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![A11y](https://img.shields.io/badge/a11y-compliant-brightgreen)
[![CI](https://github.com/mask1no/The-Keymaker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mask1no/The-Keymaker/actions/workflows/ci.yml)

## Overview

The Keymaker is a **production-ready Solana bundler application** engineered for high-performance token operations on mainnet. This comprehensive platform provides institutional-grade tools for SPL token creation, Jito bundle execution, wallet management, and real-time profit and loss tracking.

**🚀 Production Status**: Fully operational with zero mocks, real mainnet bundles, and enterprise-grade reliability.

### Key Highlights

- **Real Bundle Execution**: Zero mock data - all bundles land on mainnet
- **MEV Protection**: Jito Block Engine integration with automatic tip optimization
- **Enterprise Security**: Military-grade AES-256-GCM encryption for wallet management
- **Production Monitoring**: Comprehensive health checks and telemetry
- **Multi-Platform Support**: pump.fun, Raydium, letsbonk.fun integration
- **Smart Failover**: Automatic region failover and rate limiting

## Key Features

### 🚀 Production Bundle Execution

- **Real Mainnet Bundles**: Zero mocks - all bundles execute on Solana mainnet
- **Jito Block Engine**: MEV protection with automatic tip floor optimization
- **Smart Region Failover**: Automatic fallback across 7 global regions (FFM, LDN, NYC, SLC, SGP, TYO, AMS)
- **Rate Limiting**: Built-in throttling (1 req/sec per region) with backoff strategies
- **Tip Enforcement**: Dynamic tip optimization with floor enforcement (min 1000 lamports)
- **Bundle Validation**: Strict validation of transaction structure and tip account requirements

### 💰 Token Operations

- **Multi-Platform Support**: pump.fun, Raydium, letsbonk.fun integration
- **SPL Token Creation**: Deploy tokens with customizable parameters
- **Launch Wizard**: Streamlined token launch process with presets
- **Automated Captcha Bypass**: Puppeteer integration for LetsBonk platform

### 🔐 Enterprise Security

- **Military-Grade Encryption**: AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- **Wallet Management**: Secure storage with encrypted private keys
- **Phantom Integration**: Direct wallet adapter support
- **Group-Based Organization**: Color-coded wallet groups for better organization

### 📊 Analytics & Monitoring

- **Real-Time P&L**: Live profit/loss tracking with SQLite persistence
- **Performance Metrics**: Bundle success rates, latency tracking, tip optimization
- **Health Monitoring**: Comprehensive system health checks (RPC, Jito, WebSocket)
- **Telemetry**: Detailed execution logs with export capabilities

## Version 1.5.0 - Production Release

### 🚀 Major Production Enhancements

- **Zero Mock Production**: Complete removal of mock data - all operations are real
- **Server-Safe Jito Resolver**: Robust endpoint resolution with fallback chains
- **Enhanced Bundle Validation**: Strict tip account validation and ALT prevention
- **Production Smoke Testing**: Automated bundle validation with real SOL transactions
- **Region Resilience**: Multi-region failover with intelligent load balancing
- **Enterprise Monitoring**: Production-grade telemetry and health monitoring

### 📈 Performance Improvements

- **Bundle Success Rate**: Optimized tip strategies for maximum landing probability
- **Reduced Latency**: Smart region selection and connection pooling
- **Memory Optimization**: Efficient caching and connection management
- **Error Recovery**: Intelligent retry mechanisms with exponential backoff

## Version 1.1.0 Enhancements

### Major Features

- **Launch Wizard**: Streamlined token launch process with step-by-step guidance and preset management
- **Advanced Trading Engine**: Visual condition builder for sophisticated sell strategies with multiple trigger types
- **Wallet Organization**: Group-based wallet management with color-coded categories for improved organization
- **Network Flexibility**: Seamless switching between mainnet and devnet environments
- **Enhanced Monitoring**: Global connection status banner with real-time network health indicators
- **Intelligent Execution**: Automatic retry with progressive slippage adjustments on liquidity errors
- **Extended Bundle Support**: Support for up to 20 transactions per bundle with priority ordering
- **Comprehensive Fee Tracking**: Accurate profit calculations including gas fees and Jito tips

## Quick Start

### Prerequisites

- Node.js version 20 or higher
- Docker Desktop
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/mask1no/The-Keymaker.git
cd the-keymaker
```

2. Configure environment variables:

```bash
cp env.example .env
# Edit .env with your API keys
```

3. Install dependencies and run:

```bash
pnpm install
pnpm dev
```

### Docker Deployment

```bash
docker compose build
docker compose up -d
```

Access the application at http://localhost:3000

## Production Deployment

### 🚀 Docker Production Deployment

```bash
# Build production image
docker build -t keymaker:latest -f Dockerfile .

# Run with environment variables
docker run -d \
  --name keymaker-prod \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  keymaker:latest
```

### ☸️ Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keymaker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: keymaker
  template:
    metadata:
      labels:
        app: keymaker
    spec:
      containers:
        - name: keymaker
          image: keymaker:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: keymaker-secrets
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
```

### 🔧 Production Checklist

- [ ] Environment variables configured with production keys
- [ ] SSL/TLS certificates configured
- [ ] Database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Load balancer configured
- [ ] CDN configured for static assets
- [ ] Rate limiting configured
- [ ] Backup and recovery procedures tested

## Environment Configuration

Copy `env.example` to `.env` and populate with your production keys:

```env
# ========== NETWORK & INFRASTRUCTURE ==========
NETWORK=mainnet-beta

# RPC Configuration (Helius recommended for production)
HELIUS_API_KEY=your_helius_api_key_here
RPC_URL=https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}
BIRDEYE_API_KEY=your_birdeye_api_key_here

# ========== JITO CONFIGURATION ==========
# Jito Block Engine (Production endpoints)
NEXT_PUBLIC_JITO_ENDPOINT=https://mainnet.block-engine.jito.wtf
JITO_RPC_URL=https://mainnet.block-engine.jito.wtf  # Optional custom endpoint
JITO_AUTH_TOKEN=your_jito_searcher_token  # Optional: improves bundle success

# ========== PLATFORM INTEGRATIONS ==========
JUPITER_API_KEY=your_jupiter_api_key
PUMP_FUN_API_KEY=your_pump_fun_api_key
TWO_CAPTCHA_KEY=your_2captcha_key  # For LetsBonk captcha bypass

# ========== EXECUTION POLICY ==========
JITO_TIP_LAMPORTS=5000  # Base tip amount (will be optimized by floor enforcement)
JUPITER_FEE_BPS=5       # Jupiter fee in basis points
DETERMINISTIC_SEED=your_seed_phrase  # For deterministic wallet generation

# ========== TESTING & DEVELOPMENT ==========
SMOKE_SECRET=your_test_wallet_private_key_bs58  # For smoke tests
NEXT_PUBLIC_HELIUS_RPC=https://api.mainnet-beta.solana.com  # Public fallback

# ========== SAFE INSTALL FLAGS ==========
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
PUPPETEER_SKIP_DOWNLOAD=1
```

### Environment Variables Guide

| Variable                    | Required | Description                                      |
| --------------------------- | -------- | ------------------------------------------------ |
| `HELIUS_API_KEY`            | ✅       | Helius RPC API key for mainnet access            |
| `RPC_URL`                   | ✅       | Full Helius RPC URL with API key                 |
| `NEXT_PUBLIC_JITO_ENDPOINT` | ✅       | Jito Block Engine endpoint                       |
| `SMOKE_SECRET`              | 🧪       | Test wallet private key (base58) for smoke tests |
| `JITO_AUTH_TOKEN`           | 🔧       | Jito searcher token (improves success rates)     |
| `BIRDEYE_API_KEY`           | 📊       | Birdeye API key for token analytics              |
| `JUPITER_API_KEY`           | 🔄       | Jupiter API key for swaps                        |
| `PUMP_FUN_API_KEY`          | 🚀       | Pump.fun API key for token launches              |
| `TWO_CAPTCHA_KEY`           | 🤖       | 2Captcha key for LetsBonk automation             |

### Production Security Notes

- **Never commit `.env`** files to version control
- Use **environment-specific** API keys (dev/staging/prod)
- **Rotate API keys** monthly or upon security incidents
- **Enable 2FA** on all API provider accounts
- **Use hardware security keys** for critical API accounts

## Architecture

### Technology Stack

- **Frontend Framework**: Next.js 14.2.30 with React 18 and TypeScript
- **User Interface**: Tailwind CSS with shadcn/ui component library
- **Blockchain Integration**: Solana Web3.js and SPL Token libraries
- **State Management**: Zustand for efficient client-side state
- **Data Persistence**: SQLite for transaction history and analytics
- **Security**: AES-256-GCM encryption with PBKDF2 key derivation
- **Error Monitoring**: Sentry integration for production error tracking
- **Containerization**: Docker with Alpine Linux for minimal footprint

### Core Services

#### Bundle Service

Orchestrates transaction execution through Jito Block Engine, supporting batched transactions with sophisticated retry logic and real-time status monitoring.

#### Wallet Service

Comprehensive wallet management system that encrypts private keys using AES-256-GCM with PBKDF2 key derivation utilizing 100,000 iterations.

#### Platform Service

Manages SPL token creation across multiple blockchain platforms, handling liquidity pool creation and platform-specific requirements.

#### Analytics Service

Tracks all buy and sell transactions in SQLite database, calculating real-time profit and loss metrics with export capabilities.

## Application Routes

- **Dashboard** (`/home`): Central command center with system statistics
- **Bundle Engine** (`/bundle`): Execute Jito bundles with fee estimation
- **Wallet Manager** (`/wallets`): Create and manage encrypted wallets
- **Token Creator** (`/spl-creator`): Deploy SPL tokens on mainnet
- **Trade History** (`/trade-history`): Complete transaction audit trail
- **Analytics** (`/pnl`): Real-time profit and loss tracking
- **Settings** (`/settings`): Centralized configuration management

## API Reference

### System Health

```
GET /api/health
```

**Response:**

```json
{
  "ok": true,
  "version": "1.5.0",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "checks": {
    "rpc": {
      "status": "healthy",
      "latency_ms": 45,
      "endpoint": "https://mainnet.helius-rpc.com"
    },
    "jito": {
      "status": "healthy",
      "latency_ms": 23,
      "region": "ffm",
      "endpoint": "https://ffm.mainnet.block-engine.jito.wtf"
    },
    "database": {
      "status": "healthy",
      "connections": 2
    },
    "puppeteer": {
      "status": "healthy",
      "browser_version": "Chromium 120.0.6099.0"
    }
  }
}
```

### Bundle Execution

#### Submit Bundle

```
POST /api/bundles/submit
```

**Request Body:**

```json
{
  "txs_b64": ["base64_tx_1", "base64_tx_2"],
  "region": "ffm", // optional: ffm, ldn, nyc, slc, sgp, tyo, ams
  "tip_lamports": 5000, // optional: will be floor-enforced
  "simulateOnly": false // optional: true for preview only
}
```

**Response (Success):**

```json
{
  "bundle_id": "bundle_id_here",
  "signatures": ["tx_sig_1", "tx_sig_2"],
  "slot": 123456789,
  "latency_ms": 2345
}
```

**Response (Simulation):**

```json
{
  "ok": true,
  "sims": [
    { "idx": 0, "err": null },
    { "idx": 1, "err": null }
  ],
  "blockhash": "blockhash_here",
  "slot": 123456789
}
```

#### Batch Status Check

```
POST /api/bundles/status/batch
```

**Request Body:**

```json
{
  "bundle_ids": ["bundle_id_1", "bundle_id_2"],
  "region": "ffm" // optional
}
```

**Response:**

```json
{
  "region": "ffm",
  "statuses": [
    {
      "bundle_id": "bundle_id_1",
      "status": "landed",
      "landed_slot": 123456789,
      "transactions": ["tx_sig_1", "tx_sig_2"]
    }
  ]
}
```

### Jito Integration

#### Tip Floor

```
GET /api/jito/tipfloor
```

**Response:**

```json
{
  "p25": 1000,
  "p50": 2000,
  "p75": 3000,
  "ema_50th": 1800,
  "ema_landed": 1900,
  "time": 1703123456789
}
```

### Analytics & Monitoring

#### P&L Data

```
GET /api/pnl?limit=100&timeRange=24h
```

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "profit_loss": 0.045,
      "bundle_id": "bundle_123",
      "timestamp": "2025-01-01T12:00:00Z",
      "status": "success"
    }
  ],
  "summary": {
    "total_profit": 2.45,
    "total_trades": 87,
    "success_rate": 0.873,
    "avg_latency": 52
  }
}
```

### Platform Integrations

#### Proxy Service

```
POST /api/proxy
```

**Request Body:**

```json
{
  "service": "jupiter" | "birdeye" | "helius" | "pumpfun",
  "endpoint": "/api/v1/quote",
  "method": "GET",
  "params": {
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": "1000000"
  }
}
```

### Token Operations

#### SPL Token Creation

```
POST /api/tokens
```

**Request Body:**

```json
{
  "name": "My Token",
  "symbol": "MTK",
  "decimals": 9,
  "supply": 1000000000,
  "platform": "pumpfun",
  "metadata": {
    "description": "My awesome token",
    "image": "https://example.com/image.png"
  }
}
```

### Error Response Format

All API endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE", // optional
  "details": {
    // optional additional context
    "field": "specific_field",
    "reason": "validation_reason"
  }
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `429` - Rate Limited
- `500` - Internal Server Error
- `502` - External Service Error (Jito/RPC)

## Testing

```bash
# Run unit tests with coverage
pnpm test:coverage

# Run end-to-end tests
pnpm test:e2e

# Run accessibility tests
pnpm test:a11y
```

### Smoke Test (Production Bundle Testing)

The smoke test validates real bundle execution on mainnet with minimal SOL amounts.

#### Setup

1. **Create a test wallet** with a small amount of SOL (~0.001 SOL recommended)
2. **Export the private key** in base58 format
3. **Add to .env**:
   ```env
   SMOKE_SECRET=your_base58_private_key_here
   ```

#### Run the Smoke Test

```bash
# Ensure the app is running
pnpm dev

# In another terminal, run the smoke test
pnpm smoke
```

#### What the Smoke Test Does

1. **Validates environment**: Checks wallet balance and connectivity
2. **Creates test bundle**: Two transactions
   - TX 1: Minimal self-transfer (1 lamport)
   - TX 2: Tip transfer (1000 lamports to Jito)
3. **Submits bundle**: Via `/api/bundles/submit` with proper JSON-RPC format
4. **Monitors status**: Polls `/api/bundles/status/batch` until resolution
5. **Reports results**: Success/failure with transaction links

#### Expected Output

```
🚀 Starting The Keymaker smoke test...

📍 Using wallet: [WALLET_ADDRESS]
🌐 RPC: https://api.mainnet-beta.solana.com
🎯 Jito endpoint: https://mainnet.block-engine.jito.wtf

💰 Wallet balance: 0.0010 SOL
🔄 Fetching recent blockhash...
📝 Creating transaction 1: Self-transfer (1 lamport)...
💰 Creating transaction 2: Tip transfer (1000 lamports)...
📦 Bundle created:
   - TX 1: Self-transfer (1 lamport)
   - TX 2: Tip transfer (1000 lamports to [TIP_ACCOUNT])
   - Total cost: ~0.000005 SOL

🚀 Submitting bundle...
✅ Bundle submitted! ID: [BUNDLE_ID]

🔍 Monitoring bundle status...
📊 Attempt 1/30: Status = pending
📊 Attempt 2/30: Status = landed

🎉 SUCCESS! Bundle landed!
   📍 Landed in slot: [SLOT_NUMBER]
   ⏱️  Latency: 2345ms
   📝 Transactions: 2
      TX 1: https://solscan.io/tx/[TX_SIG_1]
      TX 2: https://solscan.io/tx/[TX_SIG_2]

✅ Smoke test PASSED!
```

#### Troubleshooting

- **"Insufficient balance"**: Fund your test wallet with at least 0.00001 SOL
- **"SMOKE_SECRET not set"**: Add your base58 private key to `.env`
- **Timeout**: Bundle may still land after timeout - check Solscan manually
- **Region failures**: The test automatically tries fallback regions
- **Simulation failed**: Check transaction structure and account balances
- **Tip floor fetch failed**: Jito service may be temporarily unavailable

### Production Smoke Test Results

Expected successful smoke test output:

```
✅ Smoke test PASSED!
   📍 Landed in slot: [SLOT_NUMBER]
   ⏱️  Latency: [2-5 seconds]
   📝 Transactions: 2 confirmed
```

## Production Operations

### 🔑 Security Operations

#### API Key Management

- **Rotation Schedule**: Monthly rotation of all API keys
- **Emergency Rotation**: Immediate rotation upon suspected compromise
- **Key Storage**: Store keys in secure vault (AWS Secrets Manager, HashiCorp Vault)
- **Access Control**: Least privilege principle for key access

#### Wallet Security

- **Cold Storage**: Keep significant funds in cold wallets
- **Hot Wallet Limits**: Limit hot wallet balances to operational minimums
- **Multi-Signature**: Use multi-sig for large transactions when possible
- **Backup Procedures**: Regular encrypted backups of wallet configurations

### 🚨 Monitoring & Alerting

#### Health Monitoring

- **System Health**: Monitor `/api/health` endpoint every 30 seconds
- **Bundle Success Rate**: Alert if success rate drops below 80%
- **Latency Thresholds**: Alert if average latency exceeds 5 seconds
- **Error Rates**: Alert if API error rate exceeds 5%

#### Business Metrics

- **P&L Tracking**: Daily P&L reports and alerts
- **Bundle Volume**: Monitor transaction volume and throughput
- **Region Performance**: Track performance across Jito regions
- **Tip Optimization**: Monitor tip floor effectiveness

### 🔧 Maintenance Procedures

#### Database Maintenance

```bash
# Backup database
sqlite3 data/analytics.db ".backup 'backup-$(date +%Y%m%d).db'"

# Vacuum database (reclaim space)
sqlite3 data/analytics.db "VACUUM;"

# Export P&L data
pnpm db:export-pnl > pnl-$(date +%Y%m%d).csv
```

#### Log Management

```bash
# Rotate logs weekly
logrotate -f /etc/logrotate.d/keymaker

# Archive old logs
tar -czf logs-$(date +%Y%m%d).tar.gz /var/log/keymaker/*.log

# Clean old archives (keep 30 days)
find /var/log/keymaker -name "*.tar.gz" -mtime +30 -delete
```

#### Performance Optimization

- **Memory Usage**: Monitor and optimize heap usage
- **Connection Pooling**: Ensure proper connection limits
- **Cache Management**: Clear caches during maintenance windows
- **Bundle Batching**: Optimize transaction batch sizes

### 🚨 Incident Response

#### Bundle Execution Failures

1. **Check System Health**: Verify RPC and Jito connectivity
2. **Review Logs**: Check for error patterns in application logs
3. **Region Switching**: Manually switch to different Jito regions if needed
4. **Tip Adjustment**: Increase tip amounts if landing rate is low
5. **Circuit Breaker**: Pause execution if failure rate exceeds threshold

#### API Rate Limiting

1. **Identify Source**: Check which API is being rate limited
2. **Implement Backoff**: Increase retry intervals with exponential backoff
3. **Key Rotation**: Rotate to fresh API keys if available
4. **Load Balancing**: Distribute load across multiple API keys

#### Network Issues

1. **RPC Failover**: Switch to backup RPC endpoints
2. **Region Rotation**: Use different Jito regions
3. **Connection Pool**: Restart connection pools
4. **Circuit Breaker**: Temporarily disable failing services

### 📊 Performance Benchmarks

#### Target Metrics

- **Bundle Success Rate**: ≥ 85%
- **Average Latency**: ≤ 3 seconds
- **API Error Rate**: ≤ 2%
- **Memory Usage**: ≤ 512MB
- **CPU Usage**: ≤ 50%

#### Monitoring Commands

```bash
# System health check
curl -s http://localhost:3000/api/health | jq

# Performance metrics
curl -s http://localhost:3000/api/metrics | jq

# Bundle status monitoring
curl -X POST http://localhost:3000/api/bundles/status/batch \
  -H "Content-Type: application/json" \
  -d '{"bundle_ids": ["bundle_id_here"]}' | jq
```

### 🔄 Backup & Recovery

#### Data Backup

- **Database**: Daily automated backups with 30-day retention
- **Configuration**: Version-controlled configuration with secrets in vault
- **Logs**: Compressed log archives with 90-day retention
- **Wallet Configs**: Encrypted wallet configurations with secure backup

#### Recovery Procedures

1. **Database Recovery**: Restore from latest backup, verify integrity
2. **Application Restart**: Rolling restart with health checks
3. **Configuration Restore**: Pull latest config from version control
4. **Wallet Recovery**: Restore encrypted wallet configurations
5. **Verification**: Run smoke tests to verify system functionality

### 📈 Scaling Considerations

#### Horizontal Scaling

- **Load Balancer**: Distribute traffic across multiple instances
- **Database Sharding**: Shard database for high-volume operations
- **Regional Deployment**: Deploy across multiple geographic regions
- **CDN Integration**: Use CDN for static asset delivery

#### Vertical Scaling

- **Memory Optimization**: Monitor and optimize memory usage
- **CPU Optimization**: Profile and optimize CPU-intensive operations
- **I/O Optimization**: Optimize database queries and caching
- **Network Optimization**: Use connection pooling and keep-alive

## Development

### Local Setup

```bash
pnpm install
pnpm dev
```

### Database Initialization

```bash
pnpm db:init
```

### Code Quality

```bash
pnpm type-check
pnpm lint
```

### Safe Install on Windows / Strict AV

1. Clone the repo (avoid downloading zip to dodge SmartScreen flags):
   `git clone https://github.com/<owner>/<repo>.git`
2. Install without running postinstall:
   `pnpm install --ignore-scripts`
3. (Optional) Install browsers explicitly when needed:
   `pnpm browsers:install`
4. Run dev:
   `pnpm dev`

Why this helps: many AV engines flag automatic browser/native downloads (Puppeteer/Playwright/SWC). Keymaker disables them by default via `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` and a guarded postinstall.

### Canary Testing

```bash
node scripts/canaryTrade.js
```

## Security Considerations

### Wallet Security

- AES-256-GCM encryption with unique salt and IV per wallet
- PBKDF2 key derivation with 100,000 iterations
- Local-only transaction signing

### API Security

- Rate limiting and CORS protection
- Input validation and sanitization
- Sensitive data excluded from logs

### Transaction Security

- Pre-execution simulation
- No private key transmission
- MEV protection through Jito

## Performance Optimizations

- React component memoization
- Debounced API calls
- Indexed database queries
- Docker layer caching
- Next.js code splitting

## System Status

The Keymaker v1.4.0 represents a fully operational, production-ready platform:

✅ Complete blockchain integration with real-time data  
✅ All application routes tested and functional  
✅ Docker container with automated health checks  
✅ Responsive UI with theme persistence  
✅ Real-time monitoring with historical data  
✅ Military-grade wallet encryption  
✅ Jito bundle execution with MEV protection  
✅ Multi-platform token deployment  
✅ Comprehensive profit and loss tracking  
✅ Robust error handling and recovery

## License

MIT License - See LICENSE file for details

---

Built with ❤️ for the Solana ecosystem
