from fastapi import APIRouter

from app.api.v1.endpoints import health, inference, memory_chat, memory_quote

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(inference.router, prefix="/ai", tags=["ai"])
router.include_router(memory_chat.router, prefix="/ai", tags=["ai", "memory-chat"])
router.include_router(memory_quote.router, prefix="/ai", tags=["ai", "memory-quote"])
