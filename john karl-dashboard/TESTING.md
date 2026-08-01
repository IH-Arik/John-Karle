# Testing

Automated tests are not currently configured. The existing quality gates are:

```bash
pnpm typecheck
pnpm build
```

## Manual Smoke Test

1. Start the backend and dashboard with local environment files.
2. Visit `/auth/signin`.
3. Verify invalid and valid login behavior.
4. Reload and confirm session restoration.
5. Verify a protected API call and token refresh.
6. Check dashboard metrics, users, email, reports, notifications, profile, and settings affected by the change.
7. Verify loading, empty, server-error, unauthorized, and forbidden states.
8. Check responsive layout and keyboard navigation.
9. Logout and confirm stored session data is cleared.

## Recommended Test Baseline

When test infrastructure is added:

- Use Vitest and React Testing Library for components and hooks.
- Mock the API boundary with MSW.
- Cover auth bootstrap, successful refresh, failed refresh, and protected navigation first.
- Add end-to-end coverage for login, critical admin operations, and logout.
- Add `test`, `test:watch`, and `lint` scripts to `package.json` and update `AGENTS.md`.
