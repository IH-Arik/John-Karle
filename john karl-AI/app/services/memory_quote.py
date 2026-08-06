import asyncio
from time import perf_counter

from app.core.config import Settings
from app.core.errors import AppError, ProviderError
from app.providers.base import AIProvider, QuoteRequest
from app.schemas.inference import Usage
from app.schemas.memory import MemoryItem
from app.schemas.memory_quote import (
    CachedMemoryQuoteResponse,
    MemoryQuoteRequest,
    MemoryQuoteResponse,
)
from app.services.memory_quote_store import MemoryQuoteStore, StoredQuote
from app.services.memory_rendering import render_memory_text
from app.services.safety import PromptSafetyService

# Locked decisions -- see PRODUCTION_READINESS.md "Phase 2 Decisions
# (Locked)". Do not change without the user reopening those decisions.
_QUOTE_SYSTEM_PROMPT_TEMPLATE = """You are Lineage.AI. Given one family \
memory about {person}, write two things: a short, evocative pull-quote \
capturing its mood, and a brief reflective commentary paragraph.

Rules:
1. Speak about {person} in the third person; never write as if you are \
{person}.
2. You may use poetic, evocative language -- metaphor, imagery -- to \
express the mood and feeling already present in the memory's narrative. \
You must never invent new factual content: no new events, people, or \
specific details that are not stated or clearly implied in the source. \
When uncertain, favor emotional or atmospheric elaboration over inventing \
facts.
3. {type_guidance}
4. Where it feels natural, let the commentary paragraph speak to what \
Lineage.AI helps preserve about moments like this one.
5. Write in English only.
6. Both the pull-quote and the commentary must be your own original \
phrasing, not a verbatim copy or a lightly-reworded restatement of the \
narrative's sentences. Express what happened and its mood in new words; \
the commentary should read as reflection on the memory, not as the \
narrative repeated back. Do not wrap the pull-quote in quotation marks; \
the interface adds its own quote styling.
7. Write like a person reflecting quietly, not like an AI assistant. Do \
not use em dashes (--) at all -- use a comma, period, or "and" instead. \
Avoid stock phrasing patterns that read as generated rather than felt.

Respond in exactly this format, with no other text before or after:
PULL_QUOTE: <the pull-quote itself, one or two sentences, no quotation marks>
COMMENTARY: <the reflective paragraph, two to four sentences>"""

_VISUAL_TYPE_GUIDANCE = (
    "This memory is visual (a photo or video), so lean on scenic, visual imagery."
)
_WRITTEN_TYPE_GUIDANCE = (
    "This memory is written or spoken (a journal entry or voice recording), "
    "so lean on the voice and words already present in the narrative."
)


class MemoryQuoteService:
    def __init__(
        self,
        *,
        provider: AIProvider,
        safety: PromptSafetyService,
        settings: Settings,
        store: MemoryQuoteStore,
    ) -> None:
        self._provider = provider
        self._safety = safety
        self._settings = settings
        self._store = store

    async def get_cached(self, memory_id: str) -> CachedMemoryQuoteResponse | None:
        """Cheap fetch path, no model call -- what the detail screen reads
        on every view. Returns None if nothing has been generated yet."""
        stored = await self._store.get(memory_id)
        if stored is None:
            return None
        return CachedMemoryQuoteResponse(
            memory_id=memory_id,
            pull_quote=stored.pull_quote,
            commentary=stored.commentary,
        )

    async def generate(
        self, payload: MemoryQuoteRequest, *, request_id: str
    ) -> MemoryQuoteResponse:
        self._validate_input_size(payload.memory)

        memory_text = render_memory_text(payload.memory)
        system_prompt = _QUOTE_SYSTEM_PROMPT_TEMPLATE.format(
            person=payload.person,
            type_guidance=self._type_guidance(payload.memory),
        )

        started = perf_counter()
        try:
            async with asyncio.timeout(self._settings.ai_timeout_seconds):
                result = await self._provider.generate_quote(
                    QuoteRequest(
                        system_prompt=system_prompt,
                        memory_text=memory_text,
                        max_tokens=self._settings.ai_default_max_tokens,
                    )
                )
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

        await self._store.save(
            payload.memory_id,
            StoredQuote(pull_quote=result.pull_quote, commentary=result.commentary),
        )

        return MemoryQuoteResponse(
            request_id=request_id,
            pull_quote=result.pull_quote,
            commentary=result.commentary,
            usage=Usage(input_tokens=result.input_tokens, output_tokens=result.output_tokens),
            latency_ms=round((perf_counter() - started) * 1000, 2),
        )

    def _validate_input_size(self, memory: MemoryItem) -> None:
        self._safety.validate(memory.narrative, None)
        combined_length = len(memory.narrative) + len(memory.title)
        if combined_length > self._settings.ai_max_input_chars:
            raise AppError(
                code="INPUT_TOO_LARGE",
                message="The provided memory exceeds the configured size limit.",
                status_code=413,
            )

    @staticmethod
    def _type_guidance(memory: MemoryItem) -> str:
        if memory.type in ("photo", "video"):
            return _VISUAL_TYPE_GUIDANCE
        return _WRITTEN_TYPE_GUIDANCE
