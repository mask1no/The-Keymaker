On-call runbook (Keymaker Engine)

1) If /api/health fails > 60s
   - curl /api/health
   - Check RPC connectivity (env HELIUS_RPC_URL or NEXT_PUBLIC_HELIUS_RPC)
   - Temporarily bump tipLamports or priority via submit payload
   - Rotate region (ffm ↔ ny ↔ ams ↔ tokyo)
   - tail -n 200 data/journal.*.ndjson

2) Useful curls (with token if set)
   - Deposit:
     curl -s ${BASE:-http://localhost:3000}/api/engine/deposit-address -H "x-engine-token: $ENGINE_API_TOKEN"
   - Submit:
     curl -s ${BASE:-http://localhost:3000}/api/engine/submit -H "content-type: application/json" -H "x-engine-token: $ENGINE_API_TOKEN" -d '{"region":"ffm","priority":"med","tipLamports":5000}'
   - Status:
     curl -s ${BASE:-http://localhost:3000}/api/engine/status -H "content-type: application/json" -H "x-engine-token: $ENGINE_API_TOKEN" -d '{"region":"ffm","bundleId":"<ID>"}'
   - Metrics/Health:
     curl -s ${BASE:-http://localhost:3000}/api/metrics; echo; curl -s ${BASE:-http://localhost:3000}/api/health

3) Where to find logs/journals
   - Journals: data/journal.YYYY-MM-DD.ndjson (redacted)
   - Next logs: Vercel/PM2 stdout

4) Tip-floor cache
   - TTL ~7s per region; counters tipfloor_cache_hit_total / tipfloor_cache_miss_total

5) SSR console
   - /engine is SSR-only; ensure no client bundles are linked

6) PowerShell note
   - Run commands separately; avoid shell && chaining


