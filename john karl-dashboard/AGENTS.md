# Agent Instructions

## Package Manager

- Use **pnpm**: `pnpm install`, `pnpm dev`, `pnpm build`.
- Treat `pnpm-lock.yaml` as canonical; do not update `package-lock.json`.

## Commands

| Task              | Command          |
| ----------------- | ---------------- |
| Development       | `pnpm dev`       |
| Typecheck         | `pnpm typecheck` |
| Production build  | `pnpm build`     |
| Production server | `pnpm start`     |

## File-Scoped Commands

- No repository lint or test runner is configured.
- TypeScript validation is project-wide: `pnpm typecheck`.
- Use `pnpm exec prettier --check path/to/file.tsx` only if Prettier is added/configured.

## Key Conventions

- Use Next.js App Router conventions under `app/`.
- Keep browser-only state and storage access in client components.
- Define backend calls and cache tags in `lib/api.ts`; share API shapes from `lib/types.ts`.
- Keep auth storage changes in `lib/auth-storage.ts` and Redux session state in `lib/auth-slice.ts`.
- Reuse components in `app/components/<feature>/`; avoid growing `app/page.tsx` for new features.
- Preserve the backend `{ success, message, data, meta }` contract.
- Add public environment keys to `.env.example`; never place secrets in `NEXT_PUBLIC_*`.
- Read `ARCHITECTURE.md`, `API_INTEGRATION.md`, and `RULES.md` before structural changes.

## Validation

- Run `pnpm typecheck` after TypeScript changes.
- Run `pnpm build` before handoff for routing, configuration, or dependency changes.
- Manually verify sign-in, token refresh, protected navigation, loading, empty, and error states.

## Commit Attribution

AI commits MUST include:

```text
Co-Authored-By: (the agent model's name and attribution byline)
```
