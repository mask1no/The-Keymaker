# Contributing

## Preflight & Typecheck

- Run preflight to block files with literal ellipses:

```bash
pnpm preflight
```

- Typecheck:

```bash
pnpm typecheck
```

## Local Dev

```bash
pnpm dev -p 3001
```

## Smoke Tests

- Local:

```bash
pnpm smoke:local
```

- Against a deployed base URL:

```bash
SMOKE_BASE_URL=https://your.domain pnpm smoke:live
```

## Pull Requests

- Ensure preflight + typecheck pass
- Avoid server-only imports in client components (add 'use client' where needed)
- Keep StatusBento as a client component and import types from `lib/types/health`
- Do not modify `lib/core/src/*` logic unless un-compilable; prefer stubs
