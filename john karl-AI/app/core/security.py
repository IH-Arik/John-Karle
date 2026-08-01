from secrets import compare_digest
from typing import Annotated

from fastapi import Depends, Header

from app.core.config import Settings, get_settings
from app.core.errors import AppError


async def require_internal_api_key(
    settings: Annotated[Settings, Depends(get_settings)],
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> None:
    configured_key = settings.internal_api_key
    if configured_key is None:
        return

    expected = configured_key.get_secret_value()
    if not x_api_key or not compare_digest(x_api_key, expected):
        raise AppError(
            code="INVALID_API_KEY",
            message="A valid API key is required.",
            status_code=401,
        )
