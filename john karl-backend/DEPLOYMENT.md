# Deployment

The API can run on any Node.js host with outbound access to MongoDB, S3, and Gmail.

## Build and Start

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The host must expose `PORT` and send `SIGTERM` during shutdown.

## Required Production Configuration

- `NODE_ENV=production`
- `MONGODB_URI`
- strong, unique `JWT_SECRET`
- restricted `CORS_ORIGIN`
- `APP_BASE_URL`
- Gmail variables when email flows are enabled
- S3 variables when upload flows are enabled
- optional super-admin seed only during controlled bootstrap

See `ENVIRONMENT.md` for the complete list.

## Pre-Deploy

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Operations

- Health paths: `/health` and `/api/v1/health`.
- The process connects to MongoDB before listening.
- The legacy scheduler runs in every enabled process. Use one designated scheduler or distributed locking before multiple replicas.
- Generated S3 URLs assume uploaded objects are readable through their bucket URL.
- Store secrets in the platform secret manager, never in an image or artifact.

## Rollback

Redeploy the last known-good artifact, then verify health, login/refresh, MongoDB connectivity, and critical admin operations. Document a backward-compatible migration or restoration plan for any release that changes stored data.
