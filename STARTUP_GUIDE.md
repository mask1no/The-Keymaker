# The Keymaker - Quick Start Guide for RPC Multi-Buy

## 🎯 Goal: First RPC Mode Multi-Buy with 8 Wallets

### Prerequisites Checklist

#### 1. Environment Configuration
- [ ] `.env` file exists (copy from `.env.example`)
- [ ] `HELIUS_RPC_URL` set with your API key
- [ ] `ENGINE_API_TOKEN` set (min 32 chars)
- [ ] `KEYMAKER_SESSION_SECRET` set (min 32 chars)
- [ ] `KEYPAIR_JSON` points to your payer keypair

#### 2. Wallet Setup
- [ ] Create wallet group with 8 wallets
- [ ] Wallets are funded with SOL
- [ ] Group set as active

#### 3. Token Target
- [ ] Have token mint address ready
- [ ] Know amount of SOL per wallet
- [ ] Understand slippage settings

---

## Step-by-Step Setup

### Step 1: Configure Environment

```bash
# Copy template if needed
cp .env.example .env

# Edit .env with your values
# Required:
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
ENGINE_API_TOKEN=your_random_32_char_token_here
KEYMAKER_SESSION_SECRET=another_random_32_char_secret
KEYPAIR_JSON=./keypairs/payer.json
```

### Step 2: Create Payer Keypair (if needed)

```bash
# Generate new keypair
solana-keygen new --outfile keypairs/payer.json

# Or use existing keypair
# Copy your keypair JSON to keypairs/payer.json
```

### Step 3: Start the Application

```bash
npm run dev
```

Server will start on: `http://localhost:3000` (or `PORT` from .env)

### Step 4: Create Wallet Group (Web Interface)

1. Open browser: `http://localhost:3000`
2. Navigate to: `/login` - Sign in with your wallet
3. Navigate to: `/wallets`
4. **Create Group**:
   - Name: `buy_group` (or any name)
   - Wallets: `8`
   - Click "Create Group"
5. **Set Active**: Set `buy_group` as active group

### Step 5: Fund Wallets

**Option A: Manual Funding**
```bash
# The wallet addresses are displayed on /wallets page
# Send SOL to each address from your main wallet
```

**Option B: Automated (coming soon)**
```bash
# Fund all wallets from payer
npm run fund-group -- --group buy_group --amount 0.1
```

### Step 6: Navigate to Engine (RPC Mode)

1. Go to: `http://localhost:3000/engine`
2. **Switch to RPC_FANOUT mode**:
   - Click the "Direct RPC" card
   - Verify mode shows "RPC_FANOUT"

### Step 7: Configure RPC Settings

On `/settings` page:
- **Mode**: RPC_FANOUT ✓
- **Concurrency**: 4-8 (adjust based on RPC limits)
- **Jitter Min/Max**: 50-150ms (randomization)
- **Dry Run**: OFF for live trades
- **Cluster**: mainnet-beta

### Step 8: Execute Multi-Buy

On `/engine` page (RPC_FANOUT mode):

1. **Manual RPC Controls** section appears
2. **Buy Now** form:
   - Token mint: `[paste token address]`
   - Amount SOL: `0.05` (per wallet, 8 wallets = 0.4 SOL total)
   - Click "Buy now"

### Step 9: Monitor Execution

Watch the **Last 10 Events** section:
- `rpcBuyNow` event logged
- Each wallet submission tracked
- Transaction signatures displayed

---

## Safety Checklist ⚠️

Before executing REAL trades:

### Pre-Flight Checks
- [ ] **DRY RUN FIRST**: Test with dry run enabled
- [ ] **Small amounts**: Start with 0.01 SOL per wallet
- [ ] **Verify token**: Double-check token mint address
- [ ] **Check balances**: Ensure all wallets have enough SOL
- [ ] **Test mode**: Try on devnet first if possible

### Arming System
- [ ] Understand arming: `KEYMAKER_ALLOW_LIVE=YES` required
- [ ] Arm the system: 15-minute windows
- [ ] Live trades only work when armed
- [ ] Dry run bypasses arming

### Risk Management
- [ ] **Start small**: 0.01-0.05 SOL per wallet
- [ ] **One token first**: Don't multi-buy multiple tokens
- [ ] **Monitor closely**: Watch transaction confirmations
- [ ] **Have exit plan**: Know when to sell

---

## Troubleshooting

### "No tracked wallets" error
**Solution**: Go to `/wallets` and create a group with 8 wallets

### "Wrong mode" error
**Solution**: Switch to RPC_FANOUT mode on `/engine`

### "Rate limit exceeded"
**Solution**: Reduce concurrency or increase jitter

### Transactions failing
**Possible causes**:
- Insufficient SOL in wallets
- RPC rate limiting
- Invalid token address
- Network congestion

**Solutions**:
- Check wallet balances
- Reduce concurrency
- Verify token mint
- Increase priority fee

### "Not armed" message
**If you want LIVE trades**:
1. Set `KEYMAKER_ALLOW_LIVE=YES` in .env
2. Go to `/engine`
3. Click "Arm 15m"
4. Trades work within 15-minute window

**If testing**:
- Keep Dry Run: ON
- No arming needed
- Simulates without spending

---

## Expected Flow

```
1. Create wallet group (8 wallets) → /wallets
2. Fund wallets with SOL
3. Go to /engine
4. Switch to RPC_FANOUT mode
5. Enter token mint + amount
6. Click "Buy now"
7. Watch events section for confirmations
8. Check wallet balances on Solana explorer
```

---

## Important Notes

### RPC_FANOUT Mode Characteristics:
- ✅ **Fast**: Concurrent execution
- ✅ **Flexible**: Individual wallet control
- ❌ **Not atomic**: Transactions may land in different blocks
- ❌ **No MEV protection**: Visible to front-runners

### Recommended Use Cases:
- ✅ Testing and development
- ✅ Non-time-critical buys
- ✅ Learning the system
- ⚠️ NOT for sniping (use JITO_BUNDLE instead)

### Cost Estimate:
```
8 wallets × 0.05 SOL = 0.4 SOL total
+ Gas fees (~0.000005 SOL per tx)
= ~0.4 SOL total cost
```

---

## Quick Command Reference

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check readiness
npm run readiness

# View logs
tail -f data/journal.$(date +%Y-%m-%d).ndjson

# Check wallet balances (CLI)
solana balance [wallet_address]
```

---

## Next Steps After First Buy

1. **Monitor positions**: Use Solana explorer
2. **Learn JITO mode**: For MEV-protected bundles
3. **Set sell conditions**: Partial sells (10%, 25%, 50%, 100%)
4. **Automate**: Build on the API

---

## Support

- Documentation: `md/PRD.md`, `md/OPS.md`
- Health check: `http://localhost:3000/api/health`
- Metrics: `http://localhost:3000/api/metrics`

**Remember**: Start with small amounts and dry run mode until comfortable!

---

*Ready to execute your first multi-wallet buy!* 🚀
