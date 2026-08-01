import logging
import re
from collections.abc import Awaitable, Callable
from time import perf_counter
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

logger = logging.getLogger("john_karl_ai.access")
request_id_pattern = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


class RequestContextMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", "").strip()
        if not request_id_pattern.fullmatch(request_id):
            request_id = str(uuid4())

        request.state.request_id = request_id
        started = perf_counter()
        response = await call_next(request)
        latency_ms = round((perf_counter() - started) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        logger.info(
            "request_completed method=%s path=%s status=%s latency_ms=%s request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            latency_ms,
            request_id,
        )
        return response
