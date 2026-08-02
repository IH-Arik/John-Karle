from fastapi import Request

from app.services.inference import InferenceService
from app.services.memory_chat import MemoryChatService
from app.services.memory_quote import MemoryQuoteService


def get_inference_service(request: Request) -> InferenceService:
    service = getattr(request.app.state, "inference_service", None)
    if not isinstance(service, InferenceService):
        raise RuntimeError("Inference service is not initialized.")
    return service


def get_memory_chat_service(request: Request) -> MemoryChatService:
    service = getattr(request.app.state, "memory_chat_service", None)
    if not isinstance(service, MemoryChatService):
        raise RuntimeError("Memory chat service is not initialized.")
    return service


def get_memory_quote_service(request: Request) -> MemoryQuoteService:
    service = getattr(request.app.state, "memory_quote_service", None)
    if not isinstance(service, MemoryQuoteService):
        raise RuntimeError("Memory quote service is not initialized.")
    return service
