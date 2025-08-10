# Keymaker AI edit rules

- Never expose server secrets (HELIUS_API_KEY, BIRDEYE_API_KEY, PUMPFUN_API_KEY) to client bundles. Use server routes or helpers like `lib/server/rpc.ts`.
- Preserve wallet groups ≤ 20 and roles: master, dev, snipers×3; keep sniper‑weighted funding.
- Keep UI simple and fast: fixed sidebar, CSS Grid home, theme persists; bottom widgets (StatusCluster bottom-left, ActionDock bottom-right) remain mounted.
- Do not add mocks or placeholders. Remove dead code promptly.
- Prefer server routes for paid APIs (Helius/Birdeye/Pump/Jupiter). Avoid NEXT_PUBLIC secrets for these services.
- Before pushing, run: pnpm format; pnpm lint; pnpm tsc --noEmit; npx ts-prune.
