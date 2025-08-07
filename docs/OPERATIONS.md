# The Keymaker - Operations Manual

## Docker Operations

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/the-keymaker.git
cd the-keymaker

# Build Docker image
docker build -t keymaker:latest .

# Or use pre-built image from GitHub Container Registry
docker pull ghcr.io/your-org/keymaker:latest
```

### Running with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes (careful - deletes data!)
docker-compose down -v
```

### Environment Configuration

Create `.env.local` file:

```env
# Required API Keys
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_BIRDEYE_API_KEY=your_birdeye_key
NEXT_PUBLIC_PUMP_API_URL=https://api.pump.fun
TWO_CAPTCHA_API_KEY=your_2captcha_key

# Optional
JITO_AUTH_TOKEN=your_jito_token
JITO_WS_URL=wss://jito-websocket.com

# Puppeteer Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
HEADLESS_TIMEOUT=30
```

### Health Monitoring

```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response:
{
  "ok": true,
  "puppeteer": true,
  "version": "1.3.0",
  "checks": {
    "database": "healthy",
    "rpc": "healthy",
    "jito": "healthy"
  }
}
```

### Database Operations

```bash
# Backup database
docker exec keymaker-app sqlite3 /app/data/keymaker.db ".backup /app/data/backup.db"

# Restore database
docker exec keymaker-app sqlite3 /app/data/keymaker.db ".restore /app/data/backup.db"

# Export data
docker exec keymaker-app sqlite3 /app/data/keymaker.db ".dump" > backup.sql
```

### Upgrade Process

```bash
# 1. Backup current data
docker exec keymaker-app sqlite3 /app/data/keymaker.db ".backup /app/data/backup-$(date +%Y%m%d).db"

# 2. Pull latest image
docker pull ghcr.io/your-org/keymaker:latest

# 3. Stop current container
docker-compose down

# 4. Update docker-compose.yml with new version
# 5. Start new container
docker-compose up -d

# 6. Verify upgrade
curl http://localhost:3000/api/health
```

### Rollback Process

```bash
# 1. Stop current container
docker-compose down

# 2. Restore previous version
docker tag ghcr.io/your-org/keymaker:previous ghcr.io/your-org/keymaker:latest

# 3. Restore database backup
docker exec keymaker-app sqlite3 /app/data/keymaker.db ".restore /app/data/backup.db"

# 4. Start container
docker-compose up -d
```

## Tauri Desktop App Operations

### Installation

#### Windows

1. Download `keymaker_1.3.0_x64.msi` from releases
2. Run installer as Administrator
3. Follow installation wizard
4. Launch from Start Menu

#### macOS

1. Download `keymaker_1.3.0_x64.dmg` from releases
2. Open DMG file
3. Drag Keymaker to Applications folder
4. Open from Applications (may need to allow in Security settings)

#### Linux

1. Download `keymaker_1.3.0_amd64.AppImage` from releases
2. Make executable: `chmod +x keymaker_1.3.0_amd64.AppImage`
3. Run: `./keymaker_1.3.0_amd64.AppImage`

### Auto-Update

The app checks for updates automatically on startup. When an update is available:

1. Notification appears in app
2. Click "Update" to download
3. App restarts automatically after update
4. Previous version is backed up

### Manual Update

```bash
# Windows
winget upgrade keymaker

# macOS
brew upgrade keymaker

# Linux
# Download new AppImage and replace old one
```

### Configuration Files

#### Windows

```
%APPDATA%\keymaker\config.json
%APPDATA%\keymaker\data\keymaker.db
```

#### macOS

```
~/Library/Application Support/keymaker/config.json
~/Library/Application Support/keymaker/data/keymaker.db
```

#### Linux

```
~/.config/keymaker/config.json
~/.local/share/keymaker/data/keymaker.db
```

### Troubleshooting

#### Reset Configuration

```bash
# Windows
rmdir /s "%APPDATA%\keymaker"

# macOS
rm -rf ~/Library/Application\ Support/keymaker

# Linux
rm -rf ~/.config/keymaker ~/.local/share/keymaker
```

#### Debug Mode

```bash
# Run with debug logging
RUST_LOG=debug ./keymaker

# Windows
set RUST_LOG=debug && keymaker.exe
```

## Production Deployment

### System Requirements

- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 20GB SSD minimum
- **Network**: Stable internet, low latency to RPC

### Security Checklist

- [ ] Change default passwords
- [ ] Configure firewall rules
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring alerts
- [ ] Configure backup schedule
- [ ] Review API key permissions
- [ ] Enable auto-lock timer
- [ ] Audit access logs

### Performance Tuning

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=8192"

# Optimize SQLite
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;
PRAGMA temp_store = MEMORY;
```

### Monitoring Setup

#### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'keymaker'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

#### Grafana Dashboard

Import dashboard from `docs/monitoring/grafana-dashboard.json`

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR="/backups/keymaker"
DATE=$(date +%Y%m%d-%H%M%S)

# Database backup
sqlite3 /app/data/keymaker.db ".backup ${BACKUP_DIR}/db-${DATE}.db"

# Configuration backup
tar -czf ${BACKUP_DIR}/config-${DATE}.tar.gz /app/data/*.json

# Keep only last 30 days
find ${BACKUP_DIR} -name "*.db" -mtime +30 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
```

### Disaster Recovery

1. **Database Corruption**

   ```bash
   sqlite3 keymaker.db ".recover" | sqlite3 recovered.db
   mv recovered.db keymaker.db
   ```

2. **Service Failure**
   - Check logs: `docker logs keymaker-app`
   - Restart service: `docker-compose restart app`
   - Check health: `curl http://localhost:3000/api/health`

3. **Network Issues**
   - Verify RPC endpoint
   - Check firewall rules
   - Test connectivity: `curl -I https://api.mainnet-beta.solana.com`

## Support

- GitHub Issues: https://github.com/your-org/keymaker/issues
- Documentation: https://docs.keymaker.io
- Discord: https://discord.gg/keymaker
