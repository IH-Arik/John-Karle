# Known Issues

## pnpm Install Build Approval

`pnpm install --frozen-lockfile` currently installs packages but exits with `ERR_PNPM_IGNORED_BUILDS` because `pnpm-workspace.yaml` contains:

```yaml
allowBuilds:
  sharp: set this to true or false
```

The project owner must explicitly choose whether the `sharp` install script is allowed. Do not silently change this supply-chain policy. The current dependency tree can still pass TypeScript checking and the Next.js production build after packages are present.

## Duplicate Lockfiles

Both `pnpm-lock.yaml` and `package-lock.json` are tracked. Documentation treats pnpm as canonical because `pnpm-workspace.yaml` is present. The team should confirm the package-manager policy, then remove only the non-canonical lockfile in a dedicated change.

## Automated Quality Tools

No lint or automated test script is configured. Until those are added, use `pnpm typecheck`, `pnpm build`, and the manual smoke test in `TESTING.md`.
