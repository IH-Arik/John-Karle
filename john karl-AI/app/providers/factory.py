from app.core.config import Settings
from app.providers.anthropic import AnthropicAIProvider
from app.providers.base import AIProvider
from app.providers.mock import MockAIProvider


def build_provider(settings: Settings) -> AIProvider:
    if settings.ai_provider == "mock":
        return MockAIProvider(model=settings.ai_model or "mock-v1")

    if settings.ai_provider == "anthropic":
        if settings.anthropic_api_key is None:
            raise ValueError("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic.")
        return AnthropicAIProvider(
            api_key=settings.anthropic_api_key.get_secret_value(),
            model=settings.ai_model or "claude-sonnet-4-6",
            timeout_seconds=settings.ai_timeout_seconds,
            max_retries=settings.anthropic_max_retries,
        )

    raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")
