# Project Updates

## Current State

- Default branch: `main`
- API prefix: `/api/v1`
- Runtime: Node.js, TypeScript, Express
- Database: MongoDB
- External services: AWS S3 and Gmail
- API references: Swagger and Postman

## 2026-07-30

- Added the repository documentation baseline.
- Established concise agent instructions and extended engineering rules.
- Documented the API inventory, environment variables, testing, contribution, and deployment workflows.
- Added task and update tracking.
- Synchronized `.env.example` with the environment keys parsed by the application.
- Expanded `ARCHITECTURE.md` into a full current-state technical specification covering runtime topology, module dependencies, persistence, security, lifecycle/state machines, integrations, failure behavior, scaling constraints, architectural decisions, and prioritized risks.
- Validated the architecture update with formatting, link/model/state coverage, secret scanning, TypeScript checking, and 148 passing tests.

## Update Template

```markdown
## YYYY-MM-DD

- Shipped:
- Changed:
- Validation:
- Follow-up:
```
