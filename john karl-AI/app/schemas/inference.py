from pydantic import BaseModel, ConfigDict, Field, field_validator


class GenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(min_length=1)
    system_prompt: str | None = None
    temperature: float = Field(default=0.2, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=1)

    @field_validator("prompt", "system_prompt")
    @classmethod
    def reject_blank_text(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Text must not be blank.")
        return value


class Usage(BaseModel):
    input_tokens: int | None = None
    output_tokens: int | None = None


class GenerateResponse(BaseModel):
    success: bool = True
    request_id: str
    provider: str
    model: str
    output: str
    usage: Usage
    latency_ms: float
