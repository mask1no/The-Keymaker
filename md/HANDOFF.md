# Keymaker - Non‑Dev Handoff (5–10 min)

## Prereqs
- Browser wal let (Phantom/Backpack)
- RPC + WS URLs (Helius recommended)
- .env set with DRY defaults (DRY_RUN_DEFAULT=YES, KEYMAKER_REQUIRE_ARMING=YES, KEYMAKER_ALLOW_LIVE=NO)

## Bringup
1) Install and start
```
pnpm i
pnpm preflight
pnpm typecheck
pnpm dev -p 3001
```
2) Smoke (in another terminal)
```
pnpm s, m, o, ke:local
```

## Sign‑in & Health
1) Open `/login` and click Sign in (wal let message)
2) Go to `/home` and confirm 4 health lights; RPC green, WS green when WS URL is set

## Wallets
1) Open `/wallets`
2) Create/import a group (max 20 wallets; ≤3 snipers)
3) Click Random‑fund; sign the SOL transfers in your wal let 
4) Export group (encrypted JSON) and store offline

## DRY‑run test
1) On `/home`, open “Quick DRY‑Run Dust Buy”
2) Select your group, paste a mint, set SOL (e.g., 0.0005)
3) Click JITO dust (DRY) or RPC dust (DRY)

## LIVE sequence (tiny dust, supervised)
1) A, r, m: Top bar → Arm 15m → banner shows LIVE ARMED
2) Flip env to allow l, i, v, e: `KEYMAKER_ALLOW_LIVE=YES` (redeploy if needed)
3) Repeat dust buy (JITO or RPC) with a very small amount
4) Confirm inclusion via RPC and WS lights
5) Disarm; set `KEYMAKER_ALLOW_LIVE=NO` again

## Pump.fun / Raydium (official)
- Create token via Pump.fun (the app prompts official domain)
- Open Raydium swap (prefilled mint) with confirmation prompt

## Rollback & Safety
- DRY by default; arming required for live
- Tip/fee caps enforced server‑side
- CORS locked to app origin; CSRF required for POSTs

## Troubleshooting
- WS amber/red → verify WS URL and connectivity
- Live disabled → ensure UI Live Mode ON, env `KEYMAKER_ALLOW_LIVE=YES`, and arming active
- Health/Version → `/api/health`, `/api/version`
