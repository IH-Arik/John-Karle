from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.api.dependencies import get_memory_quote_service
from app.core.errors import AppError
from app.core.security import require_internal_api_key
from app.schemas.memory_quote import (
    CachedMemoryQuoteResponse,
    MemoryQuoteRequest,
    MemoryQuoteResponse,
)
from app.services.memory_quote import MemoryQuoteService

router = APIRouter(dependencies=[Depends(require_internal_api_key)])


@router.post(
    "/memory-quote",
    response_model=MemoryQuoteResponse,
    status_code=status.HTTP_200_OK,
)
async def memory_quote(
    payload: MemoryQuoteRequest,
    request: Request,
    service: Annotated[MemoryQuoteService, Depends(get_memory_quote_service)],
) -> MemoryQuoteResponse:
    """Generates (or regenerates) the quote/commentary and caches it.

    Called by the backend on memory save/edit -- see the "Data contract
    (sync vs. async)" decision: the backend does not wait on this call.
    """
    return await service.generate(payload, request_id=request.state.request_id)


@router.get(
    "/memory-quote/{memory_id}",
    response_model=CachedMemoryQuoteResponse,
    status_code=status.HTTP_200_OK,
)
async def get_memory_quote(
    memory_id: str,
    service: Annotated[MemoryQuoteService, Depends(get_memory_quote_service)],
) -> CachedMemoryQuoteResponse:
    """Cheap, no-model-call fetch -- this is what "not regenerated on every
    detail-screen view" means: the backend/detail screen reads this, not
    the POST endpoint above."""
    cached = await service.get_cached(memory_id)
    if cached is None:
        raise AppError(
            code="MEMORY_QUOTE_NOT_FOUND",
            message="No generated quote exists yet for this memory.",
            status_code=404,
        )
    return cached
