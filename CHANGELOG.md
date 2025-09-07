# Changelog

## [v0.4.0] - UI/UX Overhaul (Dark + Bento) and Bundler Wiring

- Dark theme applied globally; no light bleed.
- Single Status Bento in topbar (RPC/WS/Jito/Network), fed by /api/health with degraded logic.
- Dashboard uses bento layout: Planner, Tip Preview, Recent Activity, Shortcuts.
- Bundler page wired: native v0 preview (simulateOnly) + execute via server routes.
- Guardrails with tooltips; partitions derived from active wallets (Neo: 19 → 5/5/5/4).
- WS health included with latency; Recent Activity wired to telemetry.
- No client calls to BE; server-only networking.
