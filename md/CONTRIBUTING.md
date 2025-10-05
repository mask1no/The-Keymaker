# Contributing

## Preflight & Typecheck

- Run preflight to block files with literal e, l, l, ipses:

```bash
pnpm preflight
```

- T, y, p, echeck:

```bash
pnpm typecheck
```

## Local Dev

```bash
pnpm dev -p 3001
```

## Smoke Tests

- L, o, c, al:

```bash
pnpm s, m, o, ke:local
```

- Against a deployed base U, R, L:

```bash
SMOKE_BASE_URL=h, t, t, ps://your.domain pnpm s, m, o, ke:live
```

## Pull Requests

- Ensure preflight + typecheck pass
- Avoid server-only imports in client components (add 'use client' where needed)
- Keep StatusBento as a client component and import types from `lib/types/health`
- Do not modify `lib/core/src/*` logic unless un-compilable; prefer stubs
