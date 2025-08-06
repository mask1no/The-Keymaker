# The Keymaker v1.3.0 - Production-Grade Solana Bundler

![The Keymaker](https://img.shields.io/badge/Solana-Mainnet-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.3.0-orange)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-80%25-yellowgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![A11y](https://img.shields.io/badge/a11y-compliant-brightgreen)

## Overview

The Keymaker is a production-ready Solana bundler application engineered for high-performance token operations on mainnet. This comprehensive platform provides institutional-grade tools for SPL token creation, Jito bundle execution, wallet management, and real-time profit and loss tracking.

## Key Features

### Core Functionality

- **SPL Token Creation**: Deploy tokens across multiple platforms including pump.fun, Raydium, and letsbonk.fun
- **Bundle Execution**: Execute transactions through Jito Block Engine with stealth and manual operation modes
- **Wallet Management**: Secure wallet infrastructure supporting both Phantom integration and direct keypair imports
- **Real-Time Analytics**: Live profit and loss tracking with SQLite persistence and export capabilities
- **Network Monitoring**: Continuous monitoring of RPC, WebSocket, Jito, and Mainnet connections with historical data
- **Enterprise Security**: Military-grade AES-256-GCM encryption for private key storage
- **Comprehensive Error Handling**: Robust error boundaries with automatic recovery mechanisms
- **Theme Support**: Persistent dark and light theme options with smooth transitions
- **Intelligent Retry Logic**: Automatic RPC retry with progressive rate limiting

## Version 1.3.0 Release Candidate

### Latest Updates

- **LetsBonk Integration**: Full captcha bypass support for LetsBonk platform with Puppeteer fallback
- **Enhanced Testing**: Comprehensive test suite with 80%+ code coverage
- **Puppeteer Support**: Automated browser automation for captcha solving on supported platforms
- **Health Monitoring**: Enhanced health endpoint with Puppeteer status checks
- **Docker Optimization**: Chromium browser support in Docker container for headless operations
- **Accessibility**: Full WCAG 2.1 AA compliance with automated a11y testing
- **Code Quality**: Zero ESLint warnings and pruned unused exports

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

## Architecture

### Technology Stack

The Keymaker leverages modern web technologies and blockchain infrastructure:

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

The bundle service orchestrates transaction execution through Jito Block Engine, supporting batched transactions with sophisticated retry logic and real-time status monitoring. The service implements exponential backoff strategies and monitors bundle status through websocket connections.

#### Wallet Service

A comprehensive wallet management system that encrypts private keys using AES-256-GCM with PBKDF2 key derivation utilizing 100,000 iterations. The service supports batch wallet creation, secure import/export functionality, and role-based wallet categorization.

#### Platform Service

Manages SPL token creation across multiple blockchain platforms, handling liquidity pool creation, token parameter validation, and platform-specific requirements. The service integrates with pump.fun, Raydium, and letsbonk.fun APIs.

#### Analytics Service

Tracks all buy and sell transactions in a local SQLite database, calculating real-time profit and loss metrics. Provides wallet-specific and token-specific analytics with export capabilities in JSON and CSV formats.

### Security Architecture

The Keymaker implements defense-in-depth security principles:

1. **Wallet Encryption Layer**: AES-256-GCM encryption with unique salt and initialization vectors per wallet
2. **API Key Protection**: Environment variable isolation with optional localStorage for client-side keys
3. **Transaction Security**: Local-only transaction signing with no private key transmission
4. **Network Security**: HTTPS enforcement, rate limiting, and CORS protection

## Installation

### Prerequisites

- Node.js version 20 or higher
- Docker Desktop
- Git

### Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/yourusername/the-keymaker.git
cd the-keymaker
```

2. Configure environment variables in `.env.local`:

```env
# Required Configuration
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_BIRDEYE_API_KEY=your_birdeye_api_key
BIRDEYE_API_KEY=your_birdeye_api_key

# Optional Services
NEXT_PUBLIC_PUMPFUN_API_KEY=your_pumpfun_key
PUMPFUN_API_KEY=your_pumpfun_key
JITO_AUTH_TOKEN=your_jito_token
TWOCAPTCHA_API_KEY=your_2captcha_key
```

3. Build and deploy with Docker:

```bash
docker compose build
docker compose up -d
```

4. Access the application at http://localhost:3000

## Application Routes

### Dashboard (`/home`)

Central command center displaying system statistics, wallet balances, profit and loss summary, and quick access navigation.

### Bundle Engine (`/bundle`)

Execute Jito bundles with support for both stealth and manual modes. Features real-time transaction preview, fee estimation, and comprehensive result tracking.

### Wallet Manager (`/wallets`)

Create and import wallets with support for Phantom integration and direct keypair imports. Assign roles, manage balances, and perform batch operations with encrypted storage.

### Token Creator (`/spl-creator`)

Deploy SPL tokens on mainnet with multi-platform support. Configure token parameters, create liquidity pools, and manage metadata with platform-specific optimizations.

### Transaction History (`/logs`)

Complete transaction audit trail with advanced filtering, real-time updates, and export functionality. Detailed bundle breakdowns with individual transaction results.

### Analytics (`/pnl`)

Real-time profit and loss tracking with per-wallet and per-token analytics. Session statistics with comprehensive export capabilities.

### Settings (`/settings`)

Centralized configuration management including API keys, connection monitoring, trading preferences, and security settings.

## API Reference

### Health Check Endpoint

```
GET /api/health
Response: { "ok": true, "version": "1.1.0", "checks": {...} }
```

### Proxy Service

```
POST /api/proxy
Body: {
  service: "jupiter" | "birdeye" | "helius" | "pumpfun",
  endpoint: string,
  params?: object,
  method?: "GET" | "POST"
}
```

### Bundle Execution

```
POST /api/bundle/execute
Body: {
  transactions: Transaction[],
  wallets: WalletData[],
  tipAmount: number
}
```

## Development

### Local Development Setup

```bash
npm install
npm run dev
```

### Database Initialization

```bash
npm run db:init
```

### Code Quality Tools

```bash
npm run type-check
npm run lint
```

## Production Deployment

The application utilizes a multi-stage Docker build process optimized for production:

1. **Dependencies Stage**: Installs and builds native modules
2. **Builder Stage**: Compiles Next.js application with optimizations
3. **Runner Stage**: Minimal production image with security hardening

### Docker Operations

```bash
# Build production image
docker compose build --no-cache

# Deploy application
docker compose up -d

# Monitor logs
docker logs keymaker-prod -f

# Shutdown
docker compose down
```

## Database Schema

The application uses SQLite for local data persistence with the following core tables:

- **wallets**: Stores encrypted wallet data with role assignments
- **pnl_tracking**: Records all buy/sell transactions for profit calculation
- **bundle_executions**: Logs bundle execution results and metadata
- **token_launches**: Tracks all token deployments with platform details

## Security Considerations

### Wallet Security

Private keys are encrypted using AES-256-GCM with unique salt and initialization vectors per wallet. PBKDF2 key derivation with 100,000 iterations prevents brute force attacks.

### API Security

All endpoints implement rate limiting, CORS protection, input validation, and sanitization. Sensitive data is excluded from logs and error messages.

### Transaction Security

All transaction signing occurs locally with no private key transmission over the network. Transactions are simulated before execution to prevent costly errors.

## Performance Optimizations

The application implements several performance enhancements:

- React component memoization for reduced re-renders
- Debounced API calls to prevent rate limiting
- Indexed database queries for fast data retrieval
- Docker layer caching for efficient builds
- Next.js production optimizations including code splitting

## System Status

The Keymaker v1.1.0 represents a fully operational, production-ready platform:

- Complete blockchain integration with real-time data
- All application routes tested and functional
- Docker container with automated health checks
- Responsive UI with theme persistence
- Real-time monitoring with historical data visualization
- Military-grade wallet encryption
- Jito bundle execution with MEV protection
- Multi-platform token deployment
- Comprehensive profit and loss tracking
- Robust error handling and recovery

### Production Deployment

```bash
# Quick deployment
docker compose up --build -d

# Verify health
curl http://localhost:3000/api/health
# Expected: {"ok":true,"version":"1.1.0"}
```

The Keymaker v1.1.0 delivers institutional-grade Solana memecoin orchestration capabilities. Deploy tokens, execute bundles, and track profits with confidence.

---

Built with ❤️ for the Solana ecosystem
