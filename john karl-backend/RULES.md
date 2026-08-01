# Engineering Rules

`AGENTS.md` is the canonical concise instruction file. This document records the extended team policy.

## Scope and Change Discipline

- Keep changes limited to the requested behavior.
- Preserve `/api/v1` paths and response envelopes unless a contract change is intentional.
- Do not mix refactors with feature or bug-fix work without recording the reason.
- Do not edit generated output in `dist/` or commit runtime files, logs, coverage, or secrets.

## API Contracts

- Validate params, query, and body with Zod before controller execution.
- Controllers translate HTTP input/output; services own business logic.
- Throw `ApiError` for expected failures and use response helpers for success responses.
- A route change is incomplete until Swagger, Postman, and relevant tests match.
- Avoid exposing Mongoose documents directly; use presenters/public types.

## Security and Privacy

- Never commit `.env`, access keys, passwords, tokens, private user data, or production database URLs.
- Apply authentication before protected handlers and explicit role authorization for admin actions.
- Keep upload count, size, and MIME restrictions explicit.
- Do not log credentials, tokens, reset codes, or private memory content.

## Data and Integrations

- Scope MongoDB queries to the authenticated owner or explicitly authorized access.
- Clean up newly uploaded S3 objects when a database operation fails.
- Do not silently report success after email or S3 failures.
- Cover scheduler and request-state behavior when legacy-access timing changes.

## Quality Gate

- Format changed files with Prettier.
- Run ESLint, TypeScript checks, and relevant tests.
- Record follow-up work in `TASKS.md` and milestones in `UPDATE.md`.
