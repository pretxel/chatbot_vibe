from unittest.mock import MagicMock, patch

import pytest

from app.models.schemas import Message


class _FakeTextStream:
    def __init__(self, chunks):
        self._chunks = chunks

    def __aiter__(self):
        return self._gen()

    async def _gen(self):
        for chunk in self._chunks:
            yield chunk


class _FakeStreamCtx:
    def __init__(self, chunks, raise_exc=None):
        self._chunks = chunks
        self._raise_exc = raise_exc
        self.text_stream = _FakeTextStream(chunks)

    async def __aenter__(self):
        if self._raise_exc is not None:
            raise self._raise_exc
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


def _build_fake_client(chunks=None, raise_exc=None):
    """Return a fake AsyncAnthropic-like client whose messages.stream(...) returns a
    context manager exposing an async-iterable text_stream."""
    client = MagicMock()
    client.messages = MagicMock()
    client.messages.stream = MagicMock(
        return_value=_FakeStreamCtx(chunks or [], raise_exc=raise_exc)
    )
    return client


async def test_claude_provider_streams_text_chunks():
    from app.services.providers.claude import ClaudeProvider

    fake_client = _build_fake_client(chunks=["Hello", " world", "!"])

    with patch(
        "app.services.providers.claude.AsyncAnthropic", return_value=fake_client
    ):
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "fake-key"}):
            provider = ClaudeProvider()
            out = []
            async for chunk in provider.stream(
                [Message(role="user", content="hi")], "Be helpful."
            ):
                out.append(chunk)

    assert out == ["Hello", " world", "!"]


async def test_claude_provider_skips_empty_chunks():
    from app.services.providers.claude import ClaudeProvider

    fake_client = _build_fake_client(chunks=["Hi", "", "there"])

    with patch(
        "app.services.providers.claude.AsyncAnthropic", return_value=fake_client
    ):
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "fake-key"}):
            provider = ClaudeProvider()
            out = [
                c
                async for c in provider.stream(
                    [Message(role="user", content="hi")], "sys"
                )
            ]

    assert out == ["Hi", "there"]


async def test_claude_provider_passes_messages_and_system():
    from app.services.providers.claude import ClaudeProvider

    fake_client = _build_fake_client(chunks=["ok"])

    with patch(
        "app.services.providers.claude.AsyncAnthropic", return_value=fake_client
    ):
        with patch.dict(
            "os.environ",
            {"ANTHROPIC_API_KEY": "fake-key", "ANTHROPIC_MODEL": "claude-test-model"},
        ):
            provider = ClaudeProvider()
            async for _ in provider.stream(
                [
                    Message(role="user", content="ping"),
                    Message(role="assistant", content="pong"),
                    Message(role="user", content="again"),
                ],
                "Be concise.",
            ):
                pass

    kwargs = fake_client.messages.stream.call_args.kwargs
    assert kwargs["model"] == "claude-test-model"
    assert kwargs["system"] == "Be concise."
    assert kwargs["messages"] == [
        {"role": "user", "content": "ping"},
        {"role": "assistant", "content": "pong"},
        {"role": "user", "content": "again"},
    ]


async def test_claude_provider_propagates_client_errors():
    from app.services.providers.claude import ClaudeProvider

    fake_client = _build_fake_client(raise_exc=RuntimeError("boom"))

    with patch(
        "app.services.providers.claude.AsyncAnthropic", return_value=fake_client
    ):
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "fake-key"}):
            provider = ClaudeProvider()
            with pytest.raises(RuntimeError, match="boom"):
                async for _ in provider.stream(
                    [Message(role="user", content="hi")], "sys"
                ):
                    pass


async def test_claude_provider_raises_when_api_key_missing():
    from app.services.providers.claude import ClaudeProvider

    with patch.dict("os.environ", {}, clear=False):
        import os

        os.environ.pop("ANTHROPIC_API_KEY", None)
        provider = ClaudeProvider()
        with pytest.raises(KeyError):
            async for _ in provider.stream(
                [Message(role="user", content="hi")], "sys"
            ):
                pass


def test_get_provider_returns_claude_when_env_set():
    from app.services.llm_service import get_provider
    from app.services.providers.claude import ClaudeProvider

    with patch.dict("os.environ", {"LLM_PROVIDER": "claude"}):
        provider = get_provider()
    assert isinstance(provider, ClaudeProvider)


def test_get_provider_claude_env_is_case_insensitive():
    from app.services.llm_service import get_provider
    from app.services.providers.claude import ClaudeProvider

    with patch.dict("os.environ", {"LLM_PROVIDER": "CLAUDE"}):
        provider = get_provider()
    assert isinstance(provider, ClaudeProvider)
