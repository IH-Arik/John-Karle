from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.middleware.request_context import RequestContextMiddleware
from app.providers.factory import build_provider
from app.services.conversation_store import ConversationStore
from app.services.inference import InferenceService
from app.services.memory_chat import MemoryChatService
from app.services.memory_quote import MemoryQuoteService
from app.services.memory_quote_store import MemoryQuoteStore
from app.services.safety import PromptSafetyService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    provider = build_provider(settings)
    safety = PromptSafetyService(settings)
    app.state.inference_service = InferenceService(
        provider=provider,
        safety=safety,
        settings=settings,
    )
    conversations = ConversationStore(
        settings.memory_chat_db_path,
        window_turns=settings.memory_chat_window_turns,
        summary_trigger_turns=settings.memory_chat_summary_trigger_turns,
    )
    app.state.memory_chat_service = MemoryChatService(
        provider=provider,
        safety=safety,
        settings=settings,
        conversations=conversations,
    )
    app.state.memory_quote_service = MemoryQuoteService(
        provider=provider,
        safety=safety,
        settings=settings,
        store=MemoryQuoteStore(settings.memory_quote_db_path),
    )
    yield
    await provider.close()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Provider-neutral AI inference service for John Karl.",
        lifespan=lifespan,
    )
    application.add_middleware(RequestContextMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(application)
    application.include_router(api_router, prefix=settings.api_v1_prefix)

    @application.get("/", tags=["service"])
    async def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "environment": settings.app_env,
            "docs": "/docs",
        }

    return application


app = create_app()
