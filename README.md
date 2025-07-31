# The Keymaker - Solana Memecoin Bundler

A powerful, production-ready Solana token bundler for launching and sniping memecoins with multi-wallet support and atomic execution via Jito bundles.

## 🔑 Features

- **Multi-Platform Token Launch**: Deploy tokens on Pump.fun, LetsBonk.fun, or Raydium
- **Multi-Wallet Bundling**: Manage up to 20 wallets with role-based permissions (Master, Dev, Sniper)
- **Atomic Execution**: Use Jito bundles for same-slot execution or choose alternative strategies
- **4 Execution Modes**:
  - **Flash (Jito)**: Atomic bundle execution in the same slot
  - **Regular**: Fast sequential execution without bundling
  - **Stealth**: Delayed execution with random timing (2-5s between transactions)
  - **Manual**: Prepare transactions for user-controlled execution
- **Advanced Features**:
  - Real-time activity monitor with WebSocket transaction stream
  - Rug pull functionality for Raydium pools (freeze & withdraw liquidity)
  - Automated selling with configurable conditions
  - PnL tracking and analytics
  - Local wallet encryption (AES-256-GCM)
  - Dark theme with green Matrix-style aesthetics

## 🚀 Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for LetsBonk.fun integration)
- A funded Solana wallet for operations
- API keys for external services (see Configuration)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/the-keymaker.git
cd the-keymaker
```

2. Install dependencies:
```bash
npm install
```

3. Install Python dependencies (for LetsBonk.fun):
```bash
cd bonk-mcp
pip install -r requirements.txt
cd ..
```

4. Set up environment variables:
```bash
cp env.example .env.local
```

5. Initialize the database:
```bash
npm run init-db
```

## ⚙️ Configuration

Edit `.env.local` with your configuration:

### Required API Keys

- **Helius RPC**: Get from [helius.xyz](https://helius.xyz)
  - `NEXT_PUBLIC_HELIUS_RPC`: Your Helius RPC endpoint
  - `HELIUS_API_KEY`: Your Helius API key

- **Jito**: Get from [jito.wtf](https://jito.wtf)
  - `JITO_AUTH_TOKEN`: Your Jito authentication token

- **Platform APIs** (as needed):
  - `PUMPFUN_API_KEY`: For Pump.fun deployments
  - `BIRDEYE_API_KEY`: For price data and token info
  - `LETSBONK_API_KEY`: For LetsBonk.fun (if required)

### Master Wallet

Set your master wallet's private key (base58 format):
```
SOLANA_KEYPAIR=YOUR_MASTER_WALLET_PRIVATE_KEY_BASE58
```

⚠️ **Security Note**: Keep your private keys secure and never commit them to version control.

## 🎮 Usage

### 1. Start the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

Access the application at `http://localhost:3000`

### 2. Initial Setup

1. **Configure API Keys**: Go to Settings and enter your API keys
2. **Create Wallets**: 
   - Navigate to Wallets
   - Create a new wallet group (e.g., 10 wallets)
   - Assign roles: 1 Master, 1 Dev, 8 Snipers
   - Set a strong password for wallet encryption

3. **Fund Wallets**:
   - Ensure your Master wallet has sufficient SOL
   - Use the "Fund" button to distribute SOL to sniper wallets
   - The app will randomly distribute the specified amount

### 3. Launch a Token

1. **Configure Token**:
   - Name, Symbol, Supply, Decimals
   - Choose platform (Pump.fun, LetsBonk, or Raydium)
   - Set initial liquidity amount

2. **Select Execution Mode**:
   - **Flash**: Best for competitive launches (uses Jito)
   - **Regular**: Standard fast execution
   - **Stealth**: Avoid detection with delays
   - **Manual**: Full control over timing

3. **Execute**:
   - Click "🔑 Execute Keymaker"
   - Monitor progress through the step indicator
   - Watch the live activity feed

### 4. Monitor & Manage

- **Activity Monitor**: See real-time buys/sells
- **Notifications**: Track all actions via the bell icon
- **Analytics**: View PnL, market cap, and performance
- **Sell Monitor**: Manage exits with configurable conditions

### 5. Exit Strategies

- **Auto-Sell**: Configure conditions (profit %, time, market cap)
- **Manual Sell**: Control individual wallet sells
- **Rug Pull** (Raydium only): Emergency exit with liquidity withdrawal

## 🛡️ Security

- All private keys are encrypted locally using AES-256-GCM
- No external telemetry or analytics
- Keys never leave your machine
- Password required for wallet operations
- Sentry and other tracking disabled by default

## 🏗️ Architecture

```
the-keymaker/
├── app/              # Next.js app directory
├── components/       # React components
├── services/         # Core business logic
├── lib/             # Utilities and store
├── bonk-mcp/        # Python backend for LetsBonk
└── data/            # Local SQLite database
```

### Key Services

- `bundleService`: Jito bundle execution
- `platformService`: Multi-platform token launches
- `walletService`: Secure wallet management
- `sellService`: Jupiter-powered token selling
- `rugService`: Raydium pool manipulation

## 🔧 Advanced Configuration

### Bundle Limits

- Maximum 20 wallets per session
- Jito bundles limited to 5 transactions (will batch if needed)
- Rate limits apply to RPC endpoints

### Custom RPC

You can use any Solana RPC by updating:
```env
NEXT_PUBLIC_HELIUS_RPC=https://your-rpc-endpoint.com
```

### Platform-Specific Notes

- **Pump.fun**: Requires API key, handles liquidity automatically
- **LetsBonk**: Uses Python backend, ensure Python environment is set up
- **Raydium**: Most complex but offers full control including rug functionality

## ⚠️ Risks & Disclaimers

- This tool is powerful and can result in financial loss if misused
- Rug pulling is unethical and may have legal consequences
- Always test on devnet first
- The authors are not responsible for any losses or misuse
- Use at your own risk

## 🐛 Troubleshooting

### Common Issues

1. **"No token launched yet"**: Ensure token creation completed successfully
2. **"Insufficient balance"**: Check Master wallet has enough SOL
3. **Bundle failures**: Verify Jito auth token and endpoint
4. **Python errors**: Check Python dependencies and SOLANA_KEYPAIR env

### Debug Mode

Enable debug logging:
```env
DEBUG=true
```

### Reset Database

```bash
rm data/analytics.db
npm run init-db
```

## 📚 Additional Resources

- [Jito Documentation](https://docs.jito.wtf)
- [Jupiter API Docs](https://docs.jup.ag)
- [Solana Cookbook](https://solanacookbook.com)

## 🤝 Support

For issues or questions:
1. Check existing documentation
2. Review error messages in the UI
3. Check browser console for detailed errors
4. Ensure all prerequisites are met

---

Built with ❤️ for the Solana ecosystem. Use responsibly.