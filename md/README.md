# Keymaker — Production-Ready Solana Trading Platform

## 🚀 Quick Start (Production Ready)

1. **Clone & Install**: `git clone https://github.com/mask1no/The-Keymaker.git && cd The-Keymaker && npm install`
2. **Environment Setup**: Copy `env.example` to `.env` and configure your RPC endpoints
3. **Database Init**: `npm run db:init` (creates SQLite database)
4. **Build & Start**: `npm run build && npm start`
5. **Access**: Open http://localhost:3000 and sign in with Phantom wallet
6. **Trading**: Configure wallets, set up trading parameters, and start trading!

## ✨ Current Status: Production Ready ✅

**All 15 core features completed and tested:**

- ✅ Multi-wallet trading engine (Jupiter V6)
- ✅ Jito/RPC mode toggle with MEV optimization
- ✅ Secure authentication (HMAC-signed sessions)
- ✅ Wallet management with encryption
- ✅ P&L tracking and analytics
- ✅ Volume bot automation
- ✅ Pump.fun token creation
- ✅ Error handling and monitoring
- ✅ Performance optimizations
- ✅ Security hardening
- ✅ Testing suite
- ✅ Production deployment ready

## 🏗️ Architecture

**Modern Full-Stack Solana Trading Platform:**

- **Frontend**: Next.js 14.2 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Serverless API routes with SQLite database
- **Trading Engine**: Multi-wallet Jupiter V6 integration with Jito/RPC modes
- **Security**: HMAC-signed sessions, rate limiting, input validation
- **Database**: SQLite with encrypted wallet storage

## 🎯 Core Features

### Trading Engine

- **Multi-Wallet Trading**: Execute buy/sell orders across multiple wallets simultaneously
- **Jupiter V6 Integration**: Advanced routing and slippage protection
- **Jito/RPC Modes**: Toggle between MEV-protected bundles and direct RPC execution
- **Volume Bot**: Automated market making and volume generation

### Wallet Management

- **Secure Storage**: AES-256-GCM encryption for private keys
- **Wallet Groups**: Organize wallets into trading groups
- **Balance Tracking**: Real-time SOL and SPL token balance monitoring
- **Import/Export**: Support for various wallet formats

### Analytics & P&L

- **Real-time P&L**: Track profits and losses across all trades
- **Trade History**: Complete transaction history with filtering
- **Performance Metrics**: Success rates, average execution times
- **Export Capabilities**: CSV export for external analysis

### Token Creation

- **Pump.fun Integration**: Create memecoins directly from the platform
- **Metadata Management**: IPFS integration for token metadata
- **Template Library**: Pre-built token templates for quick deployment

## 🔧 Development & Deployment

### Development

```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm test           # Run test suite
npm run typecheck  # TypeScript validation
```

### Production Deployment

```bash

# Or use deployment scripts
./scripts/deploy.sh    # Linux/macOS
.\scripts\deploy.ps1   # Windows PowerShell
```

### Environment Configuration

See `env.example` for required environment variables:

- `HELIUS_RPC_URL`: Your Helius RPC endpoint
- `KEYMAKER_SESSION_SECRET`: Secure session secret
- `ENGINE_API_TOKEN`: API authentication token

## 🔐 Security Features

- **HMAC-Signed Sessions**: Secure authentication with cryptographic signatures
- **Rate Limiting**: API protection against abuse and DDoS attacks
- **Input Validation**: Zod schemas for all API endpoints
- **Encrypted Storage**: AES-256-GCM encryption for sensitive data
- **Security Headers**: CSP, HSTS, and other security headers
- **No Browser Keys**: All private key operations happen server-side

## 📊 Monitoring & Health Checks

### Health Endpoints

```bash
# System health
curl http://localhost:3000/api/health

# Performance metrics
curl http://localhost:3000/api/performance/metrics

# Database status
curl http://localhost:3000/api/test-db
```

### Trading Engine Status

```bash
# Engine status
curl http://localhost:3000/api/engine/status

# Test trading engine
curl http://localhost:3000/api/test-trading
```

## 🎨 User Interface

- **Dark Theme**: Modern dark UI optimized for trading environments
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live data streaming for prices, balances, and trade status
- **Intuitive Navigation**: Clean, organized interface with quick access to all features
- **Performance Optimized**: Fast loading times with efficient data fetching

## 📚 Documentation

- **[Deployment Guide](md/DEPLOYMENT.md)**: Complete production deployment instructions
- **[Security Guide](md/SECURITY.md)**: Security best practices and hardening
- **[Production Checklist](md/PRODUCTION_CHECKLIST.md)**: Pre-deployment verification steps
- **[API Documentation](md/API.md)**: Complete API reference (coming soon)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm package manager
- Phantom wallet for authentication
- Helius RPC endpoint (get one at helius.xyz)

### Installation Steps

1. Clone the repository: `git clone https://github.com/mask1no/The-Keymaker.git`
2. Install dependencies: `npm install`
3. Copy environment file: `cp env.example .env`
4. Configure your `.env` file with RPC endpoints and secrets
5. Initialize database: `npm run db:init`
6. Start development server: `npm run dev`
7. Open http://localhost:3000 and sign in with Phantom

### Production Deployment

1. Build the application: `npm run build`
2. Or use deployment scripts: `./scripts/deploy.sh` (Linux/macOS) or `.\scripts\deploy.ps1` (Windows)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and code of conduct.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the `/md` folder for detailed guides
- **Security**: Report security issues privately via GitHub Security Advisories

---

**Status**: ✅ Production Ready | **Version**: 1.5.2 | **Last Updated**: January 2025
