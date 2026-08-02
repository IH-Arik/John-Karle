from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app

_MEMORY = {
    "type": "journal",
    "title": "Summer at Lake Geneva",
    "narrative": "The whole family gathered at the lake house. Mom made lemonade.",
    "date": "1978-08-14",
    "tags": ["Family", "Summer", "Lake"],
}


@pytest.fixture
def memory_chat_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[TestClient, None, None]:
    # Point conversation storage at a throwaway file so tests don't leak a
    # sqlite database into the repo working directory or pollute each other.
    monkeypatch.setenv("MEMORY_CHAT_DB_PATH", str(tmp_path / "memory_chat_test.sqlite3"))
    get_settings.cache_clear()
    try:
        with TestClient(create_app()) as test_client:
            yield test_client
    finally:
        get_settings.cache_clear()


def test_memory_chat_answers_when_grounded(memory_chat_client: TestClient) -> None:
    response = memory_chat_client.post(
        "/api/v1/ai/memory-chat",
        json={
            "conversation_id": "conv-grounded",
            "person": "Margaret",
            "question": "What happened at the lake?",
            "memories": [_MEMORY],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "Summer at Lake Geneva" in body["answer"]
    assert body["citations"][0]["memory_title"] == "Summer at Lake Geneva"


def test_memory_chat_declines_when_not_grounded(memory_chat_client: TestClient) -> None:
    response = memory_chat_client.post(
        "/api/v1/ai/memory-chat",
        json={
            "conversation_id": "conv-ungrounded",
            "person": "Margaret",
            "question": "What was her favorite spaceship?",
            "memories": [_MEMORY],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert "don't have that information" in body["answer"].lower()
    assert body["citations"] == []


def test_memory_chat_rejects_unknown_fields(memory_chat_client: TestClient) -> None:
    response = memory_chat_client.post(
        "/api/v1/ai/memory-chat",
        json={
            "conversation_id": "conv-invalid",
            "person": "Margaret",
            "question": "Hello",
            "memories": [],
            "unexpected": True,
        },
    )

    assert response.status_code == 422


def test_memory_chat_rejects_blank_question(memory_chat_client: TestClient) -> None:
    response = memory_chat_client.post(
        "/api/v1/ai/memory-chat",
        json={
            "conversation_id": "conv-blank",
            "person": "Margaret",
            "question": "   ",
            "memories": [],
        },
    )

    assert response.status_code == 422


def test_memory_chat_requires_configured_api_key(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("MEMORY_CHAT_DB_PATH", str(tmp_path / "memory_chat_test.sqlite3"))
    monkeypatch.setenv("INTERNAL_API_KEY", "test-secret")
    get_settings.cache_clear()
    try:
        with TestClient(create_app()) as protected_client:
            response = protected_client.post(
                "/api/v1/ai/memory-chat",
                json={
                    "conversation_id": "conv-auth",
                    "person": "Margaret",
                    "question": "Hello",
                    "memories": [],
                },
            )
    finally:
        get_settings.cache_clear()

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_API_KEY"


def test_memory_chat_persists_multi_turn_conversation(memory_chat_client: TestClient) -> None:
    conversation_id = "conv-multi-turn"
    first = memory_chat_client.post(
        "/api/v1/ai/memory-chat",
        json={
            "conversation_id": conversation_id,
            "person": "Margaret",
            "question": "What happened at the lake?",
            "memories": [_MEMORY],
        },
    )
    second = memory_chat_client.post(
        "/api/v1/ai/memory-chat",
        json={
            "conversation_id": conversation_id,
            "person": "Margaret",
            "question": "Who else was there?",
            "memories": [_MEMORY],
        },
    )

    assert first.status_code == 200
    assert second.status_code == 200
