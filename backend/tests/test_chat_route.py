import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


def make_mock_provider(*chunks):
    async def _stream(messages, system_prompt):
        for chunk in chunks:
            yield chunk

    provider = MagicMock()
    provider.stream = _stream
    return provider


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_returns_sse_stream(client):
    with patch("app.routes.chat.get_provider", return_value=make_mock_provider("Hello", " world")):
        response = client.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "hi"}],
            },
        )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    body = response.text
    assert "data: Hello\n\n" in body
    assert "data: [DONE]\n\n" in body


def test_chat_escapes_newlines_in_chunks(client):
    with patch("app.routes.chat.get_provider", return_value=make_mock_provider("line1\nline2")):
        response = client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "hi"}]},
        )
    body = response.text
    assert "data: line1\\nline2\n\n" in body


def test_chat_with_custom_system_prompt(client):
    received = {}

    async def _stream(messages, system_prompt):
        received["system_prompt"] = system_prompt
        yield "ok"

    provider = MagicMock()
    provider.stream = _stream

    with patch("app.routes.chat.get_provider", return_value=provider):
        client.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "hi"}],
                "system_prompt": "Custom prompt.",
            },
        )
    assert received["system_prompt"] == "Custom prompt."
