from app.providers.base import (
    AIProvider,
    ChatRequest,
    ChatResult,
    Citation,
    DocumentBlock,
    ProviderRequest,
    ProviderResult,
    QuoteRequest,
    QuoteResult,
)

_STOPWORDS = {
    "the", "a", "an", "is", "was", "were", "did", "do", "does", "what",
    "when", "where", "who", "how", "on", "in", "at", "to", "of", "and",
    "or", "for", "her", "his", "she", "he", "it", "with", "about",
}


def _keywords(text: str) -> set[str]:
    return {
        word.strip(".,?!'\"").lower()
        for word in text.split()
        if word.strip(".,?!'\"").lower() not in _STOPWORDS and len(word.strip(".,?!'\"")) > 2
    }


def _truncate_at_word_boundary(text: str, max_length: int) -> str:
    """Truncate without cutting a word in half (e.g. "Aqua t...")."""
    if len(text) <= max_length:
        return text
    truncated = text[:max_length]
    last_space = truncated.rfind(" ")
    if last_space > 0:
        truncated = truncated[:last_space]
    return truncated.rstrip(",.;: ") + "..."


class MockAIProvider(AIProvider):
    name = "mock"

    def __init__(self, model: str) -> None:
        self._model = model

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        normalized_prompt = " ".join(request.prompt.split())
        output = f"Mock response: {normalized_prompt}"[: request.max_tokens * 4]
        return ProviderResult(
            output=output,
            model=self._model,
            input_tokens=max(1, len(request.prompt) // 4),
            output_tokens=max(1, len(output) // 4),
        )

    async def chat(self, request: ChatRequest) -> ChatResult:
        """Deterministic, no-network stand-in for grounded chat.

        Answers only when at least one provided document shares a
        non-trivial keyword with the question — otherwise it declines,
        mirroring the real grounding behavior tests rely on.
        """
        question_keywords = _keywords(request.question)
        matched: DocumentBlock | None = None
        for document in request.documents:
            if question_keywords & _keywords(document.text):
                matched = document
                break

        if matched is None:
            text = "I don't have that information in the provided memories."
            citations: tuple[Citation, ...] = ()
        else:
            text = f"Mock grounded answer based on '{matched.title}'."
            citations = (
                Citation(
                    document_title=matched.title,
                    cited_text=_truncate_at_word_boundary(matched.text, 80),
                ),
            )

        return ChatResult(
            text=text,
            citations=citations,
            model=self._model,
            input_tokens=max(1, len(request.question) // 4),
            output_tokens=max(1, len(text) // 4),
        )

    async def generate_quote(self, request: QuoteRequest) -> QuoteResult:
        """Deterministic, no-network stand-in for quote/commentary generation.

        Builds a structurally valid pull-quote + commentary from the first
        line of the rendered memory text, without any real creativity --
        enough for tests to exercise the request/response shape and the
        "Lineage.AI" self-reference rule deterministically.
        """
        lines = [line for line in request.memory_text.splitlines() if line.strip()]
        narrative_line = next(
            (line for line in lines if line.startswith("Narrative:")), lines[-1] if lines else ""
        )
        snippet = (
            _truncate_at_word_boundary(narrative_line.removeprefix("Narrative:").strip(), 80)
            or "this memory"
        )

        pull_quote = f"A quiet moment worth remembering: {snippet}"
        commentary = (
            "This is exactly what Lineage.AI helps preserve -- a small, genuine "
            "moment brought back into view."
        )

        return QuoteResult(
            pull_quote=pull_quote,
            commentary=commentary,
            model=self._model,
            input_tokens=max(1, len(request.memory_text) // 4),
            output_tokens=max(1, len(pull_quote + commentary) // 4),
        )

    async def healthcheck(self) -> bool:
        return True
