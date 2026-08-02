from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.inference import Usage
from app.schemas.memory import MemoryItem


class MemoryQuoteRequest(BaseModel):
    """Request shape sent by `john karl-backend` to generate (or regenerate)
    the AI pull-quote + commentary for one memory.

    Asynchronous/best-effort from the backend's perspective (see
    PRODUCTION_READINESS.md "Phase 2 Decisions (Locked)") -- the backend
    does not block memory creation/edit on this call.
    """

    model_config = ConfigDict(extra="forbid")

    memory_id: str = Field(min_length=1, max_length=200)
    person: str = Field(min_length=1, max_length=120)
    memory: MemoryItem

    @field_validator("memory_id", "person")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must not be blank.")
        return value


class MemoryQuoteResponse(BaseModel):
    success: bool = True
    request_id: str
    pull_quote: str
    commentary: str
    usage: Usage
    latency_ms: float


class CachedMemoryQuoteResponse(BaseModel):
    """Returned by the cheap, no-model-call fetch path -- what the detail
    screen reads on every view, as opposed to `MemoryQuoteResponse` which
    only comes from an actual generation call."""

    success: bool = True
    memory_id: str
    pull_quote: str
    commentary: str
