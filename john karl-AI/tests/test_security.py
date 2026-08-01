from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app


@pytest.fixture
def protected_client(monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    monkeypatch.setenv("INTERNAL_API_KEY", "test-secret")
    get_settings.cache_clear()
    try:
        with TestClient(create_app()) as client:
            yield client
    finally:
        get_settings.cache_clear()


def test_rejects_missing_internal_api_key(protected_client: TestClient) -> None:
    response = protected_client.post("/api/v1/ai/generate", json={"prompt": "Hello"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_API_KEY"


def test_accepts_configured_internal_api_key(protected_client: TestClient) -> None:
    response = protected_client.post(
        "/api/v1/ai/generate",
        json={"prompt": "Hello"},
        headers={"X-API-Key": "test-secret"},
    )

    assert response.status_code == 200
