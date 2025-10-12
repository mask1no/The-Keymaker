# The Keymaker (Minimal)

Quick start

- API: `docker compose up -d` → http://localhost:3001
- UI: `pnpm dev` → http://localhost:3000

Environment

- Create `.env.local` from `.env.example` and set:
  - `HELIUS_RPC_URL`
  - `NEXT_PUBLIC_API_BASE=http://localhost:3001`
  - optional: `JITO_RELAY_URL`, `JITO_TIP_LAMPORTS_DEFAULT`

Core flows (Fastify API)

- Wallets: POST `/api/wallets/create|import|list`
- Funding: POST `/api/funding/execute`
- Engine: POST `/api/engine/bundle` (mode RPC/JITO)
- Sells: POST `/api/sell/all|percent|at-time`
- P&L: GET `/api/history`, `/api/pnl?format=csv|json`

Security

- Local keystore with AES-256-GCM via passphrase (server). No secrets logged.
- CORS locked to `http://localhost:3000`.
