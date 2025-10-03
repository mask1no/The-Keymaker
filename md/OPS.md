# The Keymaker - Operations Guide

## Production Deployment

### Prerequisites
- Node.js 18+
- Docker (optional)
- Solana RPC access (Helius recommended)
- Jito Block Engine access

### Environment Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Configure required variables:
- `HELIUS_RPC_URL`: Your Helius RPC endpoint
- `ENGINE_API_TOKEN`: Generate with `openssl rand -hex 32`
- `KEYMAKER_SESSION_SECRET`: Generate with `openssl rand -hex 32`
- `KEYPAIR_JSON`: Your execution keypair

### DRY → LIVE Runbook

1) Configure environment

Add to `.env` (safe defaults):

```
DRY_RUN_DEFAULT=YES
KEYMAKER_REQUIRE_ARMING=YES
KEYMAKER_ALLOW_LIVE=NO
NEXT_PUBLIC_APP_ORIGIN=https://app.example.com
NEXT_PUBLIC_HELIUS_RPC=<your read RPC>
HELIUS_RPC_URL=<your write or same RPC>
HELIUS_WS_URL=<your WS>
```

2) Preflight & typecheck

```
pnpm preflight
pnpm typecheck
```

3) Start and smoke locally

```
pnpm dev -p 3001
pnpm smoke:local
```

4) Sign in and verify health

- Open `/home`; ensure 4 lights show and WS is green if WS URL set
- Check DRY RUN banner is visible

5) Arm for live (when ready)

- Click Arm 15m in the top bar → banner shows LIVE ARMED with countdown
- Set `KEYMAKER_ALLOW_LIVE=YES` in env (and redeploy if needed)

6) Send dust buy

- Run a tiny Jito/RPC buy; confirm inclusion via RPC and WS
- Disarm and flip `KEYMAKER_ALLOW_LIVE=NO` to return to DRY

7) Official sites

- Token creation uses Pump.fun’s official endpoint
- Open Raydium swap via the official domain with a confirmation prompt

8) Troubleshooting

- If WS is amber/red: verify `HELIUS_WS_URL`
- If live disabled: ensure UI Live Mode is ON and env `KEYMAKER_ALLOW_LIVE=YES`, and arming is active

### Deployment Options

#### Option 1: Docker Deployment
```bash
# Build image
docker build -t keymaker .

# Run container
docker run -d \
  --name keymaker \
  --env-file .env \
  -p 3001:3001 \
  keymaker
```

#### Option 2: Direct Deployment
```bash
# Install dependencies
pnpm install

# Build application
pnpm build

# Start production server
pnpm start
```

### Health Monitoring

- Health endpoint: `GET /api/health`
- Metrics endpoint: `GET /api/metrics`
- Expected response time: < 200ms

### Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] Session cookies secure
- [ ] API tokens rotated regularly

### Troubleshooting

#### Common Issues

1. **Health checks failing**
   - Verify RPC connectivity
   - Check Jito Block Engine access
   - Confirm environment variables

2. **Bundle submission errors**
   - Check wallet funding
   - Verify tip amounts
   - Monitor Jito status

3. **Authentication issues**
   - Regenerate session secret
   - Clear browser cookies
   - Check middleware configuration

### Monitoring & Alerts

Set up alerts for:
- Health endpoint failures
- High error rates
- Bundle success rate drops
- API response time increases

### Backup & Recovery

- Database: `data/keymaker.db`
- Wallet keys: `keypairs/` directory
- Configuration: `.env` file

Regular backup schedule recommended.

### Performance Tuning

- Enable Redis caching
- Configure CDN for static assets
- Monitor bundle sizes
- Optimize database queries

### Support

For operational issues:
1. Check logs in `logs/` directory
2. Review health endpoint status
3. Monitor system resources
4. Check external service status
