# 🗝️ The Keymaker - Solana Memecoin Bundler

> **Elite-grade Solana memecoin orchestration engine with Jito MEV protection**

![The Keymaker](https://img.shields.io/badge/Solana-Mainnet-00FFF0?style=for-the-badge&logo=solana)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)

## ⚡ Overview

The Keymaker is a weaponized Solana bundler built for serious memecoin operations. This is not a toy - it's a production-grade orchestration engine that can launch tokens, fund wallets, execute Jito bundles, and manage automated sells with real transactions on mainnet.

### 🎯 Core Capabilities

- **Token Launch**: Deploy on pump.fun, letsbonk.fun, Raydium, or Moonshot
- **Wallet Orchestration**: Manage hundreds of wallets with role-based permissions
- **Jito Bundling**: MEV-protected bundle execution with retry logic
- **Automated Selling**: Jupiter-powered sells with dynamic slippage
- **Real-time Monitoring**: Track every transaction with Solscan links
- **Zero Mock Data**: Every button = real transaction or error

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ & npm 9+
- Python 3.10+
- Solana CLI tools
- 1+ SOL for testing
- API keys for Helius, Jupiter, Birdeye

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/the-keymaker.git
cd the-keymaker

# Install dependencies
npm install --legacy-peer-deps
cd bonk-mcp && pip install -r requirements.txt && cd ..

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Initialize database
npm run init-db

# Run development server
npm run dev
```

## 🔧 Configuration

### Required Environment Variables

```env
# RPC & Network
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=your_helius_api_key

# API Keys (Backend only)
BIRDEYE_API_KEY=your_birdeye_api_key
JUPITER_API_KEY=your_jupiter_api_key
JITO_AUTH_TOKEN=your_jito_auth_token

# Platform APIs (optional)
PUMPFUN_API_KEY=your_pumpfun_api_key
MOONSHOT_API_KEY=your_moonshot_api_key

# Solana Keypair (for Python backend)
SOLANA_KEYPAIR=your_base58_encoded_keypair
```

### Jito Configuration

```env
# Jito tip accounts (mainnet)
JITO_TIP_ACCOUNTS=96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5,HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe
```

## 🎮 Usage Guide

### 1. Wallet Setup

```typescript
// Create master wallet first
Navigate to Dashboard → Wallets
Click "Create Wallet" → Role: Master
Save the password securely!

// Create sniper wallets
Create 5-10 wallets with role "Sniper"
These will execute the bundle buys
```

### 2. Token Launch

```typescript
// Configure token
Name: "Your Token"
Symbol: "TICKER"
Supply: 1000000000 (1B)
Decimals: 6 (letsbonk) or 9 (pump.fun)
Platform: letsbonk.fun (recommended)

// Launch sequence
1. Click "Launch Token"
2. Enter password
3. Wait for confirmation
4. Save mint address
```

### 3. Wallet Funding

```typescript
// Fund sniper wallets
Total Amount: 1 SOL
Min per wallet: 0.1 SOL
Max per wallet: 0.2 SOL

// Funds distributed based on role weights:
- Sniper: 2x weight
- Dev: 1.5x weight  
- Normal: 1x weight
```

### 4. Bundle Execution

```typescript
// Configure bundle
Bundle Size: 5 wallets
Slippage: 1% (auto-adjusts based on liquidity)
Priority Fee: 0.0001 SOL
Jito Tip: 0.01 SOL

// Execute
1. Click "Bundle Buys"
2. Transactions built with Jupiter
3. Bundled via Jito
4. Confirms in 1-2 slots
```

### 5. Automated Sells

```typescript
// Sell configuration
Profit Target: 100%
Stop Loss: -50%
Slippage: Dynamic (0.5-50%)

// Executes via Jupiter with:
- Automatic route finding
- MEV protection
- Retry on failure
```

## 🏗️ Architecture

### Frontend Stack

```
components/
├── ControlCenter/      # Orchestration UI
├── WalletManager/      # Wallet CRUD
├── BundleEngine/       # Bundle builder
├── ExecutionLog/       # Transaction logs
└── UI/                 # Reusable components
```

### Backend Services

```
services/
├── platformService.ts  # Token launches
├── walletService.ts    # Wallet encryption
├── bundleService.ts    # Jito integration
├── jupiterService.ts   # Swap execution
└── sellService.ts      # Automated sells
```

### Python Backend

```
bonk-mcp/
├── core/
│   ├── letsbonk.py    # LetsBonk protocol
│   └── jupiter.py     # Jupiter integration
└── tools/
    ├── token_launcher.py
    └── token_buyer.py
```

## 🔐 Security

### Wallet Encryption
- **AES-256-GCM** encryption for all private keys
- **PBKDF2** with 100k iterations for key derivation
- Keys stored in memory/sessionStorage only
- Automatic cleanup on disconnect

### Transaction Safety
- All transactions simulated before execution
- Retry logic with exponential backoff
- Balance validation before operations
- Slippage protection with dynamic adjustment

### API Security
- All sensitive keys proxied through backend
- Rate limiting on API endpoints
- Input validation and sanitization
- No private keys in logs

## 📊 Monitoring

### Execution Logs
Every transaction is logged with:
- Phase (launch/fund/bundle/sell)
- Wallet addresses involved
- Transaction signatures with Solscan links
- Slot number and status
- Error messages if failed

### PnL Tracking
- Real-time profit/loss calculation
- Per-wallet and aggregate metrics
- Export to CSV for analysis
- Historical performance data

## 🚨 Common Issues

### "Insufficient SOL for fees"
```bash
# Ensure master wallet has enough SOL
# Each transaction needs ~0.005 SOL for fees
# Bundle operations need Jito tip (0.01 SOL)
```

### "Transaction simulation failed"
```bash
# Check token has liquidity
# Verify wallet has token balance
# Increase slippage if needed
# Check RPC endpoint is responsive
```

### "Bundle failed to land"
```bash
# Increase Jito tip amount
# Reduce bundle size
# Check validator is accepting bundles
# Retry with different validator
```

## ⚡ Performance Tips

1. **Use dedicated RPC**: Free endpoints are rate-limited
2. **Batch operations**: Group wallet funding
3. **Optimize bundle size**: 3-5 transactions ideal
4. **Monitor TPS**: Check Solana network congestion
5. **Cache token data**: Reduce API calls

## 🧪 Testing Checklist

- [ ] Create master wallet with 2+ SOL
- [ ] Generate 5 sniper wallets
- [ ] Launch test token on devnet first
- [ ] Fund wallets with 0.1 SOL each
- [ ] Execute bundle with 3 wallets
- [ ] Verify buys on Solscan
- [ ] Test sell functionality
- [ ] Check PnL calculations
- [ ] Export logs to CSV

## 🛠️ Development

### Code Standards

```typescript
// TypeScript
- Strict mode enabled
- Explicit return types
- No any without justification
- Zod for runtime validation

// Python  
- Type hints required
- Async/await for I/O
- Proper exception handling
- No bare except clauses
```

### Git Workflow

```bash
# Feature branch
git checkout -b feat/your-feature

# Commit with conventional commits
git commit -m "feat: add dynamic slippage"

# Push and create PR
git push origin feat/your-feature
```

## 📝 License

This software is for educational and personal use only. Not for commercial distribution.

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK**. This tool executes real transactions on Solana mainnet. The authors are not responsible for any financial losses. Always test on devnet first and understand the code before using.

---

<p align="center">
Built for degens, by degens 🚀<br/>
<em>Not financial advice. DYOR.</em>
</p>