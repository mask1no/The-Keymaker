# Production Readiness – Remaining Work

This doc tracks what’s left to make the bundler production‑ready.

## Status

- Fixed: core server `jitoService`, `/api/jito/tipfloor`, `/api/bundles/submit`, `/api/bundles/status/batch`
- Fixed: utils (`lib/logger.ts`, `services/execution/Result.ts`, `utils/withRetry.ts`, `utils/safeBigInt.ts`, `constants.ts`)
- Server type‑check: green via `pnpm type-check:server`
- Build blockers: several API routes/pages still corrupted; many are now stubbed

## Gate 1 (type‑check + build)

- [ ] Stub/replace remaining corrupted routes/pages:
  - [ ] `app/api/pumpfun-fallback/route.ts` → return 501 stub
  - [ ] `app/dashboard/sell-monitor/page.tsx` → minimal stub page
  - [ ] `app/global-error.js` → simple error boundary stub
  - [ ] `app/guide/page.tsx` → minimal static markdown or placeholder
  - [ ] `app/history/page.tsx` → minimal stub page
- [ ] Re‑run `pnpm build` and fix any import/runtime errors

## Gate 2 (API contract tests)

- [ ] Add Jest tests (mock fetch):
  - GET `/api/jito/tipfloor` → `{ p25, p50, p75, ema_50th, region }`
  - POST `/api/bundles/submit` (simulateOnly and submit shapes)
  - POST `/api/bundles/status/batch` → `{ region, statuses }`

## Gate 3 (unit tests)

- [ ] `SimulationService.simulateAll` (success/error)
- [ ] `SubmissionService.submitAndPoll` (success/timeout/error)
- [ ] `validateTipAccount` (true/false/malformed)

## Gate 4 (resilience)

- [ ] Per‑IP rate limit: tipfloor/submit/status
- [ ] Retries/backoff for Jito (network/5xx only)
- [ ] Circuit breaker around Jito methods
- [ ] Feature flag `ENABLE_SLOT_TARGETING=false` with scaffolding

## UI minimal (non‑blocking)

- [ ] Minimal Bundle page wired to endpoints (done for tipfloor; submit next)
- [ ] Basic feedback on actions

## Security & config

- [ ] Ensure no secrets in client; document envs (RPC/Jito endpoint)
- [ ] Validate/sanitize inputs in submit/status routes

## Observability

- [ ] Sentry DSN wired (prod errors/warnings only)

## CI/CD

- [ ] CI: type‑check server, run tests
- [ ] Optional Docker build & smoke

## Close Gate 1 checklist

- [ ] Finish stubs above
- [ ] `pnpm build` passes
- [ ] Commit and tag `gate-1`
