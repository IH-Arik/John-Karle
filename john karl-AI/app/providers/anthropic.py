import re
from typing import Any, cast

from anthropic import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncAnthropic,
    RateLimitError,
)
from anthropic.types import MessageParam

from app.core.errors import ProviderError
from app.providers.base import (
    AIProvider,
    ChatRequest,
    ChatResult,
    Citation,
    ProviderRequest,
    ProviderResult,
    QuoteRequest,
    QuoteResult,
)

# Plain-text delimited format, not `output_config.format` (JSON schema
# structured outputs) -- that feature isn't supported on every model this
# project may be configured with (e.g. claude-sonnet-4-6), so a portable
# text format plus defensive parsing is used instead.
_QUOTE_RESPONSE_PATTERN = re.compile(
    r"PULL_QUOTE:\s*(?P<quote>.*?)\s*COMMENTARY:\s*(?P<commentary>.*)",
    re.DOTALL,
)


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

    async def chat(self, request: ChatRequest) -> ChatResult:
        content_blocks: list[dict[str, Any]] = [
            {
                "type": "document",
                "source": {
                    "type": "text",
                    "media_type": "text/plain",
                    "data": document.text,
                },
                "title": document.title,
                "citations": {"enabled": True},
            }
            for document in request.documents
        ]
        content_blocks.append({"type": "text", "text": request.question})

        messages: list[dict[str, Any]] = [
            {"role": turn.role, "content": turn.content} for turn in request.history
        ]
        messages.append({"role": "user", "content": content_blocks})

        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=request.max_tokens,
                system=request.system_prompt,
                messages=cast(list[MessageParam], messages),
            )
        except APITimeoutError as error:
            raise TimeoutError from error
        except RateLimitError as error:
            raise ProviderError("AI provider rate limit exceeded.") from error
        except APIConnectionError as error:
            raise ProviderError("AI provider could not be reached.") from error
        except APIStatusError as error:
            raise ProviderError("AI provider rejected the request.") from error

        text_parts: list[str] = []
        citations: list[Citation] = []
        for block in response.content:
            if block.type != "text":
                continue
            text_parts.append(block.text)
            for citation in getattr(block, "citations", None) or []:
                citations.append(
                    Citation(
                        document_title=getattr(citation, "document_title", None) or "",
                        cited_text=getattr(citation, "cited_text", None) or "",
                    )
                )

        output = "".join(text_parts).strip()
        if not output:
            raise ProviderError("AI provider returned no text output.")

        return ChatResult(
            text=output,
            citations=tuple(citations),
            model=response.model,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )

    async def generate_quote(self, request: QuoteRequest) -> QuoteResult:
        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=request.max_tokens,
                system=request.system_prompt,
                messages=[{"role": "user", "content": request.memory_text}],
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

        match = _QUOTE_RESPONSE_PATTERN.search(output)
        if not match:
            raise ProviderError("AI provider returned an unparseable quote response.")

        # Strip all quote-mark characters, not just leading/trailing: the
        # prompt asks the model not to wrap the pull-quote in quotes, but a
        # model that partially quotes the source narrative can leave a
        # stray closing mark mid-string rather than only at the edges.
        pull_quote = match.group("quote").strip().replace('"', "").replace("“", "").replace(
            "”", ""
        ).strip()
        commentary = match.group("commentary").strip()
        if not pull_quote or not commentary:
            raise ProviderError("AI provider returned an empty quote or commentary.")

        return QuoteResult(
            pull_quote=pull_quote,
            commentary=commentary,
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
