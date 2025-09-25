# Keymaker – Desktop Shortcut (Windows) and Start Guide

## Start (development)

1. Open PowerShell
2. Run each command separately:

```powershell
cd "C:\Users\Andy El shemy\OneDrive\Skrivbord\The Keymaker"
pnpm install
pnpm dev
```

Open: http://localhost:3000/engine

## Start (production)

```powershell
cd "C:\Users\Andy El shemy\OneDrive\Skrivbord\The Keymaker"
pnpm build
pnpm start
```

Open: http://localhost:3000/engine

## Desktop shortcut to open the UI

1. Right‑click Desktop → New → Shortcut
2. Enter this as the location:

```
http://localhost:3000/engine
```

3. Next → name it → Finish

## Desktop shortcut to start the server (PowerShell script)

1. Create the start script (edit the paths/tokens to your environment):

Save as: `C:\Users\Public\start-keymaker.ps1`

```powershell
Set-Location "C:\Users\Andy El shemy\OneDrive\Skrivbord\The Keymaker"

# Optional: set env vars for the session
$env:ENGINE_API_TOKEN = "change-me-strong-token"
$env:KEYPAIR_JSON     = "C:\absolute\path\to\keymaker-payer.json"
$env:NEXT_PUBLIC_BASE_URL = "http://localhost:3000"

# First run only: install deps
if (-not (Test-Path "node_modules")) { pnpm install }

# Start the dev server
pnpm dev
```

2. Create a Desktop shortcut that runs the script:

- Right‑click Desktop → New → Shortcut
- Target:

```
powershell.exe -ExecutionPolicy Bypass -File "C:\Users\Public\start-keymaker.ps1"
```

- Next → name it (e.g., "Start Keymaker") → Finish

3. (Optional) Right‑click the shortcut → Properties → Run: Minimized

## Notes

- Guarded API: set `ENGINE_API_TOKEN` and include header `x-engine-token: <token>` when calling `/api/engine/*`.
- Payer: set `KEYPAIR_JSON` to an absolute path (array JSON from `solana-keygen`).
- PowerShell: run commands separately (avoid `&&`).
