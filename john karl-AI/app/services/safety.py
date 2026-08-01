import re

from app.core.config import Settings
from app.core.errors import AppError


class PromptSafetyService:
    _injection_patterns = (
        re.compile(r"\bignore (all|any|the) previous instructions\b", re.IGNORECASE),
        re.compile(r"\breveal (the )?(system|developer) prompt\b", re.IGNORECASE),
        re.compile(r"\bshow (me )?(your )?(hidden|system) instructions\b", re.IGNORECASE),
    )

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def validate(self, prompt: str, system_prompt: str | None) -> None:
        combined_length = len(prompt) + len(system_prompt or "")
        if combined_length > self._settings.ai_max_input_chars:
            raise AppError(
                code="INPUT_TOO_LARGE",
                message="The AI input exceeds the configured size limit.",
                status_code=413,
            )

        if "\x00" in prompt or (system_prompt is not None and "\x00" in system_prompt):
            raise AppError(
                code="INVALID_INPUT",
                message="The AI input contains unsupported control characters.",
                status_code=400,
            )

        if self._settings.ai_prompt_injection_guard:
            combined = f"{system_prompt or ''}\n{prompt}"
            if any(pattern.search(combined) for pattern in self._injection_patterns):
                raise AppError(
                    code="PROMPT_INJECTION_DETECTED",
                    message="The AI input was rejected by the prompt safety policy.",
                    status_code=400,
                )
