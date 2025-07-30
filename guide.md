# The Keymaker Bundle Engine Guide

## 🚀 Overview

The Keymaker Bundle Engine is a powerful tool for executing multiple Solana transactions as an atomic bundle using Jito MEV infrastructure. It supports both connected browser wallets and imported wallets with advanced features like role-based prioritization and automatic fallback mechanisms.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Wallet Management](#wallet-management)
5. [Creating Bundles](#creating-bundles)
6. [Execution Strategies](#execution-strategies)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)

## Prerequisites

### Required Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
NEXT_PUBLIC_BIRDEYE_API_KEY=YOUR_BIRDEYE_API_KEY
```

### Wallet Requirements

- **Connected Wallet**: Must have sufficient SOL for transaction fees and Jito tips
- **Imported Wallets**: Must be properly encrypted and stored in wallet groups

## Quick Start

1. **Access the Bundle Engine**
   - Navigate to http://localhost:3000/dashboard/bundle
   - Connect your Solana wallet (Phantom, Solflare, etc.)

2. **Create Your First Bundle**
   ```
   Token Address: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC)
   Amount: 0.1 (SOL for buying)
   Slippage: 5%
   Priority Fee: 0.00001 SOL
   Action: Buy
   ```

3. **Execute the Bundle**
   - Click "Add to Bundle"
   - Click "Preview Bundle" to simulate
   - Click "Execute Bundle" or press `Ctrl+Enter`

## Features

### 🎯 Multi-Wallet Support

The bundler supports three wallet modes:

1. **Connected Wallet Only**
   - Uses your browser wallet for all transactions
   - No password required
   - Simplest option for single-wallet operations

2. **Imported Wallets**
   - Use wallets created/imported in Wallet Manager
   - Requires password for decryption
   - Enables multi-wallet strategies

3. **Mixed Mode**
   - Combine connected and imported wallets
   - Maximum flexibility for complex strategies

### 🔄 Transaction Types

#### Buy Transactions
- Swap SOL for tokens
- Amount specified in SOL
- Automatic wrapping of SOL to WSOL

#### Sell Transactions
- Swap tokens for SOL
- Amount specified in tokens
- Automatic unwrapping of WSOL to SOL

### ⚡ Role-Based Prioritization

Transactions are automatically sorted by wallet role:

1. **Sniper** (Highest Priority)
   - Executes first in bundle
   - For time-sensitive operations
   - Red badge indicator

2. **Dev** (Medium Priority)
   - Executes after sniper transactions
   - For development/testing
   - Secondary badge indicator

3. **Normal** (Standard Priority)
   - Executes last
   - For regular operations
   - Default badge indicator

## Wallet Management

### Creating Wallet Groups

1. Navigate to Wallet Manager
2. Create new wallets with specific roles
3. Fund wallets as needed
4. Group wallets for organized management

### Importing Existing Wallets

```
1. Go to Wallet Manager
2. Click "Import Wallet"
3. Paste private key (base58 or array format)
4. Set password for encryption
5. Assign role (sniper/dev/normal)
```

### Security Best Practices

- Use strong passwords for wallet encryption
- Never share encrypted wallet data
- Export wallet groups for backup
- Regularly rotate sniper wallets

## Creating Bundles

### Basic Bundle Example

```javascript
// Buy 0.5 SOL worth of TOKEN_A
Transaction 1:
- Token: TOKEN_A_ADDRESS
- Amount: 0.5 SOL
- Slippage: 5%
- Wallet: Connected
- Action: Buy

// Sell all TOKEN_A for SOL
Transaction 2:
- Token: TOKEN_A_ADDRESS
- Amount: [token balance]
- Slippage: 10%
- Wallet: Connected
- Action: Sell
```

### Advanced Multi-Wallet Bundle

```javascript
// Sniper wallet buys first
Transaction 1:
- Token: NEW_TOKEN
- Amount: 1 SOL
- Wallet: Sniper Wallet
- Priority Fee: 0.001 SOL

// Dev wallets follow
Transaction 2-5:
- Token: NEW_TOKEN
- Amount: 0.5 SOL each
- Wallet: Dev Wallets 1-4
- Priority Fee: 0.0001 SOL

// Normal wallets last
Transaction 6-10:
- Token: NEW_TOKEN
- Amount: 0.1 SOL each
- Wallet: Normal Wallets 1-5
```

## Execution Strategies

### 1. Jito MEV Bundle Submission

Primary execution method:
- Bundles sent to Jito block engine
- Includes tip for priority inclusion
- Atomic execution (all or nothing)
- 2-3 slot target window

### 2. Automatic Fallback

If Jito fails:
- Switches to standard RPC submission
- Executes transactions individually
- Higher failure risk but ensures attempt

### 3. Preview & Simulation

Always preview before executing:
- Validates all transactions
- Shows compute units usage
- Identifies potential failures
- Displays simulation logs

## Troubleshooting

### Common Issues

1. **"Insufficient Balance" Error**
   - Ensure wallet has enough SOL for fees
   - Account for ~0.001 SOL per transaction
   - Add extra for Jito tip (0.00001 SOL)

2. **"Invalid Token Address" Error**
   - Verify token mint address
   - Use Solscan to confirm token exists
   - Check token has sufficient liquidity

3. **"Password Invalid" Error**
   - Ensure correct password for wallet group
   - Password is case-sensitive
   - Try re-importing wallet if persistent

4. **Bundle Execution Failures**
   - Check simulation results first
   - Reduce bundle size (max 20 txs)
   - Increase slippage for volatile tokens
   - Add higher priority fees

### Debug Mode

Enable console logs:
```javascript
// Browser Console
localStorage.setItem('debug', 'bundle:*')
```

## Advanced Usage

### Custom Priority Fees

Calculate optimal fees:
```
Base: 0.00001 SOL (minimum)
High Priority: 0.0001 - 0.001 SOL
Ultra Priority: 0.001 - 0.01 SOL
```

### Bundle Timing

Optimal submission windows:
- Avoid high congestion periods
- Monitor Solana TPS
- Use during stable network conditions

### Export Execution Logs

1. Click "Export Log" button
2. Review JSON file for:
   - Bundle IDs
   - Transaction signatures
   - Success/failure status
   - Execution metrics

### Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Execute bundle
- `Escape`: Close dialogs
- `Tab`: Navigate form fields

## Best Practices

1. **Start Small**
   - Test with minimal amounts
   - Verify wallet permissions
   - Check token liquidity

2. **Monitor Gas**
   - Keep extra SOL for fees
   - Adjust priority fees based on network
   - Use simulation to estimate costs

3. **Security**
   - Never share wallet passwords
   - Verify token addresses
   - Double-check amounts
   - Review preview results

4. **Performance**
   - Limit bundles to 10-15 transactions
   - Group similar operations
   - Use appropriate slippage

## Example Strategies

### 1. Token Launch Sniping
```
- Sniper wallet: Large initial buy
- Dev wallets: Medium buys
- Normal wallets: Small buys
- All within same bundle for atomic execution
```

### 2. DCA (Dollar Cost Averaging)
```
- Multiple small buys
- Different wallets for privacy
- Scheduled execution
- Lower slippage tolerance
```

### 3. Arbitrage Bundle
```
- Buy on DEX A
- Sell on DEX B
- Single atomic bundle
- High priority fees
- Tight slippage
```

## Support & Resources

- **Helius RPC**: https://helius.xyz/
- **Jito Labs**: https://jito.wtf/
- **Birdeye API**: https://birdeye.so/
- **Solscan**: https://solscan.io/

## Conclusion

The Keymaker Bundle Engine provides professional-grade transaction bundling with enterprise features. Start with simple single-wallet bundles and progress to complex multi-wallet strategies as you gain experience.

Remember: Always simulate before executing and never invest more than you can afford to lose.

---

*Last Updated: December 2024*
*Version: 1.0.0* 