# 🔐 The Keymaker

> A professional-grade Solana dApp for automated trading, memecoin launching, and advanced wallet management with MEV protection.

![The Keymaker](https://img.shields.io/badge/Solana-Mainnet-00FFF0?style=for-the-badge&logo=solana)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## 🌟 Overview

The Keymaker is a cutting-edge Solana dApp that combines advanced wallet management, automated trading capabilities, and memecoin creation tools into a single, secure platform. Built with a focus on security, performance, and user experience, it provides professional traders and developers with the tools they need to succeed in the Solana ecosystem.

### Key Differentiators
- **MEV Protection**: Integrated Jito bundle support for frontrun protection
- **Multi-Platform Support**: Launch on Pump.fun, Moonshot, Let's Bonk, and Raydium
- **Advanced Wallet Management**: Hierarchical wallet system with roles and encryption
- **Real-Time Analytics**: Live PnL tracking and market data
- **Professional UI**: Dark theme with glass morphism effects

## ✨ Features

### 🔐 Wallet Management
- **Secure Wallet Creation**: Generate wallets with encrypted private key storage
- **Wallet Roles**: Master, Dev, Sniper, and Normal wallets with different privileges
- **Group Management**: Organize wallets into groups for better organization
- **Bulk Operations**: Fund multiple wallets in a single transaction
- **Import/Export**: Secure wallet backup with .keymaker encrypted files

### 🚀 Memecoin Launcher
- **Multi-Platform Deployment**: 
  - Pump.fun integration
  - Moonshot deployment
  - Let's Bonk support
  - Raydium liquidity pools
- **Token Cloning**: Clone existing tokens with custom parameters
- **Metadata Management**: IPFS integration for token metadata
- **Liquidity Management**: Automated LP creation and management

### 📦 Bundle Engine
- **Jito MEV Protection**: Bundle transactions to prevent frontrunning
- **Multi-Wallet Execution**: Execute trades across multiple wallets
- **Transaction Preview**: Simulate transactions before execution
- **Priority Fee Optimization**: Smart fee calculation for faster execution
- **Batch Operations**: Bundle multiple operations efficiently

### 📊 Analytics & Monitoring
- **Real-Time Price Tracking**: SOL, ETH, BTC, and custom tokens
- **PnL Dashboard**: Track profits/losses across all wallets
- **Trade History**: Comprehensive logging with export capabilities
- **Market Cap Monitoring**: Track token market caps in real-time
- **Custom Alerts**: Set price and volume alerts

### 🛡️ Security Features
- **Encrypted Storage**: All private keys encrypted with user passwords
- **No Hardcoded Keys**: Zero test wallets or mock credentials in production
- **Safe BigInt Operations**: Protected against buffer overflow vulnerabilities
- **Error Boundaries**: Graceful error handling throughout the app
- **Secure RPC**: Dedicated Helius RPC endpoints

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom dark theme
- **UI Components**: Custom glass morphism components
- **State Management**: React Context + Hooks
- **Animations**: Framer Motion

### Blockchain
- **Network**: Solana (Mainnet/Devnet)
- **Wallet Adapter**: @solana/wallet-adapter
- **Web3**: @solana/web3.js
- **DEX Integration**: Jupiter, Raydium SDKs
- **MEV Protection**: Jito Labs bundle API

### Backend Services
- **Token APIs**: Jupiter, Birdeye, DexScreener
- **Platform APIs**: Pump.fun, Moonshot, Let's Bonk
- **Storage**: SQLite for analytics
- **Monitoring**: Sentry for error tracking

### Development
- **Package Manager**: npm
- **Build Tool**: Next.js compiler
- **Type Checking**: TypeScript 5.x
- **Linting**: ESLint
- **Testing**: Jest (optional)

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- A Solana wallet (Phantom or Solflare recommended)
- RPC endpoint (Helius recommended)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/the-keymaker.git
cd the-keymaker
```

### 2. Install Dependencies

```bash
# Install with legacy peer deps due to Solana wallet adapter conflicts
npm install --legacy-peer-deps

# Install TypeScript types
npm install --save-dev @types/bn.js
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# RPC Endpoints
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_NETWORK=mainnet-beta

# Platform APIs
NEXT_PUBLIC_PUMPFUN_API=https://api.pumpfun.com
NEXT_PUBLIC_MOONSHOT_API=https://api.moonshot.gg
NEXT_PUBLIC_LETSBONK_API=https://api.letsbonk.com

# Analytics APIs
NEXT_PUBLIC_BIRDEYE_API=https://api.birdeye.so
NEXT_PUBLIC_DEXSCREENER_API=https://api.dexscreener.com
NEXT_PUBLIC_JUPITER_API_URL=https://api.jupiter.ag

# Jito MEV Protection
NEXT_PUBLIC_JITO_ENDPOINT=https://mainnet.block-engine.jito.wtf/api/v1
NEXT_PUBLIC_JITO_TIP_AMOUNT=10000

# Optional: Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

### 4. Database Setup

Initialize the SQLite database:

```bash
npm run init-db
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🎮 Usage Guide

### Getting Started

1. **Connect Wallet**: Click the wallet button in the top bar to connect your Solana wallet
2. **Create Wallet Group**: Navigate to Wallets → Create a new group
3. **Generate Wallets**: Create wallets with specific roles (Master, Sniper, etc.)
4. **Fund Wallets**: Use the bulk funding feature to distribute SOL

### Creating a Memecoin

1. Navigate to **Create Token**
2. Fill in token details:
   - Name and Symbol
   - Supply and decimals
   - Description and social links
3. Upload token image (stored on IPFS)
4. Select deployment platform
5. Review and deploy

### Using the Bundle Engine

1. Go to **Bundle Engine**
2. Add transactions:
   - Select wallet
   - Choose buy/sell
   - Enter token address and amount
3. Set slippage and priority fees
4. Preview transactions
5. Execute bundle

### Monitoring Performance

1. Check **Analytics** for real-time prices
2. View **PnL Tracker** for profit/loss data
3. Export trade history as CSV
4. Set up sell monitors for automated alerts

## 🏗️ Architecture

```
the-keymaker/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard pages
│   ├── api/              # API routes
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── UI/              # Reusable UI components
│   ├── Wallet/          # Wallet-related components
│   └── ...              # Feature-specific components
├── services/             # Business logic services
│   ├── walletService.ts # Wallet management
│   ├── jupiterService.ts # DEX integration
│   └── ...              # Platform integrations
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and types
├── utils/                # Helper functions
└── bonk-mcp/            # MCP integration (optional)
```

## 🔒 Security Considerations

### Private Key Management
- All private keys are encrypted using AES-256-GCM
- Passwords are never stored, only used for encryption/decryption
- No private keys in localStorage or cookies

### Vulnerability Mitigation
- Custom `safeBigInt` wrapper for bigint-buffer vulnerability
- Input validation on all user inputs
- Secure RPC endpoints with rate limiting
- CORS properly configured for production

### Best Practices
- Never share your .env.local file
- Use strong passwords for wallet encryption
- Regularly backup your .keymaker files
- Monitor transactions for suspicious activity

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Dependency Conflicts**
```bash
# Use legacy peer deps
npm install --legacy-peer-deps
```

**RPC Rate Limiting**
- Use dedicated RPC endpoints
- Implement request batching
- Add retry logic with exponential backoff

**Windows-Specific Issues**
```powershell
# Run setup script
.\setup.ps1
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code style
- Add comments for complex logic
- Update tests for new features
- Ensure no hardcoded values

## 🙏 Acknowledgments

- [Solana Labs](https://solana.com) for the blockchain infrastructure
- [Jupiter](https://jup.ag) for DEX aggregation
- [Jito Labs](https://jito.wtf) for MEV protection
- [Helius](https://helius.dev) for RPC services
- All the platform partners (Pump.fun, Moonshot, etc.)

---

<p align="center">Built with ❤️ for the Solana ecosystem</p>