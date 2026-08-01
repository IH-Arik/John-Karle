import asyncio
from unittest.mock import AsyncMock

import pytest
from anthropic.types import Message
from pydantic import ValidationError

from app.core.config import Settings
from app.providers.anthropic import AnthropicAIProvider
from app.providers.base import ProviderRequest
from app.providers.factory import build_provider


def make_provider() -> AnthropicAIProvider:
    return AnthropicAIProvider(
        api_key="test-key",
        model="claude-sonnet-4-6",
        timeout_seconds=1,
        max_retries=0,
    )


def test_normalizes_anthropic_response(monkeypatch: pytest.MonkeyPatch) -> None:
    provider = make_provider()
    response = Message.model_validate(
        {
            "id": "msg_test",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "text", "text": "Hello from Claude."}],
            "model": "claude-sonnet-4-6",
            "stop_reason": "end_turn",
            "stop_sequence": None,
            "usage": {"input_tokens": 8, "output_tokens": 5},
        }
    )
    create = AsyncMock(return_value=response)
    monkeypatch.setattr(provider._client.messages, "create", create)

    result = asyncio.run(
        provider.generate(
            ProviderRequest(
                prompt="Hello",
                system_prompt="Be concise.",
                temperature=0.2,
                max_tokens=128,
            )
        )
    )
    asyncio.run(provider.close())

    assert result.output == "Hello from Claude."
    assert result.model == "claude-sonnet-4-6"
    assert result.input_tokens == 8
    assert result.output_tokens == 5
    create.assert_awaited_once_with(
        model="claude-sonnet-4-6",
        max_tokens=128,
        temperature=0.2,
        system="Be concise.",
        messages=[{"role": "user", "content": "Hello"}],
    )


def test_anthropic_provider_requires_key() -> None:
    with pytest.raises(ValidationError, match="ANTHROPIC_API_KEY"):
        Settings(ai_provider="anthropic")


def test_factory_builds_anthropic_provider() -> None:
    settings = Settings(
        ai_provider="anthropic",
        anthropic_api_key="test-key",
    )

    provider = build_provider(settings)
    asyncio.run(provider.close())

    assert provider.name == "anthropic"
