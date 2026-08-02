from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app

_JOURNAL_MEMORY = {
    "type": "journal",
    "title": "Mom's 60th Birthday Surprise",
    "narrative": "The whole family gathered at the lake house for a surprise party.",
    "date": "2026-07-15",
    "tags": ["Family", "Birthday"],
}

_PHOTO_MEMORY = {
    "type": "photo",
    "title": "Summer at Lake Geneva",
    "narrative": "The whole family gathered at the lake house. Mom made lemonade.",
    "date": "1978-08-14",
    "tags": ["Family", "Summer", "Lake"],
    "location": "Lake Geneva, WI",
}


@pytest.fixture
def memory_quote_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[TestClient, None, None]:
    # Isolate the quote-cache database per test run, same reasoning as
    # Memory Chat's conversation store: don't leak a sqlite file into the
    # repo directory or let tests share state.
    monkeypatch.setenv("MEMORY_QUOTE_DB_PATH", str(tmp_path / "memory_quote_test.sqlite3"))
    get_settings.cache_clear()
    try:
        with TestClient(create_app()) as test_client:
            yield test_client
    finally:
        get_settings.cache_clear()


def test_memory_quote_returns_pull_quote_and_commentary(
    memory_quote_client: TestClient,
) -> None:
    response = memory_quote_client.post(
        "/api/v1/ai/memory-quote",
        json={"memory_id": "mem-1", "person": "Margaret", "memory": _JOURNAL_MEMORY},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["pull_quote"]
    assert body["commentary"]
    assert "Lineage.AI" in body["commentary"]


def test_memory_quote_works_for_photo_type(memory_quote_client: TestClient) -> None:
    response = memory_quote_client.post(
        "/api/v1/ai/memory-quote",
        json={"memory_id": "mem-2", "person": "Margaret", "memory": _PHOTO_MEMORY},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["pull_quote"]
    assert body["commentary"]


def test_memory_quote_rejects_unknown_fields(memory_quote_client: TestClient) -> None:
    response = memory_quote_client.post(
        "/api/v1/ai/memory-quote",
        json={
            "memory_id": "mem-3",
            "person": "Margaret",
            "memory": _JOURNAL_MEMORY,
            "unexpected": True,
        },
    )

    assert response.status_code == 422


def test_memory_quote_rejects_blank_person(memory_quote_client: TestClient) -> None:
    response = memory_quote_client.post(
        "/api/v1/ai/memory-quote",
        json={"memory_id": "mem-4", "person": "   ", "memory": _JOURNAL_MEMORY},
    )

    assert response.status_code == 422


def test_memory_quote_fetch_returns_404_when_not_generated_yet(
    memory_quote_client: TestClient,
) -> None:
    response = memory_quote_client.get("/api/v1/ai/memory-quote/never-generated")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "MEMORY_QUOTE_NOT_FOUND"


def test_memory_quote_fetch_returns_cached_result_after_generation(
    memory_quote_client: TestClient,
) -> None:
    generate_response = memory_quote_client.post(
        "/api/v1/ai/memory-quote",
        json={"memory_id": "mem-5", "person": "Margaret", "memory": _JOURNAL_MEMORY},
    )
    fetch_response = memory_quote_client.get("/api/v1/ai/memory-quote/mem-5")

    assert generate_response.status_code == 200
    assert fetch_response.status_code == 200
    generated = generate_response.json()
    cached = fetch_response.json()
    assert cached["memory_id"] == "mem-5"
    assert cached["pull_quote"] == generated["pull_quote"]
    assert cached["commentary"] == generated["commentary"]


def test_memory_quote_requires_configured_api_key(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("MEMORY_QUOTE_DB_PATH", str(tmp_path / "memory_quote_test.sqlite3"))
    monkeypatch.setenv("INTERNAL_API_KEY", "test-secret")
    get_settings.cache_clear()
    try:
        with TestClient(create_app()) as protected_client:
            response = protected_client.post(
                "/api/v1/ai/memory-quote",
                json={"memory_id": "mem-6", "person": "Margaret", "memory": _JOURNAL_MEMORY},
            )
    finally:
        get_settings.cache_clear()

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_API_KEY"
