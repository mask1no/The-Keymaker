# The Keymaker — Monorepo (Web + Daemon)

Architecture

- apps/web: Next.js 14 App Router UI (port 3000)
- apps/daemon: Node/TS WebSocket daemon (port 8787)
- packages/types: shared TypeScript types
- packages/logger: minimal structured logger

Setup

1) `npm install`
2) Copy `.env.example` to `.env` and set `RPC_URL` (and others)
3) `npm run dev` then open http://localhost:3000

Concepts

- Master Wallet: The connected wallet in the UI is recorded client-side and acknowledged by daemon via message meta. No private keys in web.
- Daemon: Owns keystore, RPC/Jito, transactions, bundles, logging.

Acceptance (first pass)

- Web boots, wallet connect works (Phantom/Solflare/Backpack)
- Daemon WS on 8787, HEALTH messages every 5s
- Market Maker page can send TASK_CREATE and receive TASK_ACCEPTED
- SQLite file created at `DB_FILE`, tables present
