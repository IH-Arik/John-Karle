from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "John Karl AI"
    app_env: Literal["development", "test", "production"] = "development"
    app_host: str = "0.0.0.0"
    app_port: int = Field(default=8000, ge=1, le=65535)
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "*"

    internal_api_key: SecretStr | None = None

    ai_provider: Literal["mock", "anthropic"] = "mock"
    ai_model: str | None = None
    ai_timeout_seconds: float = Field(default=30, gt=0, le=300)
    ai_max_input_chars: int = Field(default=20_000, ge=100, le=1_000_000)
    ai_default_max_tokens: int = Field(default=512, ge=1, le=32_768)
    ai_max_output_tokens: int = Field(default=2_048, ge=1, le=32_768)
    ai_prompt_injection_guard: bool = True
    anthropic_api_key: SecretStr | None = None
    anthropic_max_retries: int = Field(default=0, ge=0, le=5)

    memory_chat_db_path: str = "memory_chat.sqlite3"
    memory_chat_window_turns: int = Field(default=20, ge=2, le=200)
    memory_chat_summary_trigger_turns: int = Field(default=10, ge=1, le=200)

    memory_quote_db_path: str = "memory_quote.sqlite3"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.ai_provider == "anthropic" and self.anthropic_api_key is None:
            raise ValueError("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic.")
        if self.app_env == "production" and self.internal_api_key is None:
            raise ValueError("INTERNAL_API_KEY is required in production.")
        if self.app_env == "production" and self.cors_origins.strip() == "*":
            raise ValueError("CORS_ORIGINS must be explicit in production.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
