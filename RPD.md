# The Keymaker – Research, Product, and Design (RPD)

## Vision

The Keymaker is a thin cockpit for Solana execution. The UI only orchestrates; the server does the heavy lifting. It delivers an operator‑grade experience for planning and launching bundles with reliability, clear guardrails, and transparent health.

## Product Objectives

- Reliable bundle execution via Jito Block Engine, with preview‑first guardrails.
- Safe defaults and clear UI gates to prevent foot‑guns.
- Single source of truth for health, latency, and tip data (server‑driven).
- Fast operator workflows: minimal clicks, keyboardable controls, informative toasts.

## Core Workflows

1) Create → Preview → Execute
- Create: optional SPL token creation flow (server‑side, receipt‑gated).
- Preview: build native v0, simulate on server (simulateOnly:true) with strict guardrails.
- Execute: submit exact base64 set that passed preview; status updates come from server poller.

2) Delayed Mode
- Operator arms a 30s/60s timer.
- T‑5s: server prefetches a fresh blockhash.
- T‑1s: rebuild v0, embed tip, simulate again.
- T=0: submit via server. Abort if T‑1s preview fails.

## Health Model

- Server `/api/health` is the single source of truth (healthy/degraded/down for RPC, BE/Jito, tip feed). The client never probes third‑party services directly.
- Degraded thresholds: RPC/BE echo > 400 ms, tip feed stale > 6000 ms.

## UI Principles

- Layout: sidebar + topbar; main max‑w‑7xl; rounded‑2xl cards; soft shadows.
- Status: one compact cluster in the topbar only.
- Icons (lucide-react): Cpu (RPC), Network (WS), Rocket (Jito), Wallet, Boxes (Bundler), Sparkles (SPL Creator), Clock (Trade History), LineChart (P&L), Settings, BookOpen (Guide).
- Buttons: primary=action, secondary=navigation, no destructive for submit.
- Guards: disabled with tooltip rationale until prerequisites are met.

## Bundler Gates (must all pass)

- Wallets ≥ 1 and active group = Neo (id 19) or configured default.
- Pending bundle txCount ≤ 5.
- Region selected (default `ffm`).
- Server preview passed for the exact base64 set.
- Fresh blockhash (< ~3 s old by server measure).
- Health banner = healthy.

## Tip Strategy

- Pull tip floors before each build from `/api/jito/tipfloor`; show p25/p50/p75 and the chosen tip.
- Regular/Delayed: p50 × 1.2, stagger 60 ms.
- Instant: p75 × 1.25, stagger random [0–10] ms.
- Clamp to [50k, 2M] lamports.

## Server Status Poller

- Maintain per‑region inflight bundle_ids; coalesce to 1 Hz `getInflightBundleStatuses/getBundleStatuses` calls.
- Cache results for 3–5 s.
- Expose `/api/bundles/status/batch` that returns cached statuses and triggers refresh when stale.
- Client polls only this endpoint.

## Telemetry

- For each attempt: `jitter_ms_used`, `health_snapshot (rpc/be/tip)`, `preview_slot`, `landed_slot`, latency, retries, `tx_sigs`.

## UX Details

- Tooltips explain why Execute is disabled.
- Toasts: success (Landed), warning (Pending > N sec), error (Invalid/Failed details).
- Empty states for History/P&L; polished focus/hover states.

## Non‑Goals

- No client‑side calls to Jito or RPC for health or submit; server owns all external I/O.
- No complex on‑client graphing beyond essentials.

## Rollout & QA

- Smoke test (mainnet, dust amounts): 2–3 tx bundle of small `SystemProgram.transfer` + embedded tip.
- Expect: preview OK → submit → Landed via server poller; telemetry row persisted.

## Future Extensions

- Slot targeting with leader schedule awareness.
- Strategy presets and auto‑rebalance for wallet groups.
- Deeper analytics: land‑rate vs tip, latency vs region.
