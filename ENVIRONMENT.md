# Environment Setup

## Overview

This application requires specific environment variables to function correctly. All sensitive values are server-only and validated at startup.

## Required Environment Variables

### Core Secrets (Required in Production)

#### Session Security

```bash
KEYMAKER_SESSION_SECRET=your-64-char-hex-secret-here
```

- **Purpose**: HMAC signing for user sessions
- **Format**: 64-character hexadecimal string
- **Generate**: `openssl rand -hex 32`
- **Required**: Yes (production)

#### RPC Configuration

```bash
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
```

- **Purpose**: Primary RPC endpoint for blockchain operations
- **Format**: Full URL with API key
- **Required**: Yes
- **Note**: Helius recommended for production reliability

### API Security (Recommended)

#### Engine Protection

```bash
ENGINE_API_TOKEN=your-random-token-here
```

- **Purpose**: Protects `/api/engine/*` endpoints
- **Format**: Random string (≥16 characters)
- **Generate**: `openssl rand -hex 16`
- **Required**: Recommended for production

### External Services (Optional)

#### Token Data

```bash
BIRDEYE_API_KEY=your-birdeye-api-key
```

- **Purpose**: Enhanced token price and metadata
- **Format**: API key from Birdeye
- **Required**: No (falls back to basic data)

#### Error Monitoring
#### Pump.fun Publish (Optional)

```bash
PUMPFUN_API_BASE=https://pumpfun.api/publish
PUMPFUN_API_KEY=your-api-key-if-required
```

- Purpose: Enables COIN_PUBLISH_PUMPFUN over HTTP. When set, the daemon will POST `{ mint, payerPubkey }` to `${PUMPFUN_API_BASE}/publish` with optional bearer.
- Required: No (falls back to not implemented; returns PUMPFUN_RPC_UNAVAILABLE)


```bash
SENTRY_DSN=https://your-sentry-dsn
```

- **Purpose**: Error tracking and monitoring
- **Format**: Sentry DSN URL
- **Required**: No

## Client-Safe Configuration

These variables are exposed to the client and can be public:

```bash
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_PUBLIC_KEY
NEXT_PUBLIC_HELIUS_WS=wss://mainnet.helius-rpc.com/?api-key=YOUR_WS_KEY
NEXT_PUBLIC_NETWORK=mainnet-beta
NEXT_PUBLIC_JITO_TIP_LAMPORTS=5000
NEXT_PUBLIC_JUPITER_FEE_BPS=5
```

## Setup Instructions

### 1. Copy Environment Template

```bash
cp env.example .env.local
```

### 2. Generate Required Secrets

```bash
# Session secret (required)
openssl rand -hex 32

# Engine API token (recommended)
openssl rand -hex 16
```

### 3. Configure RPC Endpoints

- **Helius**: Get API keys from [helius.dev](https://helius.dev)
- **Primary RPC**: Use for server-side operations (include API key)
- **Public RPC**: Use for client-side operations (include API key)

### 4. Optional Services Setup

- **Birdeye**: Get API key from [birdeye.so](https://birdeye.so)
- **Sentry**: Get DSN from [sentry.io](https://sentry.io)

## Validation

The application validates all environment variables at startup:

- **Required secrets** must be present and properly formatted
- **Public variables** must not contain sensitive information
- **URL formats** are validated for RPC endpoints
- **Token lengths** are enforced for security

## Production Deployment

Set environment variables in your hosting platform (Vercel, Railway, etc.) or use a .env file in production.

## Security Notes

- **Never commit `.env*` files** - they are automatically ignored
- **Rotate secrets regularly** - see SECURITY.md for rotation policy
- **Use separate keys for different environments**
- **Monitor for secret exposure** - automated scanning on every build

## Troubleshooting

### Common Issues

#### "Environment validation failed"

- Check that all required variables are set
- Verify URL formats for RPC endpoints
- Ensure session secret is exactly 64 characters

#### "Secret exposure detected"

- Check that NEXT*PUBLIC*\* variables don't contain API keys
- Ensure server-only secrets aren't exposed to client

#### RPC Connection Issues

- Verify Helius API keys are valid
- Check network connectivity
- Ensure RPC URLs are reachable

## Support

For environment setup issues:

1. Check the validation errors at startup
2. Verify all required variables are set
3. Ensure proper secret lengths and formats
4. Test RPC connectivity separately
