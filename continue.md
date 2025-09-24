# Continue Plan (UI + Engine)

Below is the comprehensive todo list for the next session.

## UI/Design
- Refine card elevation, borders, and hover/active states (extend across all cards)
- Unify typography scale and headings hierarchy across pages
- Polish AppHeader background blur, spacing, and link/hover states
- Enhance AppSideNav active/inactive styles and keyboard focus rings
- Bentoize Settings page sections with SSR forms (no client JS)
- Refine Engine bento toggles with subtle CSS animations (CSS only)
- Harden accessibility: color contrast, focus outlines, reduced-motion support
- Normalize buttons and inputs: sizes, radii, focus styles
- Improve tables/list views (wallets) with zebra, compact density, and headers
- Add utility CSS classes for badges, chips, subtle dividers
- Verify /engine still ships ~0KB client JS after any CSS/SSR changes

## Engine/Mode (already shipped; verify & iterate)
- Execution Mode toggle (JITO_BUNDLE vs RPC_FANOUT) end-to-end
- Common engine interface + Jito/RPC engines + facade
- Cookie-backed SSR settings; server actions for mode/settings
- API: submit/status accept mode/options; return corr + ids/sigs
- Observability: counters + latency; metrics/health routes
- Journaling: rotation, redaction; tipfloor TTL cache
- CLI: send/status/fund; dynamic tip from floor; failover

## Housekeeping
- Keep legacy/** quarantined in toolchains
- Security headers in next.config.js; middleware token guard
- README updates (modes, curl samples, security notes)
- Analyze to confirm no client JS regression on SSR pages

---

To run locally next time (PowerShell):
1. pnpm install --ignore-scripts
2. pnpm check:node
3. pnpm core:build
4. pnpm analyze
5. pnpm dev

Optional CLI (if funded payer present):
- pnpm cli:send
- pnpm cli:status ffm <bundleId>
- tail -n 5 data/journal*.ndjson


