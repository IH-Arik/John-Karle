# John Karle Backend

REST API for the John Karle platform. It provides authentication, user and family management, trusted contacts, legacy access, memory-vault storage, notifications, report/feedback workflows, and administrative operations.

## Stack

- Node.js, TypeScript, Express 5
- MongoDB with Mongoose
- Zod request validation
- JWT access and refresh tokens
- AWS S3 uploads
- Gmail SMTP via Nodemailer
- Swagger/OpenAPI, Vitest, ESLint, Prettier

## Local Setup

Requirements: Node.js 20+ (Node.js 22 LTS recommended), pnpm 10, and MongoDB.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The default server is `http://localhost:5200`.

## Useful URLs

- API root: `http://localhost:5200/api/v1`
- Health: `http://localhost:5200/health`
- Swagger UI: `http://localhost:5200/docs`
- OpenAPI JSON: `http://localhost:5200/docs.json`

## Commands

| Command          | Purpose                           |
| ---------------- | --------------------------------- |
| `pnpm dev`       | Start once with `tsx`             |
| `pnpm dev:watch` | Restart on source changes         |
| `pnpm build`     | Compile TypeScript to `dist/`     |
| `pnpm start`     | Run the compiled server           |
| `pnpm typecheck` | Check TypeScript without emitting |
| `pnpm lint`      | Run ESLint                        |
| `pnpm test`      | Run the Vitest suite              |

## Documentation

- [Architecture](ARCHITECTURE.md)
- [API overview](API_DOCUMENTATION.md)
- [Environment variables](ENVIRONMENT.md)
- [Testing](TESTING.md)
- [Deployment](DEPLOYMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)
- [Task tracker](TASKS.md)
- [Project updates](UPDATE.md)

Never commit `.env` or real credentials. Use `.env.example` for safe placeholders only.
