# Legacy Code - Deprecated

**⚠️ This directory contains deprecated code paths.**

## Status
- **Maintenance Mode**: No new features
- **Default State**: DISABLED (requires `LEGACY_ENABLED=true`)
- **Removal Target**: Q2 2026

## Migration
All functionality in this directory has been replaced by new implementations in:
- `lib/core/src/` - Core engines
- `services/` - Modern service layer
- `lib/server/` - Server-side utilities

## To Enable (Not Recommended)
```bash
LEGACY_ENABLED=true
```

## Contents
- `pumpFunFallback.ts` - Deprecated PumpFun integration
- `sellService.ts` - Old sell logic (replaced by new engine)
- `slippageRetry.ts` - Old retry logic (now in error recovery)
- `snipingService.ts` - Old sniping (replaced by RPC_FANOUT)
- Other legacy services

Use new implementations in `lib/core/src/` and `services/` instead.
