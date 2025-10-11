# Security Policy

## Overview

Keymaker is a production-ready Solana trading application that handles real funds and sensitive blockchain operations. Security is our highest priority.

## Secret Management

### Environment Variables

All sensitive configuration is handled through environment variables that are **never** committed to version control:

#### Server-Only Secrets (Required in Production)

- `HELIUS_RPC_URL` - Primary RPC endpoint with API key
- `HELIUS_WS_URL` - WebSocket endpoint for real-time data
- `ENGINE_API_TOKEN` - API token protecting engine endpoints
- `BIRDEYE_API_KEY` - API key for Birdeye token data
- `KEYMAKER_MASTER_PASSPHRASE` - Master passphrase for encryption (≥12 chars)
- `KEYMAKER_SESSION_SECRET` - Session secret for HMAC signing (≥32 chars)

#### Client-Safe Variables (Can be Public)

- `NEXT_PUBLIC_HELIUS_RPC` - Public RPC endpoint for client operations
- `NEXT_PUBLIC_HELIUS_WS` - Public WebSocket endpoint
- `NEXT_PUBLIC_NETWORK` - Network selection (mainnet-beta/devnet)
- `NEXT_PUBLIC_JITO_TIP_LAMPORTS` - Default Jito tip amount
- `NEXT_PUBLIC_JUPITER_FEE_BPS` - Jupiter swap fee

### ⚠️ Critical Security Rules

#### 🚫 NEVER put secrets in NEXT*PUBLIC*\* variables

- Client-side code has access to `NEXT_PUBLIC_*` variables
- These variables are exposed in the browser and build output
- **Violation**: If any NEXT*PUBLIC*\* variable contains an API key or secret token

#### 🚫 NEVER commit .env files

- `.env`, `.env.local`, `.env.*` files are automatically ignored
- Committing these files exposes secrets to the entire world

#### 🚫 NEVER hardcode secrets in source code

- All secrets must be externalized to environment variables
- Source code is scanned for hardcoded secrets on every commit

## Key Rotation Policy

### When to Rotate

- **Immediately**: If any secret is suspected to be compromised
- **Quarterly**: For production API keys and session secrets
- **Annually**: For master passphrase and long-term secrets

### How to Rotate

1. Generate new secret value
2. Update `.env.local` file
3. Restart application
4. Verify functionality
5. Remove old secret from environment

## Incident Response

### If a Secret is Compromised

1. **Immediate Actions**:
   - Generate and deploy new secrets
   - Revoke compromised keys from services
   - Monitor for unauthorized activity

2. **Investigation**:
   - Review git history for when secret was introduced
   - Check if secret appeared in any public artifacts
   - Audit access logs for suspicious activity

3. **Prevention**:
   - Review and strengthen secret generation procedures
   - Enhance scanning and validation
   - Update team training

## Development Security

### Local Development

- Use `.env.local` for local development (gitignored)
- Never commit development secrets
- Use test/development API keys when possible

### Production Deployment

- Use proper secret management (environment variables, secret managers)
- Never use default/example values in production
- Enable all security validations

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public issue
2. **Do NOT** share details publicly
3. Contact the security team directly

## Validation & Monitoring

- **Startup Validation**: All secrets validated at application startup
- **Build Scanning**: Automated scanning prevents secret leaks in build output
- **GitHub Actions**: Every push/PR scanned for secrets using multiple tools
- **Runtime Monitoring**: Environment validation runs continuously

## Compliance

This application handles:

- Financial transactions (Solana blockchain)
- User wallet management
- API key management for external services

All security measures follow industry best practices for financial applications.
