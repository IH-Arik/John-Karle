# Environment Variables

Copy `.env.example` to `.env.local`.

| Variable              | Required    | Purpose                              |
| --------------------- | ----------- | ------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Recommended | Backend base URL including `/api/v1` |

Local value:

```env
NEXT_PUBLIC_API_URL=http://localhost:5200/api/v1
```

Production example:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

## Rules

- `NEXT_PUBLIC_*` values are embedded into browser-delivered JavaScript.
- Never put passwords, database URLs, AWS keys, JWT secrets, or private tokens in a public variable.
- Use a backend URL reachable from the end user's browser.
- Match the backend `CORS_ORIGIN` to the deployed dashboard origin.
- Restart or rebuild after changing the value.
- Keep `.env.local` out of Git; only safe placeholders belong in `.env.example`.
