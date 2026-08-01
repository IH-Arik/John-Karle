# Deployment

The dashboard can run on Vercel or any Node.js host that supports Next.js.

## Build and Start

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm start
```

## Environment

Set:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

The value is compiled into the client bundle. Changing it requires a new build/deployment.

## Backend Coordination

- Add the dashboard origin to backend `CORS_ORIGIN`.
- Confirm HTTPS for both dashboard and API.
- Verify `/auth/login`, `/auth/me`, and `/auth/refresh`.
- Ensure admin and super-admin roles match the dashboard operations.

## Pre-Deploy

- Install from `pnpm-lock.yaml`.
- Run `pnpm typecheck` and `pnpm build`.
- Smoke-test sign-in and critical admin flows against the target API.
- Confirm no `.env.local`, tokens, or source maps containing secrets are included.

## Rollback

Redeploy the last known-good build with its matching public API URL. Verify sign-in, session restoration, dashboard metrics, and one read/write admin flow.
