# The Keymaker - Production Deployment Guide

## 🚀 Quick Start Checklist

Before deploying to production, ensure you have:

- [ ] Solana mainnet RPC endpoint (Helius, QuickNode, or Alchemy)
- [ ] Pump.fun API key from [PumpPortal](https://pumpportal.fun/)
- [ ] Birdeye API key from [Birdeye](https://docs.birdeye.so/)
- [ ] Domain with HTTPS configured
- [ ] Minimum 1 SOL for testing and Jito tips

## 📋 Step 1: Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp env.example .env.local
   ```

2. **Configure essential variables:**

   | Variable | Required | Description | Where to Get |
   |----------|----------|-------------|--------------|
   | `NEXT_PUBLIC_HELIUS_RPC` | ✅ | Mainnet RPC endpoint | [Helius](https://dev.helius.xyz/) |
   | `NEXT_PUBLIC_BIRDEYE_API_KEY` | ✅ | Token data API | [Birdeye](https://docs.birdeye.so/) |
   | `NEXT_PUBLIC_PUMPFUN_API_KEY` | ✅ | Pump.fun launches | [PumpPortal](https://pumpportal.fun/) |
   | `NEXT_PUBLIC_JITO_ENDPOINT` | ✅ | MEV protection | Pre-configured |

3. **Verify mainnet configuration:**
   - Ensure all RPC URLs point to `mainnet-beta`
   - Remove any `devnet` references
   - Confirm API keys are for production

## 📦 Step 2: Build & Dependencies

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Initialize the database:**
   ```bash
   npm run db:init
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Test locally:**
   ```bash
   npm start
   ```

## 🔒 Step 3: Security Hardening

> 📋 **See [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) for a comprehensive security audit checklist**

### Wallet Encryption
- ✅ AES-256-GCM encryption enabled by default
- ✅ Password-based key derivation (PBKDF2)
- ✅ Keys stored encrypted in sessionStorage
- ⚠️ Never log private keys

### Environment Security
- Keep `.env.local` out of version control
- Use platform-specific secret management:
  - **Vercel:** Environment variables in dashboard
  - **Docker:** Pass secrets via environment
  - **VPS:** Use systemd credentials or vault

### HTTPS Requirements
- Wallet adapters require secure context
- Use SSL certificates (Let's Encrypt)
- Configure proper CORS headers

## 🚀 Step 4: Platform Deployment

### Option A: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard**

### Option B: Docker

1. **Build image:**
   ```bash
   docker build -t keymaker:latest .
   ```

2. **Run container:**
   ```bash
   docker run -d \
     --name keymaker \
     -p 3000:3000 \
     --env-file .env.local \
     keymaker:latest
   ```

### Option C: VPS/Self-Hosted

1. **Install Node.js 18+**

2. **Configure PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name keymaker -- start
   pm2 save
   pm2 startup
   ```

3. **Setup Nginx reverse proxy:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## ✅ Step 5: Production Validation

### 1. Test Mainnet Connection
- Open the app and check network status
- Should show "Mainnet" in the UI
- Verify RPC endpoint is responsive

### 2. Test Token Launch (Small Amount)
```javascript
// Test with minimal SOL (0.1 SOL)
{
  platform: "pump.fun",
  name: "TestToken",
  symbol: "TEST",
  initialBuy: 0.01 // SOL
}
```

### 3. Test Bundle Modes
- **Flash (Jito):** Atomic execution with MEV protection
- **Regular:** Standard transaction bundle
- **Stealth:** Delayed execution
- **Manual:** Step-by-step control

### 4. Verify Core Features
- [ ] Wallet import/encryption works
- [ ] Token creation succeeds
- [ ] Jupiter swaps execute
- [ ] PnL tracking updates
- [ ] Activity monitor shows transactions

## 📊 Step 6: Monitoring & Maintenance

### Setup Monitoring

1. **Error Tracking (Optional):**
   ```bash
   # Configure Sentry DSN in .env.local
   SENTRY_DSN=your-sentry-dsn
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
   ```

2. **Database Backups:**
   ```bash
   # Automated backup script
   cp data/keymaker.db backups/keymaker-$(date +%Y%m%d).db
   ```

3. **RPC Monitoring:**
   - Track rate limits
   - Monitor latency
   - Set up failover endpoints

### Performance Optimization

1. **RPC Optimization:**
   - Use dedicated nodes for high TPS
   - Configure connection pooling
   - Monitor rate limits

2. **Database Optimization:**
   ```sql
   -- Add indexes for performance
   CREATE INDEX idx_logs_timestamp ON execution_logs(timestamp);
   CREATE INDEX idx_pnl_wallet ON pnl_records(wallet_address);
   ```

## 🚨 Common Issues & Solutions

### Issue: "Failed to fetch"
**Solution:** Check RPC endpoint and API keys are valid for mainnet

### Issue: "Insufficient SOL for fees"
**Solution:** Ensure each wallet has at least 0.05 SOL for operations

### Issue: "Transaction failed"
**Solution:** 
- Check Jito bundle includes tip (min 1000 lamports)
- Verify token accounts exist
- Increase compute units if needed

### Issue: "API rate limited"
**Solution:**
- Upgrade to premium RPC tier
- Implement request queuing
- Add retry logic with backoff

## 🔄 Maintenance Tasks

### Daily
- Monitor error logs
- Check wallet balances
- Verify API endpoints

### Weekly
- Backup database
- Review performance metrics
- Update dependencies (security patches)

### Monthly
- Full system audit
- Performance optimization
- Feature updates

## 📞 Support Resources

- **Documentation:** [README.md](./README.md)
- **Devnet Testing:** [guide.md](./guide.md)
- **Architecture:** Check `/docs` folder
- **Community:** Discord/Telegram links

## 🎯 Production Best Practices

1. **Start Small:** Test with minimal amounts first
2. **Monitor Everything:** Use logs and metrics
3. **Backup Regularly:** Especially the database
4. **Update Carefully:** Test updates on devnet first
5. **Security First:** Never expose private keys

---

## 🚀 Ready to Launch?

Once all steps are complete:

1. ✅ Environment configured
2. ✅ Security hardened
3. ✅ Deployed successfully
4. ✅ Mainnet tested
5. ✅ Monitoring active

**You're ready to launch memecoins at scale!** 🎉

Remember: With great power comes great responsibility. Trade wisely! 💎🙌 