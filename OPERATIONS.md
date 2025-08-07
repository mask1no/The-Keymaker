## Operations Guide

### Key Rotation
- Rotate `HELIUS_API_KEY`, `BIRDEYE_API_KEY`, `JUPITER_API_KEY`, `TWO_CAPTCHA_KEY`, `PUMP_FUN_API_KEY` on a monthly cadence or upon incident.
- Update CI secrets and `.env` (local) simultaneously.
- Validate with `scripts/verifyApp.ts` and smoke `/api/health`.

### Jito Tip Policy
- On free-tier endpoint (`mainnet.block-engine.jito.wtf`) enforce tip ≤ 50,000 lamports via Zod.
- Higher tips allowed on non-free-tier endpoints.

### Deterministic Wallets (Testing)
- All tests use `DETERMINISTIC_SEED` from env; never commit private keys.

### 429 Sentinel
- If any external call fails 3× with HTTP ≥ 429, mark `blocked-external` and skip the step.


