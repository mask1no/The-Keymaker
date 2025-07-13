# The Keymaker

## Overview
The Keymaker is a Solana-exclusive dApp for transaction bundling and memecoin launching, surpassing competitors like Coinwave.gg and Kinesis.gg.

## Features
- Wallet management (creation, funding, sending SOL)
- Memecoin creation and cloning
- Transaction bundling with Jito MEV protection
- Sniping on platforms like Pump.fun
- Analytics with live prices (SOL/ETH/BTC/CAKE) and PnL tracking via SQLite

## Final Features
- Secure wallet management with roles and encryption
- Transaction bundling with Jito MEV
- Memecoin creation/cloning on multiple platforms
- Real-time analytics and PnL tracking
- System status monitoring
- Error boundary and toasts

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/project?repository-url=https://github.com/your-repo/the-keymaker)

## Setup
1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Copy and configure environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
4. For Windows setup:
   ```powershell
   .\setup.ps1
   ```
5. Docker alternative:
   ```bash
   docker build -t keymaker .
   docker run -p 3000:3000 keymaker
   ```
6. Test:
   ```bash
   npm run test
   ```
7. Deploy to Vercel:
   ```bash
   npm run build && vercel deploy
   ```

## Troubleshooting
- **Internal Server Error**: Check terminal logs, ensure .env.local is configured, run setup.ps1 for Windows.
- **ERESOLVE conflicts**: Use --legacy-peer-deps flag.
- **OneDrive locks**: setup.ps1 copies project to avoid sync issues.

## Demo
Watch the demo video: [YouTube Link](https://youtube.com)
Or see assets/demo.gif for a quick overview of wallet connect, bundling, and analytics. 