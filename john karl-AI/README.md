# John Karl AI

Provider-neutral FastAPI service foundation for John Karl AI workloads. It runs locally with a deterministic mock provider and supports Anthropic Claude through an opt-in adapter.

No prompt or private data is sent externally while `AI_PROVIDER=mock`.

## Requirements

- Python 3.11+
- A virtual environment

## Setup

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload
```

macOS/Linux:

```bash
source .venv/bin/activate
python -m pip install -e ".[dev]"
cp .env.example .env
python -m uvicorn app.main:app --reload
```

Open:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Liveness: `http://localhost:8000/api/v1/health/live`
- Readiness: `http://localhost:8000/api/v1/health/ready`

## Generate Endpoint

```http
POST /api/v1/ai/generate
Content-Type: application/json
X-API-Key: <only required when INTERNAL_API_KEY is configured>

{
  "prompt": "Summarize this text.",
  "system_prompt": "Answer concisely.",
  "temperature": 0.2,
  "max_tokens": 256
}
```

The default mock provider returns deterministic output.

## Anthropic Claude

Do not paste or commit API keys. Create a fresh key, put it only in your local `.env`, and configure:

```dotenv
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-6
ANTHROPIC_API_KEY=your-new-key
```

Restart the API after changing `.env`. Requests then use Anthropic's Messages API through the async Python SDK. Provider responses are normalized to the same API contract as the mock provider.

The SDK timeout follows `AI_TIMEOUT_SECONDS`. Automatic SDK retries default to `0`; set `ANTHROPIC_MAX_RETRIES` only after defining a retry and cost policy. Readiness validates local provider configuration without making a billable Claude request.

## Commands

| Task | Command |
| --- | --- |
| Development | `python -m uvicorn app.main:app --reload` |
| Tests | `python -m pytest` |
| Lint | `python -m ruff check .` |
| Format | `python -m ruff format .` |
| Typecheck | `python -m mypy app tests` |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Agent instructions](AGENTS.md)
- [Engineering rules](RULES.md)
- [Tasks](TASKS.md)
- [Updates](UPDATE.md)
