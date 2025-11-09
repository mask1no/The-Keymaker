# Acceptance Report — The Keymaker (Local MVP)

Date: <YYYY-MM-DD>

## Environment
- OS: <Windows/macOS/Linux>
- Node: <vXX>
- RPC_URL: <provider/redacted>
- RPC_URLS: <n endpoints>
- JITO_BLOCK_ENGINE: <unset|url>
- GRPC_ENDPOINT: <unset|url>
- NEXT_PUBLIC_WS_URL: ws://localhost:8787

## Commands
```
# Install & build
npm ci
npm run build

# Start
npm -w apps/daemon run start
npm -w apps/web run start
```

## Steps & Results
1) Auth handshake: web → daemon nonce/challenge → AUTH_OK
   - Result: PASS | FAIL (details)

2) Wallets
   - Created folder: default
   - Created wallets: 2
   - Import (optional): N/A | PASS
   - Rename (optional): PASS

3) Funding
   - Total funded: 0.02 SOL
   - Result: PASS | FAIL (signatures below)

4) Snipe (RPC_SPRAY)
   - CA: <token mint>
   - Wallets: 2 • Max SOL/wallet: 0.005 • Slippage: 500 bps
   - Result: PASS | FAIL (sigs below)

5) Sell All
   - Result: PASS | FAIL (sigs below)

6) PnL
   - /pnl endpoint: PASS | FAIL
   - Aggregates by CA: PASS | FAIL

7) Auto-snipe (optional)
   - Enabled with folder=default; dedupe=60s; wallets=2; buy=0.01 SOL
   - Helius emits Pump.fun create → SNIPE task created automatically
   - Result: N/A | PASS | FAIL

8) RPC fanout
   - RPC_URLS configured: <n> endpoints
   - Hedged send observed (primary failover): N/A | PASS | FAIL

9) Optional
   - Jito-lite path with engine: N/A | PASS | FAIL
   - Pump.fun publish via HTTP: N/A | PASS | FAIL

## Signatures
- Funding sigs: [ ... ]
- Snipe sigs: [ ... ]
- Sell sigs: [ ... ]

## Observations & Notes
- Health ping: ok/degraded; pingMs: <value>
- RPC pool size: <n>, primary: <url>
- Any errors or caps triggered:
- Follow-ups:

