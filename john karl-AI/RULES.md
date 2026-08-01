# Engineering Rules

## Boundaries

- API endpoints validate and translate HTTP only.
- Services orchestrate safety, timeout, provider calls, and response mapping.
- Providers isolate vendor/local-model SDKs.
- Core modules own configuration, errors, security, and logging.
- Domain schemas must not depend on provider SDK types.

## AI Safety and Privacy

- Never log raw prompts, system prompts, model output, API keys, or personal data.
- Do not enable an external provider until data handling is explicitly approved.
- Treat prompts, retrieved documents, and tool results as untrusted content.
- Apply size limits and timeouts to every inference request.
- Provider-specific moderation and PII controls must be added with a real provider.

## Reliability

- Map provider failures to stable application errors.
- Keep readiness dependent on provider health.
- Avoid hidden retries; document any retry and cost behavior.
- Include request IDs in responses and logs.
- Do not expose provider stack traces to clients.

## Quality Gate

- Run Ruff, mypy, and pytest.
- Test authentication, guardrails, timeouts, and provider errors.
- Update `.env.example`, architecture, tasks, and updates when behavior changes.
