import asyncio
from time import perf_counter

from app.core.config import Settings
from app.core.errors import AppError, ProviderError
from app.providers.base import AIProvider, ProviderRequest
from app.schemas.inference import GenerateRequest, GenerateResponse, Usage
from app.services.safety import PromptSafetyService


class InferenceService:
    def __init__(
        self,
        *,
        provider: AIProvider,
        safety: PromptSafetyService,
        settings: Settings,
    ) -> None:
        self._provider = provider
        self._safety = safety
        self._settings = settings

    async def ready(self) -> bool:
        try:
            async with asyncio.timeout(min(self._settings.ai_timeout_seconds, 5)):
                return await self._provider.healthcheck()
        except Exception:
            return False

    async def generate(self, payload: GenerateRequest, *, request_id: str) -> GenerateResponse:
        self._safety.validate(payload.prompt, payload.system_prompt)
        max_tokens = payload.max_tokens or self._settings.ai_default_max_tokens
        if max_tokens > self._settings.ai_max_output_tokens:
            raise AppError(
                code="MAX_TOKENS_EXCEEDED",
                message="Requested output exceeds the configured token limit.",
                status_code=400,
            )

        provider_request = ProviderRequest(
            prompt=payload.prompt,
            system_prompt=payload.system_prompt,
            temperature=payload.temperature,
            max_tokens=max_tokens,
        )
        started = perf_counter()

        try:
            async with asyncio.timeout(self._settings.ai_timeout_seconds):
                result = await self._provider.generate(provider_request)
        except TimeoutError as error:
            raise AppError(
                code="AI_TIMEOUT",
                message="The AI provider timed out.",
                status_code=504,
            ) from error
        except AppError:
            raise
        except Exception as error:
            raise ProviderError() from error

        return GenerateResponse(
            request_id=request_id,
            provider=self._provider.name,
            model=result.model,
            output=result.output,
            usage=Usage(
                input_tokens=result.input_tokens,
                output_tokens=result.output_tokens,
            ),
            latency_ms=round((perf_counter() - started) * 1000, 2),
        )
