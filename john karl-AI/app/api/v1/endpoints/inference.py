from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.api.dependencies import get_inference_service
from app.core.security import require_internal_api_key
from app.schemas.inference import GenerateRequest, GenerateResponse
from app.services.inference import InferenceService

router = APIRouter(dependencies=[Depends(require_internal_api_key)])


@router.post(
    "/generate",
    response_model=GenerateResponse,
    status_code=status.HTTP_200_OK,
)
async def generate(
    payload: GenerateRequest,
    request: Request,
    service: Annotated[InferenceService, Depends(get_inference_service)],
) -> GenerateResponse:
    return await service.generate(payload, request_id=request.state.request_id)
