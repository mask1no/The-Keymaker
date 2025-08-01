# The Keymaker - Solana Memecoin Bundler

A powerful, production-ready Solana token bundler for launching and sniping memecoins with multi-wallet support and atomic execution via Jito bundles. Now with 24/7 Docker deployment!

## 🚀 Features

### Core Capabilities
- **Multi-Platform Token Launch**: Deploy tokens on Pump.fun, LetsBonk.fun, or Raydium
- **Multi-Wallet Bundling**: Manage up to 20 wallets with role-based permissions (Master, Dev, Sniper)
- **Atomic Execution**: Use Jito bundles for same-slot execution or choose alternative strategies
- **24/7 Operation**: Docker containerized for continuous operation

### Execution Modes
- **Flash (Jito)**: Atomic bundle execution in the same slot
- **Regular**: Fast sequential execution without bundling  
- **Stealth**: Delayed execution with random timing (2-5s between transactions)
- **Manual**: Prepare transactions for user-controlled execution

### Advanced Features
- Real-time activity monitor with WebSocket transaction stream
- Rug pull functionality for Raydium pools (freeze & withdraw liquidity)
- Automated selling with configurable conditions
- PnL tracking and analytics
- Local wallet encryption (AES-256-GCM)
- Dark theme with green Matrix-style aesthetics
- Docker deployment with auto-restart
- Server-side database operations for reliability

## 🔧 Prerequisites

- Docker and Docker Compose (for 24/7 deployment)
- Node.js 20+ and npm (for local development)
- Python 3.10+ (for LetsBonk.fun integration)
- A funded Solana wallet for operations
- API keys for external services (see Configuration)

## 🐳 Quick Start (Docker - Recommended)

### 1. Clone and Configure

```bash
git clone https://github.com/yourusername/the-keymaker.git
cd the-keymaker

# Create environment configuration
cp env.example .env.local
```

### 2. Configure API Keys

Edit `docker-compose.override.yml` with your API keys:
```yaml
environment:
  NEXT_PUBLIC_HELIUS_RPC: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
  NEXT_PUBLIC_BIRDEYE_API_KEY: YOUR_BIRDEYE_KEY
  NEXT_PUBLIC_PUMPFUN_API_KEY: YOUR_PUMPFUN_KEY
```

### 3. Run 24/7 with Docker

```bash
# Build and start the bundler
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f keymaker

# Stop
docker-compose down
```

Your bundler is now running at http://localhost:3000 and will restart automatically!

## 💻 Local Development Setup

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for LetsBonk
cd bonk-mcp
pip install -r requirements.txt
cd ..
```

### 2. Initialize Database

```bash
npm run db:init
```

### 3. Configure Environment

```bash
cp env.example .env.local
# Edit .env.local with your API keys
```

### 4. Run Development Server

```bash
npm run dev
```

## ⚙️ Configuration

### Required API Keys

Edit `.env.local` or `docker-compose.override.yml`:

| Service | Key | Get From |
|---------|-----|----------|
| Helius RPC | `NEXT_PUBLIC_HELIUS_RPC` | [helius.xyz](https://helius.xyz) |
| Birdeye | `NEXT_PUBLIC_BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so) |
| Pump.fun | `NEXT_PUBLIC_PUMPFUN_API_KEY` | [pumpportal.fun](https://pumpportal.fun) |
| Jito (Optional) | `JITO_AUTH_TOKEN` | Premium Jito access |

### Platform Configuration

- **Solana Network**: Mainnet-beta (devnet not supported)
- **Default RPC**: Helius (recommended for reliability)
- **Jito Endpoint**: `https://mainnet.block-engine.jito.wtf`

## 📖 Usage Guide

### 1. Initial Setup

1. **Configure API Keys**: Navigate to Settings → Enter your API keys
2. **Import Master Wallet**: Wallets → Import → Enter private key → Set as Master
3. **Fund Master Wallet**: Ensure sufficient SOL for operations

### 2. Create Sniper Wallets

1. Click "Create Wallet Group"
2. Enter number of wallets (e.g., 10)
3. Set encryption password
4. Fund wallets with random amounts (0.3-0.7 SOL each)

### 3. Launch Token

1. **Select Platform**: Pump.fun, LetsBonk, or Raydium
2. **Configure Token**:
   - Name & Symbol
   - Supply (usually 1B)
   - Initial buy amount
   - Platform-specific settings
3. **Choose Execution Mode**:
   - Flash: Fastest, uses Jito bundles
   - Regular: Standard execution
   - Stealth: Delayed for organic appearance
   - Manual: Full control
4. **Execute**: Click "🔑 Execute Keymaker"

### 4. Monitor & Manage

- **Activity Monitor**: Real-time buy/sell tracking
- **PnL Dashboard**: Track profits and losses
- **Sell Monitor**: Configure auto-sell conditions
- **Analytics**: View detailed performance metrics

## 🏗️ Architecture

```
the-keymaker/
├── app/              # Next.js 14 app directory
│   ├── api/         # Server-side API routes
│   └── dashboard/   # Main application pages
├── components/       # React components
├── services/         # Core business logic
├── lib/             # Utilities and store
├── bonk-mcp/        # Python backend for LetsBonk
├── data/            # SQLite database
└── docker/          # Docker configuration
```

### Key Services

- `bundleService`: Jito bundle execution
- `platformService`: Multi-platform token launches
- `walletService`: Secure wallet management
- `sellService`: Jupiter-powered token selling
- `rugService`: Raydium pool manipulation

## 🛡️ Security

- **Encryption**: AES-256-GCM for all private keys
- **Local Storage**: Keys encrypted in browser/container
- **No Telemetry**: All tracking disabled by default
- **Password Protection**: Required for all wallet operations
- **Docker Security**: Non-root user, resource limits

## 🐛 Troubleshooting

### Docker Issues

**Container shows "unhealthy"**
- Normal behavior - health endpoint not implemented
- Check actual status with `docker-compose logs`

**Environment variable warnings**
- Expected - uses values from docker-compose.override.yml

### Transaction Issues

**"Insufficient SOL"**
- Ensure wallets have 0.05+ SOL for fees
- Master wallet needs extra for token creation

**"Transaction failed"**
- Check Jito bundle includes tip (min 1000 lamports)
- Verify token accounts exist
- Increase compute units if needed

### API Issues

**"Rate limited"**
- Upgrade to premium RPC tier
- Implement request queuing
- Add retry logic with backoff

## 📊 Performance

- **Bundle Capacity**: 20 wallets max per session
- **Jito Limits**: 5 transactions per bundle
- **Build Time**: ~4-5 minutes (Docker)
- **Memory Usage**: 500MB-2GB typical
- **Container Size**: ~300MB

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This software is for educational purposes only. Use at your own risk. The authors are not responsible for any losses incurred through the use of this software. Always verify transactions and use small amounts when testing.

## 🔗 Resources

- [Documentation](./guide.md)
- [Security Checklist](./SECURITY_CHECKLIST.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Project Summary](./SUMMARY.md)

---

**Version**: 1.0.0 | **Status**: Production Ready | **Last Updated**: August 1, 2025