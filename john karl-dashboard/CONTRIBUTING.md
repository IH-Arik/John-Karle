# Contributing

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Use a non-production backend and test accounts.

## Workflow

1. Create a focused branch from the default branch.
2. Record multi-step work in `TASKS.md`.
3. Reuse the nearest component and RTK Query patterns.
4. Keep API types, endpoint definitions, and UI states synchronized.
5. Run validation and manually exercise the changed flow.
6. Record meaningful completed work in `UPDATE.md`.

## Validation

```bash
pnpm typecheck
pnpm build
```

There is no configured lint or automated test script. Do not claim those checks ran.

## Review Checklist

- Desktop and mobile layouts remain usable.
- Mouse, keyboard, focus, labels, loading, empty, and error states work.
- Protected data is not rendered before session initialization.
- Mutations invalidate the correct RTK Query cache tags.
- New public environment values are documented and contain no secrets.
- Backend contract changes are coordinated with the backend repository.
