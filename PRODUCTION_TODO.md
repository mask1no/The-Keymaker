# Production Readiness – Remaining Work

This doc tracks what’s left to make the bundler production‑ready.

## Status

- Fixed: core server `jitoService`, `/api/jito/tipfloor`, `/api/bundles/submit`, `/api/bundles/status/batch`
- Fixed: utils (`lib/logger.ts`, `services/execution/Result.ts`, `utils/withRetry.ts`, `utils/safeBigInt.ts`, `constants.ts`)
- Server type‑check: green via `pnpm type-check`
- Build: green via `pnpm build`
- Test mode: health/tipfloor/simulate/execute/status work locally with stubs

## Gate 1 (type‑check + build)

- [x] Repair corrupted app pages (`/`, `dashboard/pnl`, `history`, providers, dashboard wrapper)
- [x] Ensure build passes
- [ ] Optional: finish minor UI cleanups (`app/page.original.tsx` demo)

## Gate 2 (API contract tests)

- [x] Add Jest tests (mock fetch):
  - GET `/api/jito/tipfloor` → `{ p25, p50, p75, ema_50th, region }`
  - POST `/api/bundles/submit` (simulateOnly and submit shapes)
  - POST `/api/bundles/status/batch` → `{ region, statuses }`

## Gate 3 (unit tests)

- [x] `SimulationService.simulateAll` (success/error)
- [x] `SubmissionService.submitAndPoll` (success/timeout/error)
- [x] `validateTipAccount` (true/false/malformed)

## Gate 4 (resilience)

- [x] Per‑IP rate limit: tipfloor/submit/status (in‑memory + Redis fallback)
- [x] Retries/backoff for Jito (network/5xx only)
- [x] Circuit breaker around Jito methods with Sentry telemetry
- [x] Leader schedule helper + blockhash freshness checks
- [x] Feature flag `ENABLE_SLOT_TARGETING=false` with scaffolding

## UI minimal (non‑blocking)

- [x] Minimal Bundle page wired to endpoints (tipfloor/simulate/execute/status)
- [x] Basic feedback on actions

## Security & config

- [x] Ensure no secrets in client; documented envs
- [x] Validate/sanitize inputs in submit/status routes

## Observability

- [x] Sentry breadcrumbs for simulate/send/poll and circuit transitions
- [ ] Configure DSN in prod and verify events

## CI/CD

- [x] CI: type‑check + build + API contract checks in TEST_MODE
- [ ] Optional Docker build & smoke

## Close Gate 1 checklist

- [x] Repairs complete
- [x] `pnpm build` passes
- [ ] Commit and tag `gate-1`

## Next (Mainnet Smoke)
- Provide `SMOKE_SECRET` and `RPC_URL`
- Run `pnpm smoke` → expect simulate→execute→status to progress beyond `pending`
