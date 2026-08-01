# John Karle Dashboard

Administrative dashboard for the John Karle platform. The UI currently uses Lineage.AI branding and consumes the John Karle backend API for authentication, users, metrics, email templates, reports, notifications, profile, and settings.

## Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Redux Toolkit and RTK Query
- Hugeicons

## Local Setup

Requirements: Node.js 20+ (Node.js 22 LTS recommended) and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`. The sign-in page is `/auth/signin`.

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:5200/api/v1
```

The value must include the backend `/api/v1` prefix. Restart the dev server after changing it.

## Commands

| Command          | Purpose                              |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the Next.js development server |
| `pnpm typecheck` | Check TypeScript                     |
| `pnpm build`     | Create a production build            |
| `pnpm start`     | Serve the production build           |

No automated test or lint script is currently configured.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [API integration](API_INTEGRATION.md)
- [Environment variables](ENVIRONMENT.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)
- [Task tracker](TASKS.md)
- [Project updates](UPDATE.md)
