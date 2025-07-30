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
- **Zero Key Storage**: Private keys are NEVER stored - only derived from password
- **PBKDF2 600K Iterations**: 6x stronger than industry standard
- **Secure Password Dialogs**: No browser prompts, masked input with strength validation
- **API Key Protection**: All sensitive keys proxied through backend
- **Input Validation**: Comprehensive validation prevents XSS and overflow attacks
- **Dynamic Slippage**: Automatically adjusts based on liquidity (0.5-50%)
- **Transaction Simulation**: All bundles simulated before submission
- **Rate Limiting**: API proxy prevents abuse
- **Safe BigInt Operations**: Protected against buffer overflow vulnerabilities

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

## 🔧 Environment Setup

1. Create a `.env.local` file in the root directory:

```bash
# RPC Endpoints
NEXT_PUBLIC_HELIUS_RPC=https://api.mainnet-beta.solana.com

# API Keys (Server-side only - do not prefix with NEXT_PUBLIC_)
HELIUS_API_KEY=your_helius_api_key_here
BIRDEYE_API_KEY=your_birdeye_api_key_here
JUPITER_API_KEY=your_jupiter_api_key_here
PUMPFUN_API_KEY=your_pumpfun_api_key_here
MOONSHOT_API_KEY=your_moonshot_api_key_here
JITO_AUTH_TOKEN=your_jito_auth_token_here
```

2. Replace `your_*_api_key_here` with your actual API keys.
3. For better RPC performance, consider getting a free Helius API key at https://helius.dev

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
# RPC Endpoints (Public - OK to expose)
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_NETWORK=mainnet-beta

# Backend API Keys (Private - Never expose these!)
HELIUS_API_KEY=your_helius_api_key
BIRDEYE_API_KEY=your_birdeye_api_key
JUPITER_API_KEY=your_jupiter_api_key
PUMPFUN_API_KEY=your_pumpfun_api_key
MOONSHOT_API_KEY=your_moonshot_api_key
JITO_AUTH_TOKEN=your_jito_auth_token

# Platform URLs (Used by API proxy)
MOONSHOT_API_URL=https://api.moonshot.gg

# Jito Configuration
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
- **Key Derivation System**: Private keys are NEVER stored, only derived when needed
- **PBKDF2 with 600,000 iterations**: Industry-leading security standard
- **Deterministic Generation**: BIP44-like paths for wallet derivation
- **IndexedDB Storage**: More secure than localStorage for metadata
- **AES-256-GCM Encryption**: For secure wallet exports only

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