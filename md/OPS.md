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
