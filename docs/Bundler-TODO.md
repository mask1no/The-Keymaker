# Bundler hardening and completion checklist

This checklist captures what remains to ship a reliable, secure Jito bundler inside The Keymaker, plus recommended extras.

## Required to finish bundler

1. Verify runtime env
   - NEXT_PUBLIC_HELIUS_RPC is set to a valid RPC
   - (Optional) NEXT_PUBLIC_JITO_ENDPOINT if using a custom block engine

2. API stability and validation
   - [ ] app/api/bundles/submit/route.ts
     - [ ] Enforce max bundle size (<=5)
     - [ ] Simulate path returns detailed simulation logs on error
     - [ ] Submission path validates last ix is SystemProgram -> known Jito tip
     - [ ] Poll loop returns landed/failed with signatures
   - [ ] app/api/bundles/status/batch/route.ts
     - [ ] Validate payload shape and region
     - [ ] Ensure request rate-limited per IP/session

3. Auth and rate limiting
   - [ ] Ensure signed-intent session is required for any stateful POSTs
   - [ ] Apply in-memory rate limiting to submit and status endpoints
   - [ ] Consider Redis in production for distributed rate limits

4. UI hooks (optional for API-only)
   - [ ] Add UI to show tip floor and recommended tip
   - [ ] Add UI form to paste base64 txs, simulate, then submit
   - [ ] Surface bundle_id and status polling with live updates

5. Error handling and observability
   - [ ] Ensure `services/statusPoller.ts` caches and merges inflight results sanely
   - [ ] Wrap external calls with `utils/withRetry.ts` where useful
   - [ ] Add structured logs on submit/status for troubleshooting

## Security hardening

6. Crypto & secrets
   - [x] lib/crypto.ts uses scrypt+salt AES-256-GCM (v2) and b/w compatible decrypt
   - [ ] Rotate SECRET_PASSPHRASE for production
   - [ ] Ensure no secrets are leaked to client bundles

7. Proxy and MCP
   - [x] app/api/proxy/route.ts gated behind signed session & rate limit
   - [ ] Disable Python MCP entirely in prod or proxy to a safe worker

8. Headers and CSP
   - [ ] Validate CSP in next.config.js allows necessary connect-src to Jito/Helius only
   - [ ] Disable inline script allowance before shipping

## QA plan

9. Local checks
   - [ ] Start dev: pnpm dev
   - [ ] GET /api/jito/tipfloor?region=ffm returns structure
   - [ ] POST /api/bundles/submit with simulateOnly:true succeeds for a known-good set
   - [ ] POST /api/bundles/submit with simulateOnly:false returns bundle_id
   - [ ] POST /api/bundles/status/batch returns final status within timeout

10. Integration checks

- [ ] Smoke run with `scripts/smokeStandalone.ts`
- [ ] Verify bundle landed on mainnet and signatures present

## Nice-to-have extras

11. Adaptive tip suggestion

- [ ] Compute suggested tip based on EMA and percentiles from tipfloor
- [ ] Allow override per submission

12. Region failover

- [ ] If a region is down, re-route to another region automatically

13. Tracing

- [ ] Add minimal OpenTelemetry spans around submit and status polling (local only)

## Done

- [x] Repair corrupted API routes: analytics, auth/nonce, status batch, history, pnl, marketcap, pumpfun-\*
- [x] Strengthen Jito tip validation (SystemProgram + min lamports)
- [x] Harden crypto (scrypt+salt, backward compatible)
- [x] Gate proxy route (Python MCP) behind session & rate limit
- [x] Fix PostCSS/Tailwind and disable Sentry hooks in dev
- [x] Dev server running; tipfloor responds on /api/jito/tipfloor

## Next session (resume work)

- [ ] Repair remaining corrupted source files (priority)
  - services: `jupiterService.ts`, `settingsService.ts`, `platformService.ts`, `pnlService.ts`, `sellService.ts`, `raydiumService.ts`, `pumpfunService.ts`, `pumpFunFallback.ts`, `presetService.ts`, `rugService.ts`, `slippageRetry.ts`, `snipingService.ts`, `i18nService.ts`
  - utils: `browserCrypto.ts`, `crypto.ts`, `feeCalculator.ts`, `rpcLimiter.ts`, `safeBigInt.ts`
  - tests: update or temporarily skip obviously broken legacy/unit tests while API stabilizes
- [ ] Run `pnpm type-check` and `pnpm build`; fix surfaced errors
- [ ] Verify bundler end-to-end
  - POST submit with `simulateOnly: true`
  - Submit real (if safe test txs available), then poll status
- [ ] Tighten CSP in `next.config.js` (connect-src to Jito/Helius only)
- [ ] Optional: switch in-memory rate limits to Redis in prod
