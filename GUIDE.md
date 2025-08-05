# 🚀 THE KEYMAKER v1.0.1 - Complete Production Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Features Overview](#features-overview)
4. [Production Deployment](#production-deployment)
5. [Usage Guide](#usage-guide)
6. [Architecture Details](#architecture-details)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for production)
- Solana wallet with SOL for transactions
- API keys from required services

### Development Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/keymaker.git
cd keymaker

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your .env.local file (see Environment Setup)

# Initialize database
npm run db:init

# Start development server
npm run dev
```

### Production Setup (Docker)

```bash
# Build and run with Docker Compose
docker compose up --build -d

# Check health
curl http://localhost:3000/api/health
# Should return: {"ok":true}

# View logs
docker compose logs -f keymaker
```

---

## 🔑 Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following:

```env
# Core RPC Configuration (REQUIRED)
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY

# Jito Configuration (REQUIRED for bundles)
NEXT_PUBLIC_JITO_ENDPOINT=https://mainnet.block-engine.jito.wtf
JITO_AUTH_TOKEN=YOUR_JITO_AUTH_TOKEN

# API Keys (REQUIRED for full functionality)
NEXT_PUBLIC_BIRDEYE_API_KEY=YOUR_BIRDEYE_KEY
BIRDEYE_API_KEY=YOUR_BIRDEYE_KEY
NEXT_PUBLIC_PUMPFUN_API_KEY=YOUR_PUMPFUN_KEY
PUMPFUN_API_KEY=YOUR_PUMPFUN_KEY

# Optional Services
NEXT_PUBLIC_LETSBONK_API_KEY=YOUR_LETSBONK_KEY
LETSBONK_API_KEY=YOUR_LETSBONK_KEY

# Jupiter API (uses public endpoint by default)
NEXT_PUBLIC_JUPITER_API_URL=https://quote-api.jup.ag/v6

# Master Wallet (for funding operations)
KEYPAIR=YOUR_BASE58_PRIVATE_KEY

# Monitoring (Optional)
SENTRY_DSN=YOUR_SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN
```

### Getting API Keys

1. **Helius RPC**: https://helius.xyz
   - Sign up for free account
   - Create new project
   - Copy RPC endpoint with API key

2. **Birdeye**: https://birdeye.so
   - Apply for API access
   - Essential for token prices and validation

3. **Pump.fun**: https://pump.fun
   - Contact their team for API access
   - Required for pump.fun token launches

4. **Jito**: https://jito.wtf
   - Apply for block engine access
   - Optional but recommended for MEV protection

---

## 🎮 Features Overview

### 1. Home Dashboard (`/home`)

![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

- **Real-time Statistics**: Wallet counts, total balance, active tokens
- **Quick Actions**: Direct links to all major features
- **System Status**: Connection health at a glance
- **Recent Activity**: Last 5 transactions

### 2. Bundle Engine (`/bundle`)

![Bundle Engine](https://via.placeholder.com/800x400?text=Bundle+Engine+Screenshot)

- **Jito Integration**: MEV-protected bundle execution
- **Multi-Transaction**: Up to 5 transactions per bundle
- **Preview Mode**: Simulate before execution
- **Wallet Selection**: Use any imported wallet
- **Priority Fees**: Customizable for faster inclusion

### 3. Wallet Manager (`/wallets`)

![Wallet Manager](https://via.placeholder.com/800x400?text=Wallet+Manager+Screenshot)

- **Secure Storage**: AES-256-GCM encryption
- **Role System**:
  - 🟡 Master: Funding source
  - 🔵 Dev: Development wallet (receives fees)
  - 🟢 Sniper: Buying wallets
- **Batch Operations**: Create multiple wallets at once
- **Import/Export**: Backup with encrypted .keymaker files

### 4. SPL Token Creator (`/spl-creator`)

![Token Creator](https://via.placeholder.com/800x400?text=Token+Creator+Screenshot)

- **Multi-Platform Launch**:
  - Pump.fun: Bonding curve launch
  - Raydium: Direct LP creation
  - LetsBonk: Community platform
- **Full Metadata**: Name, symbol, description, socials
- **Automatic Deployment**: One-click token creation

### 5. Trade History (`/logs`)

![Trade History](https://via.placeholder.com/800x400?text=Trade+History+Screenshot)

- **Complete History**: All transactions tracked
- **Filtering**: By status, wallet, token, date
- **Export**: CSV download for analysis
- **Direct Links**: Solscan explorer integration

### 6. PNL Analytics (`/pnl`)

![PNL Analytics](https://via.placeholder.com/800x400?text=PNL+Analytics+Screenshot)

- **Real-time Tracking**: Live profit/loss calculation
- **Multi-Level Analysis**:
  - Per wallet performance
  - Per token profitability
  - Session statistics
- **Fee Tracking**: Gas costs and dev fees
- **Export Reports**: JSON/CSV formats

### 7. Settings (`/settings`)

![Settings](https://via.placeholder.com/800x400?text=Settings+Screenshot)

- **API Configuration**: Secure key management
- **Connection Monitoring**:
  - Interactive 2x2 status grid
  - Click for 30-minute history charts
  - Real-time RTT measurements
- **Trading Preferences**: Default slippage, priority fees
- **Theme Toggle**: Dark/Light mode

---

## 🚀 Production Deployment

### Docker Deployment (Recommended)

1. **Prepare Environment**:

```bash
# Create production .env file
cp .env.example .env
# Edit with production values
```

2. **Build and Deploy**:

```bash
# Build production image
docker compose build

# Start services
docker compose up -d

# Verify health
curl http://localhost:3000/api/health
```

3. **Enable HTTPS (Optional)**:

```bash
# Start with nginx profile
docker compose --profile with-nginx up -d

# Add SSL certificates to ./ssl directory
# Update nginx.conf with your domain
```

### Manual Deployment

1. **Build Application**:

```bash
# Install dependencies
npm ci --production

# Build Next.js
npm run build

# Initialize database
npm run db:init
```

2. **Start with PM2**:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name keymaker -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Health Monitoring

The application provides health checks at `/api/health`:

```bash
# Check health
curl http://localhost:3000/api/health
# Returns: {"ok":true}

# Docker health check
docker inspect keymaker-prod | grep -A 5 Health
```

---

## 📖 Usage Guide

### Typical Workflow

1. **Initial Setup**:
   - Configure API keys in Settings
   - Import or create wallets
   - Assign wallet roles (Master, Dev, Sniper)
   - Fund master wallet with SOL

2. **Token Launch**:
   - Navigate to SPL Creator
   - Fill token details
   - Select launch platform
   - Deploy token (saves to store)

3. **Bundle Execution**:
   - Go to Bundle Engine
   - Select token to buy
   - Configure amount and wallets
   - Preview transactions
   - Execute bundle

4. **Monitor Performance**:
   - Check Trade History for confirmations
   - View PNL for profit tracking
   - Monitor wallet balances

5. **Sell Strategy**:
   - Use Sell Monitor for conditions
   - Manual sell via Bundle Engine
   - Track proceeds in PNL

### Best Practices

1. **Security**:
   - Never share wallet passwords
   - Export wallet backups regularly
   - Use strong encryption passwords
   - Keep API keys secure

2. **Performance**:
   - Monitor RPC rate limits
   - Use appropriate priority fees
   - Bundle similar transactions
   - Check network congestion

3. **Risk Management**:
   - Start with small amounts
   - Test on devnet first
   - Monitor slippage settings
   - Set stop-loss conditions

---

## 🏗️ Architecture Details

### Service Layer

```typescript
// Core Services
bundleService    - Jito bundle execution
jupiterService   - Token swap routing
platformService  - Multi-platform token launch
walletService    - Secure wallet management
pnlService      - Profit/loss tracking
sellService     - Automated sell conditions
```

### Security Features

1. **Wallet Encryption**:
   - Algorithm: AES-256-GCM
   - Key Derivation: PBKDF2 (100k iterations)
   - Storage: Encrypted localStorage + DB

2. **API Security**:
   - Environment variable isolation
   - Proxy endpoints for sensitive calls
   - Rate limiting on all endpoints

3. **Transaction Safety**:
   - Simulation before execution
   - Slippage protection
   - Priority fee optimization

### Database Schema

```sql
-- Execution logs for all transactions
CREATE TABLE execution_logs (
  id INTEGER PRIMARY KEY,
  timestamp TEXT,
  operation TEXT,
  status TEXT,
  wallet_address TEXT,
  token_address TEXT,
  amount_sol REAL,
  signature TEXT,
  error_message TEXT,
  gas_used REAL
);

-- Token launch tracking
CREATE TABLE token_launches (
  id INTEGER PRIMARY KEY,
  created_at TEXT,
  token_address TEXT,
  name TEXT,
  symbol TEXT,
  decimals INTEGER,
  supply TEXT,
  platform TEXT,
  launch_tx TEXT
);
```

---

## 🔧 Troubleshooting

### Common Issues

1. **"RPC Error: 429 Too Many Requests"**
   - Solution: Implement rate limiting
   - Use multiple RPC endpoints
   - Upgrade Helius plan

2. **"Wallet Connection Failed"**
   - Check Phantom extension installed
   - Verify network (mainnet)
   - Clear browser cache

3. **"Bundle Execution Failed"**
   - Verify Jito auth token
   - Check wallet balances
   - Increase priority fee

4. **"Database Error"**
   - Run `npm run db:init`
   - Check write permissions
   - Verify SQLite installed

### Debug Mode

Enable debug logging:

```javascript
// In your .env.local
DEBUG=keymaker:*
LOG_LEVEL=debug
```

### Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/keymaker/issues)
- Documentation: [Full API docs](https://keymaker-docs.com)
- Discord: [Join community](https://discord.gg/keymaker)

---

## 🎉 Success Checklist

✅ Environment configured with all API keys  
✅ Database initialized (`/data/keymaker.db` exists)  
✅ Docker health check passing  
✅ Can connect Phantom wallet  
✅ Settings page shows all green status lights  
✅ Can create/import wallets  
✅ Bundle execution works  
✅ PNL tracking active

**Congratulations! The Keymaker is ready for production use.** 🚀

---

_Built with ❤️ for the Solana ecosystem_
