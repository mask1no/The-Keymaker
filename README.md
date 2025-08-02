# The Keymaker v1.0.1 - Production-Grade Solana Bundler

![The Keymaker](https://img.shields.io/badge/Solana-Mainnet-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.1-orange)

## 🚀 Overview

The Keymaker is a production-ready Solana bundler application built for high-performance token operations on mainnet. It provides a complete suite of tools for SPL token creation, Jito bundle execution, wallet management, and real-time PnL tracking.

**Key Features:**
- 🪙 SPL Token Creation & Deployment (pump.fun, Raydium, letsbonk.fun)
- 📦 Jito Bundle Execution (Stealth & Manual modes)
- 👛 Secure Wallet Management (Phantom + Keypair imports)
- 📊 Real-Time PnL Tracking with SQLite persistence
- 🔄 Live Status Monitoring (RPC, WebSocket, Jito, Mainnet)
- 🔐 AES-256-GCM Encryption for private keys
- 🎯 100% Production-Ready - No mock data or placeholders
- 🛡️ Comprehensive Error Boundaries with recovery options
- 🌓 Persistent Dark/Light theme toggle
- 🔄 Automatic RPC retry with rate limiting

## 🆕 What's New in v1.0.1

### UI/UX Improvements
- **Fixed Sidebar**: Always expanded showing both icons and labels (no hover animations)
- **Status Indicators**: Moved to Settings page in a clean 2x2 Bento grid
  - RPC Health with RTT display and click for 30-min history
  - WebSocket connection status with real-time monitoring
  - Jito Engine availability tracking
  - Solana Mainnet status with slot height
  - Updates every 8 seconds automatically
  - Interactive cards with tooltips and historical charts
- **Theme Toggle**: Dark/Light mode fully functional with proper CSS theming
  - Persists across sessions using localStorage
  - Smooth transitions between themes
  - All UI components theme-aware
- **Error Boundaries**: Comprehensive error handling with recovery options

### Technical Enhancements
- **Zero Mock Data**: Complete removal of all placeholder values and mock wallets
- **Real Wallet Integration**: 
  - Phantom wallet adapter fully connected
  - Real pubkey display in topbar
  - Copy address functionality
  - Wallet selector shows actual connected wallets
- **Service Wiring**: All services properly connected and functional
  - bundleService ✅ - Jito bundle execution
  - jupiterService ✅ - Token swaps via Jupiter
  - platformService ✅ - Token creation on multiple platforms
  - walletService ✅ - Secure wallet management
  - pnlService ✅ - Real-time profit tracking
  - sellService ✅ - Automated sell conditions
- **Route Updates**: Simplified navigation structure
  - `/` - Landing page with feature overview
  - `/home` - Main dashboard with stats
  - `/bundle` - Bundle execution engine
  - `/wallets` - Wallet management
  - `/spl-creator` - Token creation
  - `/logs` - Trade history
  - `/pnl` - Profit & loss tracking
  - `/settings` - Configuration & status monitoring

### Production Readiness
- Docker health checks configured at `/api/health`
- Database auto-initialization with `docker-entrypoint.sh`
- RPC rate limiting and retry logic implemented
- All buttons and interactions fully functional
- No grey screens or dead routes
- Graceful SIGTERM handling in container
- Health check endpoint returns `{ ok: true }`

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14.2.30, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Blockchain**: @solana/web3.js, @solana/spl-token
- **State Management**: Zustand
- **Database**: SQLite (local persistence)
- **Security**: AES-256-GCM encryption, PBKDF2 key derivation
- **Monitoring**: Sentry integration
- **Container**: Docker with Alpine Linux

### Core Services

#### 1. **Bundle Service** (`services/bundleService.ts`)
- Executes bundles via Jito Block Engine
- Supports up to 5 transactions per bundle
- Implements retry logic with exponential backoff
- Monitors bundle status in real-time

#### 2. **Wallet Service** (`services/walletService.ts`)
- Encrypts private keys using AES-256-GCM
- PBKDF2 key derivation (100,000 iterations)
- Supports batch wallet creation
- Import/export with encrypted .keymaker files

#### 3. **Platform Service** (`services/platformService.ts`)
- Creates SPL tokens on mainnet
- Integrates with pump.fun, Raydium, letsbonk.fun
- Handles liquidity pool creation
- Validates token parameters

#### 4. **PnL Service** (`services/pnlService.ts`)
- Tracks buy/sell transactions in SQLite
- Calculates real-time profit/loss
- Provides wallet and token-specific analytics
- Exports data in JSON/CSV formats

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│  1. Wallet Encryption                                        │
│     └─ AES-256-GCM with PBKDF2 (100k iterations)           │
│                                                             │
│  2. API Key Protection                                      │
│     └─ Environment variables + localStorage                 │
│                                                             │
│  3. Transaction Signing                                     │
│     └─ Local keypair management                            │
│                                                             │
│  4. Network Security                                        │
│     └─ HTTPS only, rate limiting, CORS protection         │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Installation

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/the-keymaker.git
cd the-keymaker
```

2. Create `.env.local` file:
```env
# Required
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_BIRDEYE_API_KEY=your_birdeye_api_key
BIRDEYE_API_KEY=your_birdeye_api_key

# Optional
NEXT_PUBLIC_PUMPFUN_API_KEY=your_pumpfun_key
PUMPFUN_API_KEY=your_pumpfun_key
NEXT_PUBLIC_MOONSHOT_API_KEY=your_moonshot_key
MOONSHOT_API_KEY=your_moonshot_key
JITO_AUTH_TOKEN=your_jito_token
```

3. Build and run with Docker:
```bash
docker compose build
docker compose up -d
```

4. Access the app at http://localhost:3000

## 📋 Features

### Home (`/home`)
- Overview dashboard with system stats
- Wallet balances and counts
- PnL summary
- Quick navigation tiles

### Bundle (`/bundle`)
- Execute Jito bundles with real wallets
- Stealth mode for private transactions
- Manual mode for custom operations
- Real-time transaction preview
- Bundle result tracking

### Wallets (`/wallets`)
- Create/import wallets (Phantom or keypair)
- Role assignment (Master, Dev, Sniper)
- Encrypted storage
- Batch operations
- Balance management

### SPL Creator (`/spl-creator`)
- Deploy SPL tokens on mainnet
- Multi-platform launch (pump.fun, Raydium, etc.)
- Configurable token parameters
- Liquidity pool creation
- Metadata management

### Trade History (`/logs`)
- Complete transaction history
- Filter by status, type, wallet
- Export functionality
- Real-time updates
- Detailed bundle breakdowns

### PNL (`/pnl`)
- Real-time profit/loss tracking
- Per-wallet analytics
- Per-token performance
- Session statistics
- Export reports

### Settings (`/settings`)
- API key management
- Connection status monitoring (2x2 grid)
- Trading preferences
- Security settings
- Database management

## 🔧 API Endpoints

### Health Check
```
GET /api/health
Response: { "ok": true }
```

### Proxy API
```
POST /api/proxy
Body: {
  service: "jupiter" | "birdeye" | "helius" | "pumpfun",
  endpoint: string,
  params?: object,
  method?: "GET" | "POST"
}
```

### Bundle Operations
```
POST /api/bundle/execute
Body: {
  transactions: Transaction[],
  wallets: WalletData[],
  tipAmount: number
}
```

## 🏃‍♂️ Development

### Local Development
```bash
npm install
npm run dev
```

### Database Initialization
```bash
npm run db:init
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🐳 Docker Configuration

The application uses a multi-stage Docker build for optimal performance:

1. **Dependencies Stage**: Installs and builds native modules
2. **Builder Stage**: Compiles Next.js application
3. **Runner Stage**: Minimal production image

### Docker Commands
```bash
# Build
docker compose build --no-cache

# Run
docker compose up -d

# View logs
docker logs keymaker-prod -f

# Stop
docker compose down
```

## 📊 Database Schema

### Wallets Table
```sql
CREATE TABLE wallets (
  id INTEGER PRIMARY KEY,
  publicKey TEXT UNIQUE NOT NULL,
  encryptedPrivateKey TEXT NOT NULL,
  role TEXT NOT NULL,
  balance REAL DEFAULT 0
);
```

### PnL Tracking Table
```sql
CREATE TABLE pnl_tracking (
  id INTEGER PRIMARY KEY,
  wallet TEXT NOT NULL,
  token_address TEXT NOT NULL,
  action TEXT NOT NULL,
  sol_amount REAL NOT NULL,
  token_amount REAL NOT NULL,
  price REAL NOT NULL,
  timestamp INTEGER NOT NULL
);
```

### Bundle Executions Table
```sql
CREATE TABLE bundle_executions (
  id INTEGER PRIMARY KEY,
  bundle_id TEXT,
  slot INTEGER NOT NULL,
  signatures TEXT NOT NULL,
  status TEXT NOT NULL,
  success_count INTEGER NOT NULL,
  failure_count INTEGER NOT NULL,
  used_jito BOOLEAN NOT NULL,
  execution_time INTEGER NOT NULL
);
```

## 🔐 Security Considerations

1. **Wallet Security**
   - Private keys are never stored in plain text
   - AES-256-GCM encryption with unique salt/IV per wallet
   - PBKDF2 key derivation prevents brute force attacks

2. **API Security**
   - Rate limiting on all endpoints
   - CORS protection
   - Input validation and sanitization
   - No sensitive data in logs

3. **Transaction Security**
   - Local transaction signing only
   - No private keys transmitted over network
   - Simulation before execution

## 🚨 Error Handling

The application implements comprehensive error handling:
- Sentry integration for error tracking
- Graceful degradation for API failures
- User-friendly error messages
- Automatic retry logic for network operations

## 📈 Performance Optimization

- React component memoization
- Debounced API calls
- Efficient database queries with indexes
- Docker layer caching
- Next.js production optimizations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Solana Foundation for blockchain infrastructure
- Jito Labs for MEV protection
- Helius for RPC services
- Jupiter for swap aggregation

---

## 🎉 THE KEYMAKER v1.0.1 — BUNDLER PRODUCTION READY

### ✅ **ALL SYSTEMS OPERATIONAL**

✓ **NO mock data remains** - 100% real blockchain integration  
✓ **ALL pages functional** - Every route tested and working  
✓ **Docker production-ready** - Health checks passing  
✓ **UI modern & responsive** - Dark/Light themes working  
✓ **Real-time monitoring** - Status LEDs with 30-min history  
✓ **Wallets encrypted** - AES-256-GCM security  
✓ **Bundles execute** - Jito integration confirmed  
✓ **Tokens launch** - Multi-platform deployment  
✓ **PNL tracks profit/loss** - Real-time calculations  
✓ **No grey screens** - Comprehensive error handling  

### 🚀 **READY FOR MAINNET DEPLOYMENT**

```bash
# Quick Deploy
docker compose up --build -d

# Verify
curl http://localhost:3000/api/health
# Returns: {"ok":true}
```

**The Keymaker v1.0.1** - Your production-grade Solana memecoin orchestration platform. Ship tokens, bundle trades, track profits. No compromises.

---

**Built with ❤️ for the Solana ecosystem**