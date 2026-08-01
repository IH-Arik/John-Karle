# Contributing

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev:watch
```

Use a local/test MongoDB database and non-production integration credentials.

## Workflow

1. Create a focused branch from the default branch.
2. Record multi-step work in `TASKS.md`.
3. Follow the closest existing module pattern.
4. Add or update tests and contract documentation.
5. Run validation.
6. Add meaningful completed work to `UPDATE.md`.

## Validation

```bash
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Focused test:

```bash
pnpm exec vitest run tests/auth.routes.test.ts
```

## API Change Checklist

- Route and middleware order are correct.
- Zod params/query/body schemas match.
- Swagger and Postman are updated.
- Tests cover success, authorization, validation, and failure cases.
- Dashboard consumers are updated for response changes.

Never include real secrets or personal data in commits, fixtures, screenshots, or examples.
