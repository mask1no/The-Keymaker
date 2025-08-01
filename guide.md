# The Keymaker - Comprehensive User Guide

This guide walks you through using The Keymaker bundler from initial setup to advanced features, including 24/7 Docker deployment.

## Table of Contents

1. [Quick Start with Docker](#quick-start-with-docker)
2. [Initial Setup](#initial-setup)
3. [Wallet Management](#wallet-management)
4. [Token Launch](#token-launch)
5. [Bundle Execution](#bundle-execution)
6. [Monitoring & Selling](#monitoring--selling)
7. [Advanced Features](#advanced-features)
8. [Docker Management](#docker-management)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Git for cloning the repository
- API keys from required services

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/the-keymaker.git
cd the-keymaker

# Copy environment example
cp env.example .env.local
```

### Step 2: Configure API Keys

Edit `docker-compose.override.yml`:

```yaml
services:
  keymaker:
    environment:
      # Your Helius RPC endpoint with API key
      NEXT_PUBLIC_HELIUS_RPC: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
      RPC_URL: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
      
      # Birdeye API for token data
      NEXT_PUBLIC_BIRDEYE_API_KEY: YOUR_BIRDEYE_KEY
      BIRDEYE_API_KEY: YOUR_BIRDEYE_KEY
      
      # Pump.fun API for token launches
      NEXT_PUBLIC_PUMPFUN_API_KEY: YOUR_PUMPFUN_KEY
      PUMPFUN_API_KEY: YOUR_PUMPFUN_KEY
```

### Step 3: Launch the Bundler

```bash
# Build and start in background
docker-compose up -d

# Wait for startup (check logs)
docker-compose logs -f keymaker

# Access at http://localhost:3000
```

Your bundler is now running 24/7!

## Initial Setup

### Step 1: Access the Application

Open your browser and navigate to:
- **Docker**: http://localhost:3000
- **Local Dev**: http://localhost:3000

### Step 2: Configure Settings

1. Click **Settings** in the sidebar
2. Verify your API keys are loaded
3. Configure any additional settings:
   - Default slippage (recommended: 1-2%)
   - Priority fees (recommended: 0.0005 SOL)
   - Bundle preferences

### Step 3: Import Master Wallet

1. Navigate to **Wallets** in the sidebar
2. Click **Import Wallet**
3. Enter your wallet details:
   - **Private Key**: Base58 format (starts with numbers/letters)
   - **Role**: Select "Master"
   - **Password**: Strong password for encryption
4. Click **Import**

⚠️ **Security Note**: Your private key is encrypted locally with AES-256-GCM

### Step 4: Fund Master Wallet

Ensure your Master wallet has sufficient SOL:
- **Token Creation**: 0.1-1 SOL per platform
- **Sniper Funding**: 0.3-0.7 SOL per wallet
- **Transaction Fees**: 0.05 SOL buffer
- **Jito Tips**: 0.001-0.01 SOL per bundle

## Wallet Management

### Creating Sniper Wallets

1. Click **Create Wallet Group**
2. Configure the group:
   - **Number of Wallets**: 5-20 (recommended: 10)
   - **Password**: Same or different from master
3. Click **Create**

The system will:
- Generate secure keypairs
- Encrypt private keys
- Assign "Sniper" role automatically
- Display public keys for funding

### Funding Wallets

1. Select wallets to fund (checkboxes)
2. Click **Fund Selected**
3. Configure funding:
   - **Total Amount**: e.g., 5 SOL
   - **Min per Wallet**: e.g., 0.3 SOL
   - **Max per Wallet**: e.g., 0.7 SOL
4. Click **Fund Wallets**

The system randomly distributes SOL to appear organic.

### Managing Wallets

- **Export**: Click wallet address to copy
- **View Balance**: Real-time SOL balance
- **Delete**: Remove wallet (requires password)
- **Roles**:
  - **Master**: Pays for token creation
  - **Dev**: Optional dev wallet
  - **Sniper**: Executes bundle buys

## Token Launch

### Step 1: Navigate to Create

Click **Create** in the sidebar to access the token launcher.

### Step 2: Select Platform

Choose your launch platform:

#### Pump.fun
- **Pros**: Easy, automatic liquidity, built-in bonding curve
- **Cons**: Requires API key, limited customization
- **Cost**: ~0.02 SOL

#### LetsBonk.fun
- **Pros**: Lower fees, Python backend
- **Cons**: Less popular, requires Python setup
- **Cost**: ~0.01 SOL

#### Raydium
- **Pros**: Full control, rug capability, high volume
- **Cons**: Complex, higher cost
- **Cost**: ~0.1-0.5 SOL

### Step 3: Configure Token

Fill in token details:

```
Name: My Token
Symbol: MTK
Supply: 1000000000 (1 billion)
Decimals: 9 (standard)
Initial Buy: 1 SOL
```

Platform-specific options:
- **Pump.fun**: Nothing extra needed
- **LetsBonk**: Python backend must be running
- **Raydium**: LP tokens, freeze authority options

### Step 4: Preview

Click **Preview** to see:
- Token configuration
- Estimated costs
- Selected wallets
- Bundle structure

## Bundle Execution

### Understanding Execution Modes

#### Flash Mode (Jito)
```
Speed: ⚡⚡⚡⚡⚡
Security: High
Cost: Higher (Jito tips)
Use: Competitive launches
```
- Atomic execution in same slot
- MEV protection
- Requires Jito tips (0.001-0.01 SOL)

#### Regular Mode
```
Speed: ⚡⚡⚡⚡
Security: Medium
Cost: Standard
Use: General purpose
```
- Sequential fast execution
- No bundling overhead
- Good for less competitive scenarios

#### Stealth Mode
```
Speed: ⚡⚡
Security: High
Cost: Standard
Use: Avoid detection
```
- Random 2-5 second delays
- Mimics organic buying
- Good for established tokens

#### Manual Mode
```
Speed: User controlled
Security: Highest
Cost: Standard
Use: Full control
```
- Prepare transactions only
- Execute when ready
- Maximum flexibility

### Executing the Bundle

1. Select your execution mode
2. Review the bundle preview
3. Click **🔑 Execute Keymaker**
4. Monitor progress:
   - Token Creation ✓
   - Wallet Funding ✓
   - Bundle Execution ✓
   - Completion ✓

### Monitoring Execution

Watch real-time updates:
- **Step Indicator**: Visual progress
- **Activity Feed**: Live transactions
- **Notifications**: Success/failure alerts
- **Console**: Detailed logs

## Monitoring & Selling

### Activity Monitor

Access via **Activity** in sidebar:
- Real-time buy/sell feed
- Transaction details
- Wallet performance
- Volume tracking

### PnL Dashboard

Track your profits:
- Entry/exit prices
- Total invested/returned
- Percentage gains
- Hold time analytics

### Sell Monitor

Configure auto-sell conditions:

1. **Profit Target**
   ```
   Target: 200% (2x)
   Action: Sell 50% of holdings
   ```

2. **Stop Loss**
   ```
   Trigger: -30%
   Action: Sell all
   ```

3. **Time-based**
   ```
   After: 24 hours
   Action: Gradual sell 20% per hour
   ```

### Manual Selling

1. Navigate to **Sell Monitor**
2. Select token and wallets
3. Choose sell strategy:
   - Market sell (immediate)
   - Limit sell (price target)
   - Gradual (time-based)
4. Execute sells

## Advanced Features

### Rug Pull (Raydium Only)

⚠️ **Warning**: Use responsibly

1. Ensure you have LP tokens
2. Navigate to **Rug** section
3. Select options:
   - Freeze trading
   - Withdraw liquidity
   - Burn LP tokens
4. Execute rug

### Bundle Optimization

Tips for better execution:
- Use 10-15 wallets for optimal distribution
- Vary buy amounts (0.5-2 SOL)
- Add priority fees in congested times
- Use Flash mode for competitive launches

### Analytics

Access detailed metrics:
- Success rates by mode
- Average slippage
- Gas optimization
- Wallet performance

## Docker Management

### Basic Commands

```bash
# Start bundler
docker-compose up -d

# Stop bundler
docker-compose down

# View logs
docker-compose logs -f keymaker

# Restart
docker-compose restart

# Check status
docker-compose ps
```

### Updating the Bundler

```bash
# Stop current instance
docker-compose down

# Pull latest changes
git pull origin main

# Rebuild
docker-compose build --no-cache

# Start updated version
docker-compose up -d
```

### Backup and Restore

#### Backup
```bash
# Backup database and wallets
cp -r data/ backup_$(date +%Y%m%d)/
```

#### Restore
```bash
# Stop bundler
docker-compose down

# Restore data
cp -r backup_20250801/* data/

# Start bundler
docker-compose up -d
```

### Resource Management

Monitor resource usage:
```bash
# Check container stats
docker stats keymaker-prod

# View disk usage
docker system df

# Clean up old images
docker system prune -a
```

## Troubleshooting

### Common Issues

#### "Container Unhealthy"
- **Cause**: Health endpoint returns 503
- **Solution**: Normal - check logs instead
- **Command**: `docker-compose logs keymaker`

#### "Transaction Failed"
- **Causes**:
  - Insufficient SOL
  - Slippage too low
  - Network congestion
- **Solutions**:
  - Add more SOL to wallets
  - Increase slippage to 2-5%
  - Increase priority fees

#### "API Rate Limited"
- **Cause**: Too many requests
- **Solutions**:
  - Upgrade to premium tier
  - Add delays between operations
  - Use different RPC endpoint

#### "Module Not Found"
- **Cause**: Dependencies issue
- **Solution**: Rebuild container
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Debug Mode

Enable detailed logging:
1. Edit `docker-compose.override.yml`
2. Add `DEBUG: "true"` to environment
3. Restart container

### Database Issues

Reset database:
```bash
# Stop container
docker-compose down

# Remove database
rm data/keymaker.db

# Start (will auto-create)
docker-compose up -d
```

## Best Practices

### Security
1. **Never share private keys**
2. **Use strong passwords**
3. **Keep Docker updated**
4. **Regular backups**
5. **Monitor logs for anomalies**

### Performance
1. **Use Helius RPC for reliability**
2. **10-15 wallets optimal**
3. **Vary transaction amounts**
4. **Monitor gas prices**
5. **Use Flash mode wisely**

### Trading
1. **Start with small amounts**
2. **Test strategies first**
3. **Set stop losses**
4. **Take profits gradually**
5. **Monitor market conditions**

### Maintenance
1. **Weekly backups**
2. **Update dependencies monthly**
3. **Clean Docker images**
4. **Review logs regularly**
5. **Update API keys as needed**

## Advanced Configuration

### Custom RPC Endpoints

Add multiple RPCs for failover:
```yaml
environment:
  RPC_PRIMARY: https://your-primary-rpc.com
  RPC_BACKUP: https://your-backup-rpc.com
```

### Performance Tuning

Optimize for your needs:
```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'    # Increase for more power
      memory: 8G     # Increase for large operations
```

### Network Configuration

For remote access:
```yaml
ports:
  - "0.0.0.0:3000:3000"  # Allow external access
```

Then access via: `http://your-server-ip:3000`

---

## 🎯 Quick Reference

### Minimum SOL Requirements
- **Master Wallet**: 2-5 SOL
- **Per Sniper**: 0.3-0.7 SOL
- **Token Creation**: 0.01-0.5 SOL
- **Buffer**: 0.1 SOL

### Recommended Settings
- **Wallets**: 10-15
- **Slippage**: 1-2%
- **Priority Fee**: 0.0005 SOL
- **Jito Tip**: 0.001-0.01 SOL

### Time Estimates
- **Docker Build**: 4-5 minutes
- **Token Launch**: 1-2 minutes
- **Bundle Execution**: 5-30 seconds
- **Selling**: Variable

---

**Need Help?** Check [SUMMARY.md](./SUMMARY.md) for technical details or [README.md](./README.md) for quick setup. 