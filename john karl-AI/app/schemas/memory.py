from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MemoryItem(BaseModel):
    """One memory as sent by `john karl-backend` -- shared shape used by both
    Memory Chat and the AI-generated quote/commentary feature."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["photo", "video", "journal", "voice"]
    title: str = Field(min_length=1, max_length=160)
    narrative: str = Field(min_length=1, max_length=5000)
    date: str = Field(min_length=1, max_length=40)
    tags: list[str] = Field(default_factory=list, max_length=20)
    location: str | None = Field(default=None, max_length=200)
