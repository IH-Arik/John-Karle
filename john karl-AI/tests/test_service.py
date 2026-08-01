import asyncio

import pytest

from app.core.config import Settings
from app.core.errors import AppError, ProviderError
from app.providers.base import AIProvider, ProviderRequest, ProviderResult
from app.schemas.inference import GenerateRequest
from app.services.inference import InferenceService
from app.services.safety import PromptSafetyService


class SlowProvider(AIProvider):
    name = "slow"

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        await asyncio.sleep(0.05)
        return ProviderResult(output=request.prompt, model="slow-v1")

    async def healthcheck(self) -> bool:
        return True


class FailingProvider(AIProvider):
    name = "failing"

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        raise RuntimeError(request.prompt)

    async def healthcheck(self) -> bool:
        return False


def build_service(provider: AIProvider, settings: Settings) -> InferenceService:
    return InferenceService(
        provider=provider,
        safety=PromptSafetyService(settings),
        settings=settings,
    )


def test_maps_provider_timeout() -> None:
    settings = Settings(ai_timeout_seconds=0.001)
    service = build_service(SlowProvider(), settings)

    with pytest.raises(AppError) as error:
        asyncio.run(service.generate(GenerateRequest(prompt="Hello"), request_id="request-1"))

    assert error.value.code == "AI_TIMEOUT"


def test_maps_unknown_provider_failure() -> None:
    settings = Settings()
    service = build_service(FailingProvider(), settings)

    with pytest.raises(ProviderError) as error:
        asyncio.run(service.generate(GenerateRequest(prompt="Hello"), request_id="request-1"))

    assert error.value.code == "AI_PROVIDER_ERROR"
