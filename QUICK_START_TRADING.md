# 🚀 Keymaker - Quick Start Trading Guide

## Status: ✅ PRODUCTION READY - Use Today!

---

## What You Can Do Right Now

### ✅ Multi-Wallet Buy/Sell (Jupiter V6)
- Buy tokens across up to 20 wallets simultaneously
- Sell 50%, 100%, or all positions
- Automatic price impact caps
- Idempotent (no double-spends)

### ✅ Volume Bot (Buy-Biased Automation)
- Automated buy/sell with 2:1 bias
- Random amounts and delays
- Automatic stop caps

### ✅ pump.fun Token Creation
- Create new tokens on pump.fun
- Automatic bonding curve interaction

### ✅ P&L Tracking
- FIFO accounting with fees
- CSV export

---

## 3-Minute Setup

### 1. Configure Environment
```bash
cp env.example .env
# Edit .env and set:
# - KEYPAIR_JSON=/path/to/payer.json
# - KEYMAKER_SESSION_SECRET=$(openssl rand -hex 32)
# - HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### 2. Install & Run
```bash
pnpm install
pnpm run build
pnpm start
```

### 3. Login
- Open http://localhost:3000/login
- Connect Phantom wallet
- Sign the message (no transaction, just auth)

---

## Your Workflow (pump.fun → Multi-Wallet → Sell)

### Step 1: Create pump.fun Token
```bash
curl -X POST http://localhost:3000/api/coin/create/pumpfun \
  -H "Content-Type: application/json" \
  -H "Cookie: km_session=YOUR_SESSION" \
  -d '{
    "name": "My Token",
    "symbol": "MTK",
    "uri": "https://your-metadata-uri.com/metadata.json"
  }'

# Response: { "success": true, "mint": "ABC...XYZ", "signature": "..." }
```

### Step 2: Create & Fund 8 Wallets

**A. Create wallets in UI:**
- Go to /wallets
- Click "Create Wallet" 8 times
- Save wallet addresses

**B. Fund wallets:**
```bash
curl -X POST http://localhost:3000/api/wallets/fund \
  -H "Content-Type: application/json" \
  -H "Cookie: km_session=YOUR_SESSION" \
  -d '{
    "walletPubkeys": ["wallet1", "wallet2", ..., "wallet8"],
    "strategy": "per_wallet",
    "perWalletSol": 0.1,
    "dryRun": false
  }'
```

### Step 3: Multi-Wallet Buy
```bash
curl -X POST http://localhost:3000/api/engine/buy \
  -H "Content-Type: application/json" \
  -H "Cookie: km_session=YOUR_SESSION" \
  -d '{
    "mint": "ABC...XYZ",
    "walletPubkeys": ["wallet1", ..., "wallet8"],
    "perWalletSol": 0.05,
    "slippageBps": 300,
    "impactCapPct": 5,
    "password": "your_wallet_password",
    "dryRun": false
  }'

# Response: { "success": true, "results": [...], "summary": {...} }
```

### Step 4: Start Volume Bot (2 wallets)

**A. Create volume profile** (in database or via API - TBD):
```sql
INSERT INTO volume_profiles (
  name, mint, wallet_pubkeys,
  buy_sell_bias, min_buy_sol, max_buy_sol,
  min_sell_pct, max_sell_pct,
  delay_sec_min, delay_sec_max,
  max_actions, max_spend_sol
) VALUES (
  'My Volume Bot',
  'ABC...XYZ',
  '["wallet9", "wallet10"]',
  2.0, 0.01, 0.05,
  10, 30,
  30, 120,
  100, 2.0
);
```

**B. Start volume bot:**
```bash
curl -X POST http://localhost:3000/api/volume/start \
  -H "Content-Type: application/json" \
  -H "Cookie: km_session=YOUR_SESSION" \
  -d '{
    "profileId": 1,
    "password": "your_wallet_password"
  }'

# Response: { "success": true, "runId": 1, "status": "running" }
```

**C. Monitor:**
```bash
curl http://localhost:3000/api/volume/status?runId=1 \
  -H "Cookie: km_session=YOUR_SESSION"
```

**D. Stop:**
```bash
curl -X POST http://localhost:3000/api/volume/stop \
  -H "Content-Type: application/json" \
  -H "Cookie: km_session=YOUR_SESSION" \
  -d '{"runId": 1}'
```

### Step 5: Sell All
```bash
curl -X POST http://localhost:3000/api/engine/sellAll \
  -H "Content-Type: application/json" \
  -H "Cookie: km_session=YOUR_SESSION" \
  -d '{
    "mint": "ABC...XYZ",
    "walletPubkeys": ["wallet1", ..., "wallet10"],
    "slippageBps": 300,
    "password": "your_wallet_password",
    "dryRun": false
  }'

# Response: { "success": true, "results": [...] }
```

### Step 6: Export P&L
```bash
curl http://localhost:3000/api/pnl/export \
  -H "Cookie: km_session=YOUR_SESSION" \
  > pnl-report.csv
```

---

## Using the UI (Easier Than API)

### 1. Login
- Go to http://localhost:3000/login
- Connect Phantom
- Sign message

### 2. Create Wallets
- Navigate to /wallets
- Create 10 wallets (8 for buying, 2 for volume)
- **Important:** Remember the password you set!

### 3. Fund Wallets
- Use the fund API or manually send SOL

### 4. Trade
- Go to /engine
- Use the **TradingPanel** component:
  - Enter mint address (your pump.fun token)
  - Enter wallet addresses (comma-separated)
  - Enter SOL amount per wallet
  - Enter password
  - Click "Buy" button

### 5. Sell
- Same panel, click "Sell 50%" or "Sell All Positions"

---

## Advanced Features

### Dry Run (Simulation)
All endpoints support `"dryRun": true` to simulate without sending:
```json
{
  "mint": "...",
  "walletPubkeys": ["..."],
  "perWalletSol": 0.1,
  "dryRun": true  // ← Simulation only
}
```

### Price Impact Cap
Automatically enforces maximum slippage:
```json
{
  "impactCapPct": 5  // Max 5% price impact
}
```

### Custom Slippage
```json
{
  "slippageBps": 300  // 3% slippage (300 basis points)
}
```

---

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in at /login
- Session expires after 24 hours

### "Rate limit exceeded"
- Wait 30 seconds and try again
- Per-session limit: 30 requests/30 seconds

### "Invalid password"
- Use the same password you set when creating wallets
- Password is used to decrypt private keys

### "Wallet not found"
- Verify wallet addresses are correct
- Check /wallets page for your wallet list

### "Price impact exceeds cap"
- Reduce amount or increase impactCapPct
- Token may have low liquidity

---

## What's Under the Hood

### Transaction Flow
1. **Load wallets** from DB (encrypted)
2. **Decrypt** with password
3. **Check migration** (pump.fun curve vs Jupiter)
4. **Get quote** and check price impact
5. **Build TX** (VersionedTransaction)
6. **Check idempotency** (dedupe by msgHash)
7. **Simulate** transaction
8. **Send** and confirm
9. **Record** trade in database

### Safety Features
- ✅ Transaction simulation before send
- ✅ Idempotency (no double-spends)
- ✅ Per-mint locking (1.5s gap)
- ✅ Per-wallet serialization (100ms gap)
- ✅ Price impact caps
- ✅ Comprehensive error handling

---

## Example: Complete Workflow in 5 Minutes

```bash
# 1. Create token (returns mint address)
MINT=$(curl -X POST localhost:3000/api/coin/create/pumpfun -H "..." -d '{...}' | jq -r .mint)

# 2. Buy with 8 wallets (0.05 SOL each = 0.4 SOL total)
curl -X POST localhost:3000/api/engine/buy -H "..." -d "{\"mint\":\"$MINT\", \"walletPubkeys\":[...], \"perWalletSol\":0.05, \"password\":\"...\", \"dryRun\":false}"

# 3. Start volume bot (2 wallets, 2:1 buy bias)
curl -X POST localhost:3000/api/volume/start -H "..." -d '{"profileId":1, "password":"..."}'

# 4. Wait for volume activity...
sleep 300  # 5 minutes

# 5. Stop volume bot
curl -X POST localhost:3000/api/volume/stop -H "..." -d '{"runId":1}'

# 6. Sell all positions
curl -X POST localhost:3000/api/engine/sellAll -H "..." -d "{\"mint\":\"$MINT\", \"walletPubkeys\":[all 10 wallets], \"password\":\"...\", \"dryRun\":false}"

# 7. Export P&L
curl localhost:3000/api/pnl/export -H "..." > pnl.csv
```

---

## 🎉 You're Ready!

The system is **production-ready** and can handle your complete workflow:
1. ✅ Create pump.fun token
2. ✅ Buy with 8 wallets
3. ✅ Run volume bot with 2 wallets
4. ✅ Sell all positions
5. ✅ Export P&L

**Start trading today!** 🚀

