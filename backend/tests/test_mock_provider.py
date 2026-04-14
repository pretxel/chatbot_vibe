import pytest
from unittest.mock import patch
from app.models.schemas import Message
from app.services.providers.mock import MockProvider
from app.services.llm_service import get_provider


async def test_mock_provider_streams_words():
    provider = MockProvider()
    messages = [Message(role="user", content="hello")]

    with patch("app.services.providers.mock.asyncio.sleep"):
        chunks = []
        async for chunk in provider.stream(messages, "sys"):
            chunks.append(chunk)

    full = "".join(chunks)
    assert "hello" in full
    assert len(chunks) > 1  # multiple words yielded


async def test_mock_provider_echoes_last_user_message():
    provider = MockProvider()
    messages = [
        Message(role="user", content="first"),
        Message(role="assistant", content="response"),
        Message(role="user", content="my question"),
    ]

    with patch("app.services.providers.mock.asyncio.sleep"):
        chunks = []
        async for chunk in provider.stream(messages, "sys"):
            chunks.append(chunk)

    full = "".join(chunks)
    assert "my question" in full


def test_get_provider_returns_gemini_by_default():
    from app.services.providers.gemini import GeminiProvider
    with patch.dict("os.environ", {}, clear=False):
        import os
        os.environ.pop("LLM_PROVIDER", None)
        provider = get_provider()
    assert isinstance(provider, GeminiProvider)


def test_get_provider_returns_mock_when_env_set():
    from app.services.providers.mock import MockProvider
    with patch.dict("os.environ", {"LLM_PROVIDER": "mock"}):
        provider = get_provider()
    assert isinstance(provider, MockProvider)
