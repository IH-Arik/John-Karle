# Engineering Rules

`AGENTS.md` is the canonical concise instruction file. This document records the extended team policy.

## UI Structure

- Keep route files focused on composition and navigation.
- Put reusable or feature-sized UI in `app/components/<feature>/`.
- Keep data fetching in RTK Query rather than ad hoc component `fetch` calls.
- Share backend shapes through `lib/types.ts`.
- Preserve responsive and keyboard-accessible behavior when changing interactions.

## State and Authentication

- Use Redux for shared session/API state and local component state for transient UI.
- Access `localStorage` only in browser-safe code.
- Do not duplicate refresh-token logic outside `lib/api.ts`.
- Clear stored credentials and session state together.
- Never log or render access tokens, refresh tokens, or passwords.

## API Contracts

- Keep the `/api/v1` base prefix in environment configuration.
- Transform API envelopes in the API layer.
- Maintain accurate cache tags after mutations.
- Handle loading, empty, error, and permission states.
- Coordinate response-shape changes with backend Swagger, Postman, and tests.

## Quality Gate

- Run `pnpm typecheck` for every TypeScript change.
- Run `pnpm build` for routing, config, dependency, or production-facing changes.
- Manually verify affected flows until automated tests are configured.
- Record follow-up work in `TASKS.md` and meaningful milestones in `UPDATE.md`.
