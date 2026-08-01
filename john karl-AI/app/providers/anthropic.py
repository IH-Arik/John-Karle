from anthropic import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncAnthropic,
    RateLimitError,
)

from app.core.errors import ProviderError
from app.providers.base import AIProvider, ProviderRequest, ProviderResult


class AnthropicAIProvider(AIProvider):
    name = "anthropic"

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout_seconds: float,
        max_retries: int,
    ) -> None:
        self._model = model
        self._client = AsyncAnthropic(
            api_key=api_key,
            timeout=timeout_seconds,
            max_retries=max_retries,
        )

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                system=request.system_prompt or "",
                messages=[{"role": "user", "content": request.prompt}],
            )
        except APITimeoutError as error:
            raise TimeoutError from error
        except RateLimitError as error:
            raise ProviderError("AI provider rate limit exceeded.") from error
        except APIConnectionError as error:
            raise ProviderError("AI provider could not be reached.") from error
        except APIStatusError as error:
            raise ProviderError("AI provider rejected the request.") from error

        output = "".join(
            block.text for block in response.content if block.type == "text"
        ).strip()
        if not output:
            raise ProviderError("AI provider returned no text output.")

        return ProviderResult(
            output=output,
            model=response.model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )

    async def healthcheck(self) -> bool:
        # Avoid a billable API request. Construction validates local configuration;
        # live provider failures are reported by the inference endpoint.
        return bool(self._model)

    async def close(self) -> None:
        await self._client.close()
