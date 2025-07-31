# The Keymaker - User Guide

This guide walks you through using The Keymaker bundler from start to finish.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Wallet Management](#wallet-management)
3. [Token Launch](#token-launch)
4. [Bundle Execution](#bundle-execution)
5. [Monitoring & Selling](#monitoring--selling)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)

## Initial Setup

### Step 1: Configure API Keys

After starting the application, navigate to **Settings** in the sidebar.

Enter your API keys:
- **Helius RPC URL**: Full URL including API key
- **Birdeye API Key**: For token price data
- **Pump.fun API Key**: If using Pump.fun platform
- **Other APIs**: As needed

Click **Save Settings**.

### Step 2: Import or Create Master Wallet

Go to **Wallets** in the sidebar.

**Option A: Import Existing Wallet**
1. Click "Import Wallet"
2. Enter your private key (base58 format)
3. Set role as "Master"
4. Enter a strong password

**Option B: Create New Wallet**
1. Click "Create Wallet"
2. Set role as "Master"
3. Save the generated private key securely
4. Enter a strong password

The Master wallet needs SOL for:
- Creating tokens (~0.01-0.1 SOL)
- Funding sniper wallets
- Transaction fees

### Step 3: Create Sniper Wallets

1. Click "Create Wallet Group"
2. Enter number of wallets (e.g., 10)
3. Enter password for encryption
4. Click "Create"

The app will generate wallets with roles:
- First wallet: Master (if not already exists)
- Rest: Sniper wallets for bundle execution

## Wallet Management

### Funding Wallets

1. Ensure Master wallet has sufficient SOL
2. Select wallets to fund (usually all snipers)
3. Click "Fund Selected"
4. Enter total SOL to distribute (e.g., 5 SOL)
5. Set min/max per wallet (e.g., 0.3-0.7 SOL)
6. Click "Fund Wallets"

The app randomly distributes SOL to make wallets look organic.

### Managing Roles

- **Master**: Pays for operations, holds main funds
- **Dev**: Can hold dev allocation tokens
- **Sniper**: Executes bundle buys
- **Normal**: Standard wallet for misc operations

Click the role badge next to any wallet to change it.

## Token Launch

### Step 1: Configure Token

Go to **Create** in the sidebar.

Fill in token details:
- **Name**: Full token name
- **Symbol**: 3-10 character ticker
- **Supply**: Total supply (e.g., 1,000,000,000)
- **Decimals**: 6 for LetsBonk, 9 for others
- **Platform**: Choose your launch platform

### Step 2: Choose Platform

**Pump.fun**
- Easiest setup
- Automatic liquidity
- Requires API key
- Good for quick launches

**LetsBonk.fun**
- Python backend required
- Lower fees
- Good liquidity
- Recommended for most users

**Raydium**
- Full control
- Can rug (freeze/withdraw liquidity)
- More complex
- For advanced users

### Step 3: Set Liquidity

Enter initial SOL for liquidity pool:
- Pump.fun: Handled automatically
- LetsBonk: 1-5 SOL typical
- Raydium: 5-20 SOL for good liquidity

### Step 4: Launch Token

1. Review all details
2. Click "Launch Token"
3. Enter wallet password
4. Wait for confirmation
5. Save the token mint address!

## Bundle Execution

### Step 1: Choose Execution Mode

In **Control Center**:

**Flash Mode (Jito)**
- All transactions in one slot
- Atomic execution
- Best for competitive launches
- Costs 0.01 SOL tip to Jito

**Regular Mode**
- Fast sequential execution
- No Jito fees
- Good for less competitive tokens

**Stealth Mode**
- 2-5 second delays between transactions
- Avoids detection
- Good for organic-looking buys

**Manual Mode**
- Prepares transactions only
- You control timing
- Best for chart painting

### Step 2: Configure Bundle

Check pre-flight:
- ✅ Master wallet funded
- ✅ Sniper wallets funded
- ✅ Token launched
- ✅ Jito enabled (for Flash mode)

### Step 3: Execute

1. Click "🔑 Execute Keymaker"
2. Enter password if prompted
3. Monitor progress:
   - 🚀 Deploy Token
   - 💰 Fund Wallets
   - ⏱️ Wait for settlement
   - 📦 Bundle Buys
   - ⏱️ Wait period
   - 💸 Sell (if auto-sell enabled)

### Step 4: Monitor Execution

Watch the step-by-step progress:
- Green checkmarks = success
- Red X = failure
- View transaction links in activity

## Monitoring & Selling

### Activity Monitor

Click **Activity** button to see live transactions:
- Green up arrow = buys
- Red down arrow = sells
- "OURS" badge = your wallets
- Others' trades show in grey

### Notifications

Click the bell icon (🔔) to see:
- Token launch confirmations
- Funding completions
- Bundle execution results
- Errors and warnings

### Sell Monitor

Go to **Sell Monitor** to manage exits:

**Auto-Sell Conditions**
- Profit target: e.g., 100% gain
- Stop loss: e.g., -50% loss
- Time limit: e.g., sell after 10 minutes
- Market cap target: e.g., $1M

**Manual Selling**
1. View each wallet's holdings
2. Check current price/profit
3. Click "Sell" on individual wallets
4. Or use "Sell All" for quick exit

### PnL Tracking

View **Analytics** for:
- Total invested vs returned
- Per-wallet profit/loss
- Historical performance
- Export data as CSV

## Advanced Features

### Rug Pull (Raydium Only)

⚠️ **Warning**: Unethical and potentially illegal. Use only on your own test tokens.

1. Ensure you have freeze authority
2. Go to token details
3. Click "Rug" button
4. Confirm action
5. Pool is frozen and liquidity withdrawn

### Custom Slippage

For volatile tokens:
1. Go to Settings
2. Adjust default slippage (1-50%)
3. Higher slippage = more likely to succeed
4. Lower slippage = better price

### Bundle Optimization

For best results:
- Use 5-10 wallets per bundle
- Fund wallets with varying amounts
- Use different execution modes
- Monitor gas prices

## Best Practices

### Security

1. **Never share your password**
2. **Keep private keys offline**
3. **Use a dedicated computer**
4. **Don't log into public WiFi**
5. **Clear browser data after use**

### Token Launch Tips

1. **Test on devnet first**
2. **Have extra SOL for fees**
3. **Launch during active hours**
4. **Monitor initial price action**
5. **Have exit strategy ready**

### Bundle Execution

1. **Start small** - Test with 3-5 wallets
2. **Vary amounts** - Don't use round numbers
3. **Time it right** - Avoid network congestion
4. **Monitor closely** - Be ready to sell
5. **Take profits** - Don't be greedy

### Risk Management

1. **Only invest what you can lose**
2. **Set stop losses**
3. **Take partial profits**
4. **Don't chase pumps**
5. **Keep records for taxes**

## Troubleshooting

### "Transaction Failed"
- Check wallet balances
- Increase slippage
- Try smaller amounts
- Wait and retry

### "No Route Found"
- Token may have no liquidity
- Try different amount
- Check if pool exists

### "Insufficient SOL"
- Each transaction needs ~0.001-0.005 SOL
- Jito bundles need 0.01 SOL tip
- Keep extra for fees

### "Bundle Not Landing"
- Increase Jito tip
- Reduce bundle size
- Try different time
- Check Jito status

## Example Workflow

1. **Setup** (One time)
   - Configure API keys
   - Create master wallet
   - Generate 10 sniper wallets

2. **Launch Day**
   - Fund master with 20 SOL
   - Distribute 10 SOL to snipers
   - Launch token with 5 SOL liquidity
   - Execute Flash bundle
   - Monitor for 5 minutes
   - Take 50% profits
   - Let rest ride with stop loss

3. **Exit**
   - Set 10-minute timer
   - Sell remaining positions
   - Consolidate SOL to master
   - Export PnL report

---

Remember: This is a powerful tool. Use responsibly and understand the risks. Always test with small amounts first. 