# Testing

The repository uses Vitest with a Node environment. Tests live in `tests/**/*.test.ts`.

## Commands

```bash
pnpm test
pnpm test:watch
pnpm exec vitest run tests/auth.routes.test.ts
pnpm exec vitest run -t "rejects an invalid token"
pnpm typecheck
pnpm lint
```

## Expectations

- Route tests verify status, response envelope, validation, auth, and middleware.
- Service tests verify business rules, persistence interactions, and authorization.
- Reset mocks and environment-dependent state between tests.
- Cover happy path, invalid input, missing auth, forbidden roles, and missing resources.
- For uploads, cover limits, accepted fields, cleanup, and S3 failures.
- For paginated endpoints, verify both `data` and `meta`.
- Update tests, Swagger, and Postman together for contract changes.

## Full Pre-Handoff Check

```bash
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Tests using real MongoDB, S3, or Gmail must use isolated non-production resources.
