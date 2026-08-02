from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ProviderRequest:
    prompt: str
    system_prompt: str | None
    temperature: float
    max_tokens: int


@dataclass(frozen=True, slots=True)
class ProviderResult:
    output: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


@dataclass(frozen=True, slots=True)
class DocumentBlock:
    """A grounding source document (e.g. one memory's narrative) offered to the model."""

    title: str
    text: str


@dataclass(frozen=True, slots=True)
class ChatTurn:
    role: str
    content: str


@dataclass(frozen=True, slots=True)
class Citation:
    document_title: str
    cited_text: str


@dataclass(frozen=True, slots=True)
class ChatRequest:
    system_prompt: str
    documents: tuple[DocumentBlock, ...]
    history: tuple[ChatTurn, ...]
    question: str
    max_tokens: int


@dataclass(frozen=True, slots=True)
class ChatResult:
    text: str
    citations: tuple[Citation, ...]
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


@dataclass(frozen=True, slots=True)
class QuoteRequest:
    system_prompt: str
    memory_text: str
    max_tokens: int


@dataclass(frozen=True, slots=True)
class QuoteResult:
    pull_quote: str
    commentary: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class AIProvider(ABC):
    name: str

    @abstractmethod
    async def generate(self, request: ProviderRequest) -> ProviderResult:
        raise NotImplementedError

    @abstractmethod
    async def healthcheck(self) -> bool:
        raise NotImplementedError

    async def chat(self, request: ChatRequest) -> ChatResult:
        """Multi-turn, document-grounded chat used by the Memory Chat feature.

        Not an abstractmethod: existing single-turn providers/test doubles that
        only exercise `generate()` should not be forced to implement this.
        """
        raise NotImplementedError(f"{type(self).__name__} does not support chat().")

    async def generate_quote(self, request: QuoteRequest) -> QuoteResult:
        """Generates the AI pull-quote + reflective commentary for one memory.

        Not an abstractmethod, for the same reason as `chat()` above.
        """
        raise NotImplementedError(f"{type(self).__name__} does not support generate_quote().")

    async def close(self) -> None:
        return None
