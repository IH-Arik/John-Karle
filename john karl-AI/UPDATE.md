# Project Updates

## 2026-07-30

- Created the initial provider-neutral FastAPI AI service.
- Added versioned health and inference endpoints.
- Added provider, service, schema, security, timeout, request-ID, and safety boundaries.
- Added deterministic mock inference so local development sends no data externally.
- Added tests, Docker support, environment template, and agent documentation.
- Added an opt-in Anthropic Messages API adapter using Claude Sonnet 4.6 by default.
- Added secret-only environment configuration, explicit provider timeouts, zero default SDK retries, normalized usage data, and safe provider error mapping.
- Kept readiness non-billable and added isolated provider/configuration tests.

## Update Template

```markdown
## YYYY-MM-DD

- Shipped:
- Model/provider:
- Safety:
- Evaluation:
- Validation:
```
