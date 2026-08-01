# Agent Instructions

## Package Manager

- Use **pnpm 10**: `pnpm install`, `pnpm dev`, `pnpm test`.
- Treat `pnpm-lock.yaml` as the canonical lockfile.

## Commands

| Task            | Command          |
| --------------- | ---------------- |
| Development     | `pnpm dev`       |
| Watch mode      | `pnpm dev:watch` |
| Typecheck       | `pnpm typecheck` |
| Lint repository | `pnpm lint`      |
| Build           | `pnpm build`     |
| Test suite      | `pnpm test`      |

## File-Scoped Commands

| Task               | Command                                   |
| ------------------ | ----------------------------------------- |
| Lint a file        | `pnpm exec eslint src/path/file.ts`       |
| Run one test file  | `pnpm exec vitest run tests/path.test.ts` |
| Run matching tests | `pnpm exec vitest run -t "test name"`     |

## Key Conventions

- Keep the flow `routes -> validation/middleware -> controller -> service -> model/presenter`.
- Use `asyncHandler`, `ApiError`, and the response helpers in `src/utils/`.
- Validate request params, query, and body with Zod before controllers.
- Keep route prefixes under `/api/v1`; preserve the standard response envelope.
- When a route contract changes, update its `*.swagger.ts`, tests, and Postman collection.
- Add environment keys to both `src/config/env.config.ts` and `.env.example`; never commit secrets.
- Store persistent files in S3 through the existing module service patterns.
- Read `ARCHITECTURE.md`, `API_DOCUMENTATION.md`, and `RULES.md` before structural changes.

## Validation

- Run the narrowest relevant test first.
- Before handoff, run `pnpm typecheck`, `pnpm lint`, and relevant tests.
- Run `pnpm test` for shared middleware, auth, or cross-module changes.

## Commit Attribution

AI commits MUST include:

```text
Co-Authored-By: (the agent model's name and attribution byline)
```
