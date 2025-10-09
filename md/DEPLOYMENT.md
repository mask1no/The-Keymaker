# Keymaker Production Deployment Guide

## Prerequisites

- Node.js 18+ and npm/pnpm
- Solana CLI tools
- Domain name and SSL certificate
- Server with at least 2GB RAM and 20GB storage

## Environment Setup

### 1. Generate Required Keys

```bash
# Generate session secret
openssl rand -hex 32

# Generate engine API token
openssl rand -hex 16

# Generate payer keypair (for funding operations)
solana-keygen new -o ~/keymaker-payer.json -s
```

### 2. Configure Environment Variables

Copy `env.example` to `.env` and fill in production values:

```bash
cp env.example .env
```

**Required Variables:**

```env
# Core configuration
KEYPAIR_JSON=/path/to/keymaker-payer.json
KEYMAKER_SESSION_SECRET=your-64-char-hex-secret

# RPC endpoints
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Network
NEXT_PUBLIC_NETWORK=mainnet-beta

# Security
ENGINE_API_TOKEN=your-random-token

# Optional but recommended
BIRDEYE_API_KEY=your-birdeye-key
SENTRY_DSN=your-sentry-dsn
```

### 3. Install Dependencies

```bash
npm install
# or
pnpm install
```

## Build and Deploy

### Option 1: Standalone Build (Recommended)

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Option 2: Docker Deployment

```bash
# Build Docker image
docker build -t keymaker .

# Run container
docker run -d \
  --name keymaker \
  -p 3000:3000 \
  -v /path/to/.env:/app/.env \
  -v /path/to/data:/app/data \
  keymaker
```

### Option 3: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "keymaker" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

## Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Checklist

- [ ] Session secret is cryptographically secure
- [ ] Engine API token is set and random
- [ ] RPC endpoints use API keys
- [ ] SSL certificate is valid and auto-renewing
- [ ] Firewall blocks unnecessary ports
- [ ] Database file has proper permissions
- [ ] Keypair file is secured (600 permissions)
- [ ] Environment variables are not logged
- [ ] Rate limiting is configured
- [ ] Error tracking is enabled

## Monitoring Setup

### 1. Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

### 2. Log Monitoring

```bash
# View application logs
pm2 logs keymaker

# Or with Docker
docker logs keymaker -f
```

### 3. Database Monitoring

```bash
# Check database size
ls -lh data/keymaker.db

# Backup database
cp data/keymaker.db backups/keymaker-$(date +%Y%m%d).db
```

## Performance Optimization

### 1. Enable Compression

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Cache Static Assets

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization

```sql
-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Optimize database
VACUUM;
ANALYZE;
```

## Backup Strategy

### 1. Database Backups

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/keymaker"
mkdir -p $BACKUP_DIR

# Create backup
cp data/keymaker.db $BACKUP_DIR/keymaker_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "keymaker_*.db" -mtime +30 -delete
```

### 2. Configuration Backups

```bash
# Backup environment and configs
tar -czf keymaker-config-$(date +%Y%m%d).tar.gz .env data/ package.json
```

## Troubleshooting

### Common Issues

1. **Database locked error**
   - Check if multiple instances are running
   - Restart the application

2. **RPC connection failed**
   - Verify API key is valid
   - Check network connectivity
   - Try different RPC endpoint

3. **Memory issues**
   - Increase server RAM
   - Check for memory leaks
   - Restart application regularly

4. **SSL certificate issues**
   - Use Let's Encrypt for automatic renewal
   - Check certificate expiration

### Log Analysis

```bash
# Search for errors
grep -i error /var/log/nginx/error.log

# Monitor real-time logs
tail -f /var/log/keymaker/app.log
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer with sticky sessions
- Implement Redis for session storage
- Use external database (PostgreSQL)

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching layer

## Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Monitor disk space
- [ ] Check SSL certificate expiration
- [ ] Review security logs
- [ ] Update server packages

### Updates

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild and restart
npm run build
pm2 restart keymaker
```

## Support

For deployment issues:

1. Check application logs
2. Verify environment configuration
3. Test individual components
4. Review security checklist
5. Contact support if needed
