from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.api.dependencies import get_memory_chat_service
from app.core.security import require_internal_api_key
from app.schemas.memory_chat import MemoryChatRequest, MemoryChatResponse
from app.services.memory_chat import MemoryChatService

router = APIRouter(dependencies=[Depends(require_internal_api_key)])


@router.post(
    "/memory-chat",
    response_model=MemoryChatResponse,
    status_code=status.HTTP_200_OK,
)
async def memory_chat(
    payload: MemoryChatRequest,
    request: Request,
    service: Annotated[MemoryChatService, Depends(get_memory_chat_service)],
) -> MemoryChatResponse:
    return await service.chat(payload, request_id=request.state.request_id)
