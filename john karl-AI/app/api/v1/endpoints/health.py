from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_inference_service
from app.core.errors import AppError
from app.schemas.health import HealthResponse
from app.services.inference import InferenceService

router = APIRouter()


@router.get("/live", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready", response_model=HealthResponse)
async def readiness(
    service: Annotated[InferenceService, Depends(get_inference_service)],
) -> HealthResponse:
    ready = await service.ready()
    if not ready:
        raise AppError(
            code="SERVICE_NOT_READY",
            message="The configured AI provider is not ready.",
            status_code=503,
        )
    return HealthResponse(status="ok")
