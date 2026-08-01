from fastapi import Request

from app.services.inference import InferenceService


def get_inference_service(request: Request) -> InferenceService:
    service = getattr(request.app.state, "inference_service", None)
    if not isinstance(service, InferenceService):
        raise RuntimeError("Inference service is not initialized.")
    return service
