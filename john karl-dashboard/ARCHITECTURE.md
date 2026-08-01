# Architecture

## Application Flow

```text
Next.js root layout
  -> Redux Provider
  -> SessionBootstrap
  -> page/client component
  -> RTK Query hook
  -> authenticated fetchBaseQuery
  -> John Karle backend /api/v1
```

## Entry Points

- `app/layout.tsx` defines metadata, global CSS, and providers.
- `app/providers.tsx` mounts the Redux store and session bootstrap.
- `app/page.tsx` renders the authenticated dashboard shell and section navigation.
- `app/auth/signin/page.tsx` handles login and password-reset entry.

## UI Organization

- `app/components/<feature>/` contains feature sections such as AI insights, bulk email, configuration, admin creation, profile, reports, settings, and billing.
- `app/globals.css` contains Tailwind imports and global styling.
- `public/` contains logos and dashboard imagery.
- Some dashboard sections still live directly in the large `app/page.tsx`; new feature work should prefer extracted components.

## State and API

- `lib/store.ts` configures Redux and RTK Query middleware.
- `lib/api.ts` defines API calls, cache tags, response transforms, authorization headers, and token refresh.
- `lib/auth-slice.ts` holds the current user and bootstrap state.
- `lib/auth-storage.ts` stores access token, refresh token, and cached user in browser `localStorage`.
- `lib/types.ts` defines the API-facing TypeScript shapes.

## Authentication Lifecycle

1. Login sends credentials to `/auth/login`.
2. Tokens and user data are saved in `localStorage` and Redux.
3. `SessionBootstrap` restores local state and validates it with `/auth/me`.
4. API calls attach the access token.
5. A `401` triggers `/auth/refresh`, stores new tokens, and retries once.
6. Failed refresh clears stored auth and Redux session.

Because tokens are stored in `localStorage`, any XSS issue can expose them. Avoid unsafe HTML and third-party scripts; a future server-managed HttpOnly-cookie design would reduce this risk.

## Navigation

`/auth/signin` is a route. The main dashboard currently switches sections through client state in `app/page.tsx`; those sections do not have independent URLs. Preserve that behavior unless route-based navigation is an explicit product change.
