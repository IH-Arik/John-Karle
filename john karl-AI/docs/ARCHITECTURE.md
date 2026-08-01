# Architecture

## Style

The service is a layered FastAPI modular application:

```text
HTTP endpoint
  -> optional API-key authentication
  -> Pydantic request validation
  -> inference service
  -> input safety guard
  -> timeout boundary
  -> provider adapter
  -> provider-neutral response
```

## Structure

```text
app/
├── api/                 Versioned routing and dependencies
├── core/                Configuration, errors, logging, security
├── middleware/          Request context and access logging
├── providers/           Vendor/local-model adapters
├── schemas/             Provider-neutral API contracts
├── services/            Inference orchestration and safety
└── main.py              Application factory and lifespan
```

## Provider Boundary

`AIProvider` defines `generate()` and `healthcheck()`. Endpoints never import provider SDKs. `build_provider()` selects the configured adapter during application lifespan.

`MockAIProvider` is deterministic and makes no network request. `AnthropicAIProvider` uses the async Anthropic SDK and normalizes Claude text and token usage. A real adapter must:

1. Keep credentials in environment/secret management.
2. Set SDK/network timeouts.
3. Convert provider errors into `ProviderError`.
4. Return normalized token/usage data.
5. Add provider-specific moderation, PII, and prompt-injection controls.
6. Define retry, fallback, latency, and cost behavior.

## Security

- Health routes are public.
- AI routes require `X-API-Key` only when `INTERNAL_API_KEY` is configured.
- API keys are compared with `secrets.compare_digest`.
- Prompts and outputs are excluded from access logs.
- Input length and output-token limits are centrally configured.
- A basic prompt-injection guard blocks common direct override/exfiltration patterns.

The injection guard is a starter control, not a complete defense. RAG/tool systems must keep instructions separate from retrieved content and constrain tool permissions.

## Runtime

Application lifespan builds one provider and one inference service per process. Readiness calls the provider health check. Request middleware assigns/propagates `X-Request-ID` and logs method, path, status, and latency.

The Anthropic health check intentionally performs no remote inference, so it verifies local configuration rather than account credit, credential validity, or upstream availability. This prevents readiness probes from creating billable requests.

## Scaling

The application is stateless with the mock provider and can run multiple replicas. Before adding real workloads, define:

- Provider rate/concurrency limits
- Per-tenant authentication and quotas
- Shared rate limiting
- Retry and circuit-breaker behavior
- Streaming requirements
- Metrics, tracing, token/cost accounting
- Evaluation and rollout gates
