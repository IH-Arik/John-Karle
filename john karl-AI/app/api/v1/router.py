from fastapi import APIRouter

from app.api.v1.endpoints import health, inference

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(inference.router, prefix="/ai", tags=["ai"])
