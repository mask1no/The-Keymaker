### Keymaker Bundler – Independent Audit (Sept 22, 2025)

**Verdict**: Not production-ready. Core engine is partially sound (Jito submit + tipfloor), but the codebase remains broadly corrupted and coupled to a large UI surface. Critical subsystems (status polling, DB/journal, adapters) are broken or stubbed. Focus on a thin, deterministic bundler-core and a tiny API; quarantine everything else.

---

## Findings

- **Widespread textual corruption (high severity)**
  - Split-identifier artifacts persist across the repo (e.g., "c, o, n, s, t", "R, e, g, i, o, n").
  - Detectors flagged at least ~154 TypeScript files with comma-splits and ~76 with whitespace-splits. Many are UI and services, including server files.
  - Example evidence:

```1:20:services/statusPoller.ts
import { getJitoApiUrl } from '@/lib/server/jitoService'

export type Bundle Inflight Status = { b, u, n, d, l, e, _, i, d: string, s, tatus: 'pending' | 'landed' | 'failed' | 'invalid' | 'unknown' l, a, n, d, e, d, _, slot?: number | n, u, l, l, t, r, a, nsactions?: string,[]
}
```

```1:8:lib/db.ts
import 'server-only' let d, b: any = null export async function g e tDb(): Promise <any> {
  if (!db) {
  const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite') const path = (await import('path')).defaultdb = await o p en({ f, i, l, e, n, a, m, e: path.j o in(process.c w d(), 'data', 'keymaker.db'), d, r, i, v, e, r: sqlite3.Database })
  } return db
}
```

- **Pump.fun adapter is stubbed (medium severity)**
  - Adapter intentionally throws; no safe path for token launches.

```1:5:services/pumpfunService.ts
export async function c r eateToken(_: PumpLaunchBody): Promise <PumpLaunchResult> { throw new E r ror('Pump.fun service disabled or not implemented')
  }
```

- **Status polling broken (high severity)**
  - `services/statusPoller.ts` is corrupted and unsafe to use. Any batch/burst monitoring in API or UI relying on this is compromised.

- **DB/journal layer corrupted (high severity)**
  - `lib/db.ts` shows corruption; several API routes touching SQLite (trades, pnl) contain artifacts. Do not trust persisted metrics/PNL until replaced.

- **Core Jito service looks solid (keep) (positive)**
  - `lib/server/jitoService.ts` is clean and directly usable; contains region endpoints, send/poll, tip validation.

```8:18:lib/server/jitoService.ts
export const JITO_REGIONS: Record<RegionKey, JitoRegion> = {
  ffm: { name: 'Frankfurt', endpoint: 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles' },
  ams: { name: 'Amsterdam', endpoint: 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles' },
  ny: { name: 'New York', endpoint: 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles' },
  tokyo: { name: 'Tokyo', endpoint: 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles' },
}
```

- **Bundles submit API is coherent (positive)**
  - `app/api/bundles/submit/route.ts` presents a reasonable contract: validates tip on last tx, optional simulation path, polls status.

- **Secrets**
  - No committed secrets detected in this copy (good). Keep `.env*` out of git (already ignored). If keys were ever exposed in prior history, rotate anyway.

- **Scope creep and coupling (structural risk)**
  - UI, adapters, analytics, and creators are all intertwined with server logic, making deterministic testing difficult and increasing break surface.

---

## Production Requirements (for a Solana bundler)

- **Deterministic builder**: Given `ix[]`, payer, blockhash, fee policy → byte-for-byte identical `VersionedTransaction`.
- **Signer isolation**: No private keys in browser for server-sent transactions; or if browser signs, server remains headless.
- **Atomic bundle assembly**: Explicit ordering + CU limits + priority fee + final tip ix + no hidden mutations.
- **Clear submit contract**: `submitBundle(region, txs) → {bundleId, submittedAt}` or throw. Polling is separate.
- **Idempotent retries**: Duplicate submits do not double-spend or corrupt journal.
- **Journaled I/O**: Append-only records: slot, blockhash, tx sigs, CU price, tip, region, outcome, timings.
- **Observability**: Success vs dropped, tip floors, latency histograms, RPC/Jito health.
- **Explicit failure modes**: Sim failure vs HTTP 5xx vs stale blockhash handled distinctly.

---

## Fix-Forward Plan (today)

0. Incident response (now)

- Rotate any previously exposed keys (Helius, Birdeye, Pump.fun, 2Captcha, Jito auth if any).
- Ensure `.env*` stays ignored; never expose secrets via `NEXT_PUBLIC_*` unless truly public.

1. Split codebase by responsibility

- Create:
  - `packages/bundler-core` – headless TS lib (no Next.js/React/Zustand).
  - `apps/api` – thin HTTP wrapper over core.
  - `apps/web` – optional UI that calls the API only (quarantine current UI for later).

2. Re-implement minimal bundler-core cleanly (500–1500 LOC target)

- Modules:
  - `rpc.ts` – recent blockhash; light health checks.
  - `fee.ts` – CU limits + microLamports policy (low/med/high/vhigh).
  - `tip.ts` – tip ix builder; enforce recipient ∈ known Jito tip accounts.
  - `builder.ts` – compile ixs into deterministic `VersionedTransaction`.
  - `bundle.ts` – `submit` + `poll` (lift from current `jitoService.ts`).
  - `journal.ts` – append-only NDJSON (or tiny SQLite DAL with migrations later).
  - `metrics.ts` – counters/histograms (OK to start by writing NDJSON metrics).

3. Ship a tiny CLI before any UI

- Commands:
  - `keymaker simulate --ix-file ix.json`
  - `keymaker send --region ffm --txs tx1.b64 tx2.b64`
  - `keymaker status --region ffm --id <bundleId>`
- If CLI cannot land a bundle reliably, defer UI entirely.

4. Replace broken subsystems with clean adapters

- `adapters/pumpfun` emits ix arrays only (no submission inside adapter).
- Same for Raydium or others; core handles build/sign/submit.

5. Observability > UX

- Minimal metrics:
  - `bundles_submitted_total{region}`
  - `bundles_landed_total` | `bundles_dropped_total`
  - `submit_to_land_seconds` histogram
  - `jito_tip_floor_micro_lamports` gauge
  - `rpc_health`, `jito_http_health`

6. Definition of Done (for core)

- Deterministic builder verified by binary equality tests.
- E2E: sign → submit → poll returns landed|dropped|timeout.
- Journal includes blockhash, slot, sigs, CU price, tip, region, timings.
- Tip-recipient validation enforced.
- No plaintext secrets in repo or logs.

---

## Triaged Surface (selected)

- ✅ Keep/port into core
  - `lib/server/jitoService.ts` – regions, send/poll, tip validation.
  - `app/api/jito/tipfloor/route.ts` – reflects a clean tipfloor call (use as API example).

- ❌ Rewrite now
  - `services/statusPoller.ts` – corrupted; replace with a core `poll` API.
  - `lib/db.ts` and any SQLite usages in API routes – corrupted; replace with `journal.ts` now (SQLite later with migrations).
  - `services/pumpfunService.ts` – keep disabled; later, implement as pure ix adapter.

- 🟡 Quarantine
  - `app/` and `components/` UI: heavily corrupted. Do not block core on UI.

---

## Today’s Concrete Steps (order of execution)

1. Create `packages/bundler-core` with: `rpc.ts`, `fee.ts`, `tip.ts`, `builder.ts`, `bundle.ts`, `journal.ts`, `metrics.ts`.
2. Move `lib/server/jitoService.ts` logic into `bundle.ts` (or wrap it) and delete server/UI coupling.
3. Add `packages/cli` with `simulate`, `send`, `status` commands.
4. Add `apps/api` routes: `POST /bundles/submit`, `POST /bundles/status`, `GET /tipfloor` that call core.
5. Disable/remove uses of `services/statusPoller.ts`, `lib/db.ts` in the Next.js app for now.
6. Add tests:
   - Binary-equality builder tests
   - E2E smoke test to submit a 1-tx tip-only bundle on mainnet (config-gated)
7. Add NDJSON journaling to `data/journal.ndjson` (gitignored) and minimal health/metrics route.
8. Only after the CLI consistently lands, rebuild a minimal one-page UI that calls the API.

---

## Risk Register

- Silent corruption in server files → unpredictable prod failures. Mitigation: new core with no legacy imports.
- UI-driven coupling → non-deterministic behavior. Mitigation: headless core, tiny API.
- DB corruption → incorrect PNL/analytics. Mitigation: NDJSON journal; DB later with migrations.
- Secret leakage (historical) → account compromise. Mitigation: rotate; ensure infra audit.

---

## Quick Health Snapshot (repo evidence)

- Clean core candidates:
  - `lib/server/jitoService.ts` – good bones.
  - `app/api/bundles/submit/route.ts` – coherent contract.

- Critical broken:
  - `services/statusPoller.ts` – corrupted.
  - `lib/db.ts` – corrupted.
  - Many `app/*` and `components/*` files – corrupted.

---

## Final Recommendation

Stop polishing the UI. Ship a weapon-grade, headless bundler-core with a CLI and minimal API. Prove deterministic build and reliable submit→poll on mainnet. Journal everything. After that lands, add adapters and a minimal UI. The current repo should be split; treat most of it as peripherals and focus on the engine.
