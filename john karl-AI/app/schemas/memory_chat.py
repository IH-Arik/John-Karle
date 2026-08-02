from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.inference import Usage
from app.schemas.memory import MemoryItem

__all__ = ["MemoryItem", "MemoryChatRequest", "CitationOut", "MemoryChatResponse"]


class MemoryChatRequest(BaseModel):
    """Request shape sent by `john karl-backend` for one chat turn.

    `conversation_id` identifies the chat thread; `john karl-AI` owns and
    persists conversation history keyed by this ID (see
    `app.services.conversation_store`) — the backend does not resend prior
    turns itself.
    """

    model_config = ConfigDict(extra="forbid")

    conversation_id: str = Field(min_length=1, max_length=200)
    person: str = Field(min_length=1, max_length=120)
    question: str = Field(min_length=1, max_length=2000)
    memories: list[MemoryItem] = Field(default_factory=list, max_length=200)

    @field_validator("conversation_id", "person", "question")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must not be blank.")
        return value


class CitationOut(BaseModel):
    memory_title: str
    cited_text: str


class MemoryChatResponse(BaseModel):
    success: bool = True
    request_id: str
    answer: str
    citations: list[CitationOut]
    usage: Usage
    latency_ms: float
