## The Keymaker Runbook

### Prerequisites

- Node 18+
- pnpm
- Postgres (optional for production metrics)

### Environment

- REQUIRED (server): `RPC_URL`
- REQUIRED (client): `NEXT_PUBLIC_HELIUS_RPC`
- Optional: `NEXT_PUBLIC_JITO_ENDPOINT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`, `SMOKE_SECRET`
- Optional: `DATABASE_URL` (postgresql://user:pass@host:5432/dbname)
- Tuning: `TIPFLOOR_TTL_MS`, `RATE_LIMIT_*`, `STATUS_MAX_IDS`, `SUBMIT_MAX_TXS`, `PAYLOAD_LIMIT_*_BYTES`, `JITO_REGION_FAILOVER`, `BLOCKHASH_MAX_AGE_MS`
- Local/testing: `TEST_MODE=1`, `NEXT_PUBLIC_TEST_MODE=1`

### Key Endpoints

- GET `/api/health` → overall health (rpc/jito/db latencies)
- GET `/api/jito/tipfloor?region=ffm` → normalized `{ p25,p50,p75,ema_50th,region }`
- POST `/api/bundles/submit` → simulate or execute (payload-hash enforced)
- POST `/api/bundles/status/batch` → normalized statuses with caching

### Run

- Build: `pnpm build`
- Start: `pnpm start`
- Dev: `pnpm dev`

### Database (Postgres via Prisma)

- Generate client: `pnpm prisma:generate`
- Create migrations: `pnpm prisma:migrate`
- Deploy migrations: `pnpm prisma:deploy`

### Smoke Test (mainnet)

1. Set `SMOKE_SECRET` (bs58 keypair) and `RPC_URL` in `.env`.
2. `pnpm smoke` → simulates then executes minimal bundle (transfer + Jito tip).
3. Poll `/api/bundles/status/batch` until `status` leaves `pending`.

### Sentry

- Set `SENTRY_DSN` to enable.
- Breadcrumbs: simulate, submit, poll, failover choices.
- Circuit events: `Circuit opened/closed/half-open` per region+method.

### Rate Limiting & Caching

- In-memory fallback; Upstash Redis in production.
- Configure with `RATE_LIMIT_*`, `TIPFLOOR_TTL_MS`.

### Leader & Blockhash

- Leader schedule telemetry recorded on submit.
- Blockhash freshness enforced during simulate/submit.

### Monitoring & SLOs

- `GET /api/health` alerts if `ok=false` or latencies exceed thresholds.
- Suggested thresholds: RPC < 500ms, Jito tipfloor < 500ms, 5xx rate < 1% over 5m.

### Rollback

- Revert to last known good tag.
- Clear Cloud/Edge caches if applicable.
- Verify `/api/health` and a simulate-only call before full traffic.
